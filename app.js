// app.js

let currentLang = 'en';
const translations = {
  en: {},
  zh: {}
};

// Load translation JSON file
async function loadTranslations(lang) {
  try {
    const res = await fetch(`lang/${lang}.json`);
    const data = await res.json();

    const titleEl = document.getElementById('appTitle');
    if (titleEl) titleEl.textContent = data.appTitle || '';

    const consentEl = document.getElementById('consentText');
    if (consentEl) consentEl.textContent = data.consent || '';

    const nameEl = document.getElementById('nameLabel');
    if (nameEl) nameEl.placeholder = data.fullName || '';

    const locEl = document.getElementById('locationInfo');
    if (locEl) locEl.textContent = '';
  } catch (e) {
    console.error(`[i18n] Failed to load ${lang} translations`, e);
  }
}

// Set language and reload translations
function setLanguage(lang) {
  currentLang = lang;
  loadTranslations(lang);
}

// Location access
function getLocation() {
  const output = document.getElementById('locationInfo');
  if (!navigator.geolocation) {
    output.textContent = 'Geolocation is not supported by your browser';
    return;
  }

  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    output.textContent = `Latitude: ${latitude.toFixed(5)}, Longitude: ${longitude.toFixed(5)}`;
  }

  function error() {
    output.textContent = 'Unable to retrieve your location';
  }

  navigator.geolocation.getCurrentPosition(success, error);
}

// Set up event listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('langSelect')?.addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });

  document.getElementById('getLocationBtn')?.addEventListener('click', getLocation);

  loadTranslations(currentLang);
});
