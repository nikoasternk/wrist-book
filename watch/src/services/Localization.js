import configuration from '@system.configuration'

const DICTIONARY = {
  en: {
    appName: 'Wrist Book',
    settings: 'Settings',
    emptyTitle: 'No Books Yet',
    emptySubtitle: 'Send text or a TXT file from your phone',
    deleteBook: 'Delete',
    confirmDelete: 'Sure?',
    loading: 'Loading...',
    fileError: 'File Error',
    emptyFile: 'Empty File',
    readError: 'Read Error',
    back: '← Back',
    language: 'Language',
    langAuto: 'Auto',
    langEn: 'English',
    langRu: 'Русский',
    keepScreenOn: 'Keep Screen On',
    enabled: 'ENABLED',
    disabled: 'DISABLED',
    brightness: 'Brightness',
    sampleText: 'Sample Text',
    fontSize: 'Font Size',
    bufferSize: 'Buffer (chars)',
    edgePadding: 'Top/Bottom Padding',
    storageTitle: 'Storage',
    storageUsed: 'Used',
    storageBooks: 'Books',
    storageSystem: 'Config/Cache',
    storageFree: 'Free',
    resetSettings: 'Reset Settings',
    resetConfirm: 'Confirm Reset?',
    syncTitle: 'Syncing',
    statusWaiting: 'Waiting...',
    statusConnected: 'Connected',
    statusReceiving: 'Receiving...',
    statusCompleted: 'Completed!',
    statusError: 'Write Error'
  },
  ru: {
    appName: 'Wrist Book',
    settings: 'Настройки',
    emptyTitle: 'Полка пуста',
    emptySubtitle: 'Отправьте текст или файл с телефона',
    deleteBook: 'Удалить',
    confirmDelete: 'Точно?',
    loading: 'Загрузка...',
    fileError: 'Ошибка файла',
    emptyFile: 'Пустой файл',
    readError: 'Ошибка чтения',
    back: '← Назад',
    language: 'Язык',
    langAuto: 'Авто',
    langEn: 'English',
    langRu: 'Русский',
    keepScreenOn: 'Не гасить экран',
    enabled: 'ВКЛЮЧЕНО',
    disabled: 'ВЫКЛЮЧЕНО',
    brightness: 'Яркость',
    sampleText: 'Пример текста',
    fontSize: 'Размер шрифта',
    bufferSize: 'Буфер (симв.)',
    edgePadding: 'Отступы сверху/снизу',
    storageTitle: 'Память',
    storageUsed: 'Занято',
    storageBooks: 'Книги',
    storageSystem: 'Кэш/Настр.',
    storageFree: 'Свободно',
    resetSettings: 'Сброс настроек',
    resetConfirm: 'Точно сбросить?',
    syncTitle: 'Синхронизация',
    statusWaiting: 'Ожидание...',
    statusConnected: 'Связь ОК',
    statusReceiving: 'Прием...',
    statusCompleted: 'Готово!',
    statusError: 'Ошибка записи'
  }
};

export function resolveLanguageCode(preferredMode) {
  if (preferredMode === 'en' || preferredMode === 'ru') {
    return preferredMode;
  }
  try {
    const locale = configuration.getLocale();
    if (locale && locale.language && locale.language.toLowerCase().indexOf('ru') === 0) {
      return 'ru';
    }
  } catch (e) {}
  return 'en';
}

export function getStrings(preferredMode) {
  const code = resolveLanguageCode(preferredMode || 'auto');
  return DICTIONARY[code] || DICTIONARY.en;
}

export function applySafeBrightness(pct) {
  const safePct = Math.max(10, Math.min(100, pct || 100));
  const hwValue = Math.round(90 + ((safePct - 10) / 90) * 165);
  const rgbChannel = Math.round(110 + ((safePct - 10) / 90) * 145);
  return {
    hwValue: hwValue,
    textColor: `rgb(${rgbChannel},${rgbChannel},${rgbChannel})`
  };
}
