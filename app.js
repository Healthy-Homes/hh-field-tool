// Core logic for Healthy Homes Practitioner App

let currentLang = 'en';
const translations = { en: {}, zh: {} };
const uploadedImages = [];

// Load translations
async function loadTranslations(lang) {
  try {
    const response = await fetch(`lang/${lang}.json`);
    translations[lang] = await response.json();
  } catch (e) {
    console.error('Error loading translations:', e);
  }
}

// Apply translations
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
}

// Use My Location
function getLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    const response = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=\${latitude}&lon=\${longitude}\`);
    const data = await response.json();
    const address = data.display_name;
    const locationDisplay = document.getElementById('locationDisplay');
    if (locationDisplay) locationDisplay.textContent = address;
  });
}

// Export
function downloadJSON() {
  const dataStr = JSON.stringify(generateFHIR(), null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inspection.json";
  a.click();
}

// Dummy generateFHIR
function generateFHIR() {
  return { resourceType: "Observation", status: "final" };
}

// Init
async function initializeApp() {
  await loadTranslations(currentLang);
  applyTranslations();
}

document.addEventListener('DOMContentLoaded', initializeApp);
