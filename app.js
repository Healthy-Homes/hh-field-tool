let currentLang = 'en';

const translations = {
  en: {},
  zh: {}
};

// Load translation files
async function loadTranslations(lang) {
  try {
    const response = await fetch(`lang/${lang}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    translations[lang] = await response.json();
    console.log(`[i18n] Loaded ${lang} translations`, translations[lang]);
    applyTranslations();
    populateSelectOptions();
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
    translations[lang] = translations[lang] || {};
  }
}

// Apply translation text to elements
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const keys = el.getAttribute('data-i18n').split('.');
    let value = translations[currentLang];
    keys.forEach(k => value = value?.[k]);
    if (value) el.textContent = value;
  });
}

// Populate dropdowns from sdohOptions
function populateSelectOptions() {
  document.querySelectorAll('[data-i18n-options]').forEach(select => {
    const key = select.getAttribute('data-i18n-options');
    const options = translations[currentLang]?.sdohOptions?.[key];

    console.log(`[dropdown] Populating ${key} with:`, options);

    if (!options) {
      console.warn(`[dropdown] Missing options for key: ${key}`);
      return;
    }

    select.innerHTML = '';
    for (const val in options) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = options[val];
      select.appendChild(opt);
    }
  });
}

// Handle language change
document.getElementById('langSelect').addEventListener('change', async e => {
  currentLang = e.target.value;
  await loadTranslations(currentLang);
});

// Wait for DOM, then initialize
window.addEventListener('DOMContentLoaded', async () => {
  await loadTranslations(currentLang);
  getLocation();
  document.getElementById('dummyBanner').style.display = 'block';
});

// Location logic unchanged...
// Photo upload logic unchanged...
// FHIR generation logic unchanged...
// JSON + PDF export logic unchanged...
