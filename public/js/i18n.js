const translations = {
  az: {
    'menu.game': 'Oyun',
    'menu.tiktok': 'TikTok Yüklə',
    'menu.qr': 'QR Kod',
    'menu.settings': 'Ayarlar',
    'game.scored': 'Sənin nəticən',
    'game.restart': 'Yenidən',
    'tiktok.title': 'TikTok Video Yüklə',
    'tiktok.subtitle': 'Su nişansız HD video',
    'tiktok.download': 'Yüklə',
    'tiktok.loading': 'Yüklənir...',
    'qr.title': 'QR Kod Generator',
    'qr.subtitle': 'İstənilən mətn və ya link',
    'qr.size': 'Ölçü',
    'qr.generate': 'Yarat',
    'qr.download': 'Yüklə',
    'settings.title': 'Ayarlar',
    'settings.language': 'Dil',
    'settings.theme': 'Tema',
    'settings.sound': 'Səs',
    'settings.difficulty': 'Çətinlik',
    'settings.hint': 'Render keep-alive hər 2 dəqiqədə avtomatik işləyir.'
  },
  en: {
    'menu.game': 'Game',
    'menu.tiktok': 'TikTok Download',
    'menu.qr': 'QR Code',
    'menu.settings': 'Settings',
    'game.scored': 'You scored',
    'game.restart': 'Restart',
    'tiktok.title': 'TikTok Video Download',
    'tiktok.subtitle': 'Watermark-free HD video',
    'tiktok.download': 'Download',
    'tiktok.loading': 'Loading...',
    'qr.title': 'QR Code Generator',
    'qr.subtitle': 'Any text or link',
    'qr.size': 'Size',
    'qr.generate': 'Generate',
    'qr.download': 'Download',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.sound': 'Sound',
    'settings.difficulty': 'Difficulty',
    'settings.hint': 'Render keep-alive runs automatically every 2 minutes.'
  },
  tr: {
    'menu.game': 'Oyun',
    'menu.tiktok': 'TikTok İndir',
    'menu.qr': 'QR Kod',
    'menu.settings': 'Ayarlar',
    'game.scored': 'Skorun',
    'game.restart': 'Tekrar',
    'tiktok.title': 'TikTok Video İndir',
    'tiktok.subtitle': 'Filigransız HD video',
    'tiktok.download': 'İndir',
    'tiktok.loading': 'Yükleniyor...',
    'qr.title': 'QR Kod Oluşturucu',
    'qr.subtitle': 'Herhangi metin veya link',
    'qr.size': 'Boyut',
    'qr.generate': 'Oluştur',
    'qr.download': 'İndir',
    'settings.title': 'Ayarlar',
    'settings.language': 'Dil',
    'settings.theme': 'Tema',
    'settings.sound': 'Ses',
    'settings.difficulty': 'Zorluk',
    'settings.hint': 'Render keep-alive her 2 dakikada otomatik çalışır.'
  },
  ru: {
    'menu.game': 'Игра',
    'menu.tiktok': 'Скачать TikTok',
    'menu.qr': 'QR Код',
    'menu.settings': 'Настройки',
    'game.scored': 'Твой счёт',
    'game.restart': 'Заново',
    'tiktok.title': 'Скачать TikTok',
    'tiktok.subtitle': 'Видео без водяного знака',
    'tiktok.download': 'Скачать',
    'tiktok.loading': 'Загрузка...',
    'qr.title': 'Генератор QR',
    'qr.subtitle': 'Любой текст или ссылка',
    'qr.size': 'Размер',
    'qr.generate': 'Создать',
    'qr.download': 'Скачать',
    'settings.title': 'Настройки',
    'settings.language': 'Язык',
    'settings.theme': 'Тема',
    'settings.sound': 'Звук',
    'settings.difficulty': 'Сложность',
    'settings.hint': 'Render keep-alive работает автоматически каждые 2 минуты.'
  }
};

let currentLang = localStorage.getItem('lang') || 'az';

function t(key) {
  return translations[currentLang]?.[key] || translations.en[key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.documentElement.lang = currentLang;
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
}
