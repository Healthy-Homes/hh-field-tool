let currentLang = 'en';
const translations = { en: {}, zh: {} };

// Load translation files
async function loadTranslations(lang) {
  try {
    const response = await fetch(`lang/${lang}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    translations[lang] = await response.json();
    console.log(`[i18n] Loaded ${lang} translations`);
  } catch (err) {
    console.error(`[i18n] Failed to load ${lang} translations`, err);
  }
}

// Apply translations to the DOM
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
}

// Handle language change
document.addEventListener('DOMContentLoaded', async () => {
  await loadTranslations(currentLang);
  applyTranslations();
  loadChecklist();  // Defined in checklist-loader.js
  loadSDOH();       // Defined in sdoh-loader.js

  document.getElementById('languageSelect').addEventListener('change', async (e) => {
    currentLang = e.target.value;
    await loadTranslations(currentLang);
    applyTranslations();
    loadChecklist();
    loadSDOH();
  });

  document.getElementById('locationButton').addEventListener('click', () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        document.getElementById('locationOutput').textContent = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
      }, err => {
        console.error('[geo] Location error:', err);
        document.getElementById('locationOutput').textContent = 'Unable to retrieve location.';
      });
    } else {
      document.getElementById('locationOutput').textContent = 'Geolocation not supported.';
    }
  });
});
