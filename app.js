let currentLang = 'en';

const translations = {
  en: {},
  zh: {}
};

const uploadedImages = [];

// Load translation files
async function loadTranslations(lang) {
  try {
    const res = await fetch(`lang/${lang}.json`);
    const data = await res.json();
    translations[lang] = data;

    document.getElementById('appTitle')?.textContent = data.app?.title || '';
    document.getElementById('consentText')?.textContent = data.consent?.consentText || '';
    document.getElementById('residentName')?.placeholder = data.consent?.name || '';
    document.getElementById('locationInfo')?.textContent = data.env?.useLocation || '';
    document.getElementById('generateBtn')?.textContent = data.fhir?.generate || 'Generate FHIR JSON';
    document.getElementById('downloadJSON')?.textContent = data.fhir?.downloadJson || 'Download JSON';
    document.getElementById('downloadPDF')?.textContent = data.fhir?.downloadPdf || 'Download PDF';
    document.querySelector('label[for="langSelect"]')?.textContent = data.language?.label || 'Select Language';
    document.querySelector('label[for="photoUpload"]')?.textContent = data.photo?.label || 'Upload Photos (optional)';

  } catch (e) {
    console.error(`[i18n] Failed to load ${lang} translations`, e);
  }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  loadTranslations(currentLang);

  document.getElementById('langSelect')?.addEventListener('change', (e) => {
    currentLang = e.target.value;
    loadTranslations(currentLang);
  });
});
