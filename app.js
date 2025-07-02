let currentLang = 'en';
const translations = { en: {}, zh: {} };

// Load translation JSON
async function loadTranslations(lang) {
  try {
    const response = await fetch(`lang/${lang}.json`);
    if (!response.ok) throw new Error('Translation file load failed');
    translations[lang] = await response.json();
    applyTranslations();
  } catch (err) {
    console.error('Translation loading error:', err);
  }
}

// Apply translation to all elements with data-i18n
function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  for (let el of elements) {
    const keys = el.getAttribute('data-i18n').split('.');
    let text = translations[currentLang];
    for (let k of keys) {
      if (text && k in text) {
        text = text[k];
      } else {
        text = null;
        break;
      }
    }
    if (text !== null) el.innerText = text;
  }

  // Also handle placeholders
  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  for (let el of placeholders) {
    const keys = el.getAttribute('data-i18n-placeholder').split('.');
    let text = translations[currentLang];
    for (let k of keys) {
      if (text && k in text) {
        text = text[k];
      } else {
        text = null;
        break;
      }
    }
    if (text !== null) el.placeholder = text;
  }
}

// Event: language change
document.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', () => {
      currentLang = langSelect.value;
      loadTranslations(currentLang);
    });
  }
  loadTranslations(currentLang);
});
