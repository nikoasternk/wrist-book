import file from '@system.file'

const BOOKS_DIRECTORY = 'internal://files/books/';

function encodeUtf16Le(text) {
  const buffer = new ArrayBuffer(text.length * 2);
  const view = new Uint16Array(buffer);
  for (let i = 0; i < text.length; i++) {
    view[i] = text.charCodeAt(i);
  }
  return new Uint8Array(buffer);
}

export default class BookReceiver {
  constructor(bridge) {
    this.bridge = bridge;
    this.transferListener = null;
    this.currentFileName = '';
    this.totalChunks = 0;
    this.expectedIndex = 0;

    this.bridge.registerHandler('book', (packet) => this.handlePacket(packet));
  }

  setTransferListener(callback) {
    this.transferListener = callback;
  }

  handlePacket(packet) {
    if (packet.action === 'start') {
      this.currentFileName = packet.fileName;
      this.totalChunks = packet.totalChunks;
      this.expectedIndex = 0;

      file.mkdir({
        uri: BOOKS_DIRECTORY,
        success: () => this.resetTargetFile(),
        fail: () => this.resetTargetFile()
      });
    } else if (packet.action === 'chunk') {
      if (packet.index !== this.expectedIndex) {
        this.bridge.sendPacket({
          tag: 'book',
          status: 'error',
          expectedIndex: this.expectedIndex
        });
        return;
      }

      const binaryData = encodeUtf16Le(packet.payload);
      const targetUri = BOOKS_DIRECTORY + this.currentFileName;

      file.writeArrayBuffer({
        uri: targetUri,
        buffer: binaryData,
        append: packet.index > 0,
        success: () => {
          this.expectedIndex++;
          const ratio = this.totalChunks > 0 ? (packet.index / this.totalChunks) : 1;
          if (this.transferListener) {
            this.transferListener({
              state: 'progress',
              fileName: this.currentFileName,
              progress: ratio
            });
          }

          if (packet.index >= this.totalChunks) {
            this.bridge.sendPacket({
              tag: 'book',
              status: 'completed',
              index: packet.index
            });
            if (this.transferListener) {
              this.transferListener({ state: 'completed' });
            }
          } else {
            this.bridge.sendPacket({
              tag: 'book',
              status: 'next',
              index: this.expectedIndex
            });
          }
        },
        fail: () => {
          this.bridge.sendPacket({
            tag: 'book',
            status: 'error',
            index: this.expectedIndex
          });
          if (this.transferListener) {
            this.transferListener({ state: 'error' });
          }
        }
      });
    }
  }

  resetTargetFile() {
    const targetUri = BOOKS_DIRECTORY + this.currentFileName;
    file.delete({
      uri: targetUri,
      complete: () => {
        this.bridge.sendPacket({
          tag: 'book',
          status: 'ready'
        });
      }
    });
  }
}