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

    const titleEl = document.getElementById('appTitle');
    if (titleEl) {
      titleEl.textContent = (data.app && data.app.title) ? data.app.title : '';
    }

    const consentTextEl = document.getElementById('consentText');
    if (consentTextEl) {
      consentTextEl.textContent = (data.consent && data.consent.consentText) ? data.consent.consentText : '';
    }

    const nameInput = document.getElementById('residentName');
    if (nameInput) {
      nameInput.placeholder = (data.consent && data.consent.name) ? data.consent.name : '';
    }

    const locationBtn = document.getElementById('getLocationBtn');
    if (locationBtn) {
      locationBtn.textContent = (data.env && data.env.useLocation) ? data.env.useLocation : '';
    }

    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
      generateBtn.textContent = (data.fhir && data.fhir.generate) ? data.fhir.generate : 'Generate FHIR JSON';
    }

    const downloadJSON = document.getElementById('downloadJSON');
    if (downloadJSON) {
      downloadJSON.textContent = (data.fhir && data.fhir.downloadJson) ? data.fhir.downloadJson : 'Download JSON';
    }

    const downloadPDF = document.getElementById('downloadPDF');
    if (downloadPDF) {
      downloadPDF.textContent = (data.fhir && data.fhir.downloadPdf) ? data.fhir.downloadPdf : 'Download PDF';
    }

    const langLabel = document.querySelector('label[for="langSelect"]');
    if (langLabel) {
      langLabel.textContent = (data.language && data.language.label) ? data.language.label : 'Select Language';
    }

    const photoLabel = document.querySelector('label[for="photoUpload"]');
    if (photoLabel) {
      photoLabel.textContent = (data.photo && data.photo.label) ? data.photo.label : 'Upload Photos (optional)';
    }

  } catch (e) {
    console.error(`[i18n] Failed to load ${lang} translations`, e);
  }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  loadTranslations(currentLang);

  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      currentLang = e.target.value;
      loadTranslations(currentLang);
    });
  }
});
