import configuration from '@system.configuration'

const DICTIONARY = {
  en: {
    appName: 'Wrist Book',
    settings: 'Settings',
    emptyTitle: 'No Books Yet',
    emptySubtitle: 'Send text from phone',
    deleteBook: 'Delete',
    confirmDelete: 'Sure?',
    loading: 'Loading...',
    fileError: 'File Error',
    emptyFile: 'Empty File',
    readError: 'Read Error',
    back: '← Back',
    save: 'Save Settings',
    language: 'Language',
    langAuto: 'Auto',
    langEn: 'English',
    langRu: 'Русский',
    keepScreenOn: 'Keep Screen On',
    customBrightness: 'Custom Bright',
    enabled: 'ON',
    disabled: 'OFF',
    brightness: 'Brightness',
    fontSize: 'Font Size',
    bufferSize: 'Buffer Limit',
    edgePadding: 'Top/Bottom Margin',
    storageTitle: 'Memory Info',
    storageUsed: 'Used',
    storageBooks: 'Books',
    storageSystem: 'System',
    storageFree: 'Free Space',
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
    emptySubtitle: 'Отправьте текст с телефона',
    deleteBook: 'Удалить',
    confirmDelete: 'Точно?',
    loading: 'Загрузка...',
    fileError: 'Ошибка файла',
    emptyFile: 'Пустой файл',
    readError: 'Ошибка чтения',
    back: '← Отмена',
    save: 'Сохранить',
    language: 'Язык',
    langAuto: 'Авто',
    langEn: 'English',
    langRu: 'Русский',
    keepScreenOn: 'Не гасить экран',
    customBrightness: 'Своя яркость',
    enabled: 'ВКЛ',
    disabled: 'ВЫКЛ',
    brightness: 'Яркость',
    fontSize: 'Размер шрифта',
    bufferSize: 'Окно памяти',
    edgePadding: 'Отступы сверху/снизу',
    storageTitle: 'Сведения о памяти',
    storageUsed: 'Занято',
    storageBooks: 'Книги',
    storageSystem: 'Система',
    storageFree: 'Свободно',
    resetSettings: 'Сброс настроек',
    resetConfirm: 'Сбросить всё?',
    syncTitle: 'Синхронизация',
    statusWaiting: 'Ожидание...',
    statusConnected: 'Связь ОК',
    statusReceiving: 'Прием...',
    statusCompleted: 'Готово!',
    statusError: 'Ошибка записи'
  }
};

export function resolveLanguageCode(preferredMode) {
  if (preferredMode === 'en' || preferredMode === 'ru') return preferredMode;
  try {
    const locale = configuration.getLocale();
    if (locale && locale.language && locale.language.toLowerCase().indexOf('ru') === 0) return 'ru';
  } catch (e) {}
  return 'en';
}

export function getStrings(preferredMode) {
  return DICTIONARY[resolveLanguageCode(preferredMode || 'auto')] || DICTIONARY.en;
}
