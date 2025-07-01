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

// ✅ FIXED: Populate dropdowns from sdohOptions (not nested in sdoh.options)
function populateSelectOptions() {
  document.querySelectorAll('[data-i18n-options]').forEach(select => {
    const key = select.getAttribute('data-i18n-options');
    const options = translations[currentLang]?.sdohOptions?.[key];

    console.log(`[dropdown] Populating sdohOptions.${key} with:`, options);

    if (!options) {
      console.warn(`[dropdown] Missing options for key: sdohOptions.${key}`);
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

// DOM Ready
window.addEventListener('DOMContentLoaded', async () => {
  await loadTranslations(currentLang);
  getLocation?.(); // Prevents crash if getLocation() is undefined
  document.getElementById('dummyBanner').style.display = 'block';
});

// ---- Unchanged functionality below ----

// Photo uploads
const uploadedImages = [];

document.getElementById('photoUpload').addEventListener('change', function (e) {
  const preview = document.getElementById('photoPreview');
  const uploadStatus = document.getElementById('uploadStatus');
  preview.innerHTML = '';
  uploadedImages.length = 0;

  [...e.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = function (e) {
      uploadedImages.push({ name: file.name, data: e.target.result });
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt =
