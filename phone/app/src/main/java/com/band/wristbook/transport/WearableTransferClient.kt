package com.band.wristbook.transport

import android.content.Context
import com.xiaomi.xms.wearable.Wearable
import com.xiaomi.xms.wearable.auth.Permission
import com.xiaomi.xms.wearable.message.OnMessageReceivedListener
import com.xiaomi.xms.wearable.node.Node
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import org.json.JSONTokener

enum class TransferError {
    BAND_NOT_FOUND,
    WATCH_UNRESPONSIVE,
    FILE_INIT_FAILED,
    PACKET_SEND_FAILED,
    BLOCK_ACK_TIMEOUT
}

class WearableTransferClient(context: Context, private val scope: CoroutineScope) {
    private val nodeApi = Wearable.getNodeApi(context)
    private val authApi = Wearable.getAuthApi(context)
    private val messageApi = Wearable.getMessageApi(context)
    private var activeNode: Node? = null

    private var handshakeDeferred: CompletableDeferred<Boolean>? = null
    private var transferAckDeferred: CompletableDeferred<JSONObject>? = null

    private val messageListener = OnMessageReceivedListener { _, bytes ->
        try {
            var text = bytes.decodeToString().trim()
            if (text.startsWith("\"") && text.endsWith("\"")) {
                text = JSONTokener(text).nextValue().toString()
            }
            val packet = JSONObject(text)
            val tag = packet.optString("tag")
            if (tag == "handshake") {
                val step = packet.optInt("step", 0)
                if (step > 0) {
                    handshakeDeferred?.complete(true)
                }
                if (step < 2) {
                    val reply = JSONObject().put("tag", "handshake").put("step", step + 1).toString()
                    activeNode?.let { messageApi.sendMessage(it.id, reply.toByteArray(Charsets.UTF_8)) }
                }
            } else if (tag == "book") {
                transferAckDeferred?.complete(packet)
            }
        } catch (_: Exception) {}
    }

    suspend fun queryConnectedBand(): Result<String> {
        val deferred = CompletableDeferred<Result<String>>()
        nodeApi.connectedNodes.addOnSuccessListener { nodes ->
            if (nodes.isNullOrEmpty()) {
                deferred.complete(Result.failure(Exception()))
            } else {
                val node = nodes[0]
                activeNode = node
                val permissions = arrayOf(Permission.DEVICE_MANAGER)
                authApi.checkPermissions(node.id, permissions).addOnSuccessListener { granted ->
                    if (granted.isNotEmpty() && !granted[0]) {
                        authApi.requestPermission(node.id, Permission.DEVICE_MANAGER)
                            .addOnSuccessListener {
                                deferred.complete(Result.success(node.name ?: "Band 10"))
                            }
                            .addOnFailureListener {
                                deferred.complete(Result.success(node.name ?: "Band 10"))
                            }
                    } else {
                        deferred.complete(Result.success(node.name ?: "Band 10"))
                    }
                }.addOnFailureListener {
                    deferred.complete(Result.success(node.name ?: "Band 10"))
                }
            }
        }.addOnFailureListener { e ->
            deferred.complete(Result.failure(e))
        }
        return deferred.await()
    }

    private suspend fun unregisterListener(nodeId: String) {
        val deferred = CompletableDeferred<Unit>()
        messageApi.removeListener(nodeId)
            .addOnSuccessListener { deferred.complete(Unit) }
            .addOnFailureListener { deferred.complete(Unit) }
        deferred.await()
    }

    private suspend fun registerListener(nodeId: String): Boolean {
        val deferred = CompletableDeferred<Boolean>()
        messageApi.addListener(nodeId, messageListener)
            .addOnSuccessListener { deferred.complete(true) }
            .addOnFailureListener { deferred.complete(false) }
        return deferred.await()
    }

    private suspend fun launchTransferPage(nodeId: String): Boolean {
        val deferred = CompletableDeferred<Boolean>()
        nodeApi.launchWearApp(nodeId, "/pages/transfer")
            .addOnSuccessListener { deferred.complete(true) }
            .addOnFailureListener { deferred.complete(false) }
        return deferred.await()
    }

    private suspend fun sendPacket(nodeId: String, jsonString: String): Boolean {
        val deferred = CompletableDeferred<Boolean>()
        messageApi.sendMessage(nodeId, jsonString.toByteArray(Charsets.UTF_8))
            .addOnSuccessListener { deferred.complete(true) }
            .addOnFailureListener { deferred.complete(false) }
        return deferred.await()
    }

    fun transferBook(
        fileName: String,
        content: String,
        onProgress: (Float) -> Unit,
        onSuccess: () -> Unit,
        onError: (TransferError) -> Unit
    ) {
        scope.launch(Dispatchers.IO) {
            val connection = queryConnectedBand()
            if (connection.isFailure || activeNode == null) {
                withContext(Dispatchers.Main) { onError(TransferError.BAND_NOT_FOUND) }
                return@launch
            }

            val nodeId = activeNode!!.id
            unregisterListener(nodeId)
            registerListener(nodeId)
            launchTransferPage(nodeId)
            delay(800)

            handshakeDeferred = CompletableDeferred()
            val handshakeInit = JSONObject().put("tag", "handshake").put("step", 0).toString()

            var connected = false
            for (attempt in 1..10) {
                sendPacket(nodeId, handshakeInit)
                val ack = withTimeoutOrNull(650) { handshakeDeferred?.await() }
                if (ack == true) {
                    connected = true
                    break
                }
            }

            if (!connected) {
                unregisterListener(nodeId)
                withContext(Dispatchers.Main) { onError(TransferError.WATCH_UNRESPONSIVE) }
                return@launch
            }

            val chunks = content.chunked(4000)
            val totalChunks = (chunks.size - 1).coerceAtLeast(0)

            transferAckDeferred = CompletableDeferred()
            val startPacket = JSONObject()
                .put("tag", "book")
                .put("action", "start")
                .put("fileName", fileName)
                .put("totalChunks", totalChunks)
                .toString()

            sendPacket(nodeId, startPacket)

            val readyResponse = withTimeoutOrNull(5000) { transferAckDeferred?.await() }
            if (readyResponse == null || readyResponse.optString("status") != "ready") {
                unregisterListener(nodeId)
                withContext(Dispatchers.Main) { onError(TransferError.FILE_INIT_FAILED) }
                return@launch
            }

            for (index in chunks.indices) {
                transferAckDeferred = CompletableDeferred()
                val chunkPacket = JSONObject()
                    .put("tag", "book")
                    .put("action", "chunk")
                    .put("index", index)
                    .put("payload", chunks[index])
                    .toString()

                if (!sendPacket(nodeId, chunkPacket)) {
                    unregisterListener(nodeId)
                    withContext(Dispatchers.Main) { onError(TransferError.PACKET_SEND_FAILED) }
                    return@launch
                }

                val ack = withTimeoutOrNull(6000) { transferAckDeferred?.await() }
                val status = ack?.optString("status")
                if (status != "next" && status != "completed") {
                    unregisterListener(nodeId)
                    withContext(Dispatchers.Main) { onError(TransferError.BLOCK_ACK_TIMEOUT) }
                    return@launch
                }

                withContext(Dispatchers.Main) {
                    onProgress((index + 1).toFloat() / chunks.size.toFloat())
                }
            }

            unregisterListener(nodeId)
            withContext(Dispatchers.Main) { onSuccess() }
        }
    }
}