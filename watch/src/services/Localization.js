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
    saveSettings: 'Save Settings',
    savedStatus: 'Saved ✓',
    language: 'Language',
    langAuto: 'Auto',
    langEn: 'English',
    langRu: 'Русский',
    keepScreenOn: 'Keep Screen On',
    customBrightness: 'Custom Brightness',
    enabled: 'ON',
    disabled: 'OFF',
    brightness: 'Brightness',
    sampleText: 'Sample Text',
    fontSize: 'Font Size',
    bufferSize: 'Buffer (chars)',
    edgePadding: 'Top/Bottom Padding',
    storageTitle: 'Storage',
    storageUsed: 'Used',
    storageBooks: 'Books',
    storageSystem: 'System',
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
    saveSettings: 'Сохранить',
    savedStatus: 'Сохранено ✓',
    language: 'Язык',
    langAuto: 'Авто',
    langEn: 'English',
    langRu: 'Русский',
    keepScreenOn: 'Не гасить экран',
    customBrightness: 'Своя яркость',
    enabled: 'ВКЛ',
    disabled: 'ВЫКЛ',
    brightness: 'Яркость',
    sampleText: 'Пример текста',
    fontSize: 'Размер шрифта',
    bufferSize: 'Буфер (симв.)',
    edgePadding: 'Отступы краев',
    storageTitle: 'Память',
    storageUsed: 'Занято',
    storageBooks: 'Книги',
    storageSystem: 'Система',
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

export function pctToHardwareBrightness(pct) {
  const clamped = Math.max(1, Math.min(100, pct || 50));
  return Math.max(1, Math.min(255, Math.round((clamped / 100) * 255)));
}
