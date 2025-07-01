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

// ✅ FIXED: Populate dropdowns from translations[currentLang].sdoh.options
function populateSelectOptions() {
  document.querySelectorAll('[data-i18n-options]').forEach(select => {
    const key = select.getAttribute('data-i18n-options');
    const options = translations[currentLang]?.sdoh?.options?.[key];

    console.log(`[dropdown] Populating sdoh.options.${key} with:`, options);

    if (!options) {
      console.warn(`[dropdown] Missing options for key: sdoh.options.${key}`);
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
  getLocation?.();  // Prevents crashing if getLocation is missing
  document.getElementById('dummyBanner').style.display = 'block';
});

// ----- Everything below unchanged ----- //

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
      img.alt = file.name;
      img.className = "w-full h-auto border rounded";
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });

  uploadStatus.textContent = `${e.target.files.length} image(s) uploaded.`;
});

// Generate FHIR Observation
function generateFHIR() {
  const formData = {
    housingStable: document.getElementById('housingStable').value,
    utilityShutoff: document.getElementById('utilityShutoff').value,
    foodInsecurity: document.getElementById('foodInsecurity').value,
    languagePref: document.getElementById('languagePref').value,
    incomeLevel: document.getElementById('incomeLevel').value,
    residentName: document.getElementById('residentName').value
  };

  const checklist = [
    'moldVisible', 'leakingPipes', 'noVentilation',
    'pestDroppings', 'electrical', 'tripHazards', 'otherHazards'
  ];

  const checklistItems = checklist.filter(id => document.getElementById(id).checked);

  const obs = {
    resourceType: "Observation",
    extension: Object.entries(formData).map(([k, v]) => ({ url: k, valueString: v })),
    checklistFindings: checklistItems,
    photos: uploadedImages.map(img => ({
      name: img.name,
      contentType: "image/jpeg",
      data: img.data
    }))
  };

  document.getElementById('output').textContent = JSON.stringify(obs, null, 2);
}

// JSON export
function downloadJSON() {
  const blob = new Blob([document.getElementById('output').textContent], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'inspection.json';
  a.click();
}

// PDF export
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const data = JSON.parse(document.getElementById('output').textContent || '{}');

  doc.setFontSize(12);
  doc.text("Healthy Homes Assessment Summary", 10, 10);
  let y = 20;

  data.extension?.forEach(entry => {
    doc.text(`${entry.url}: ${entry.valueString}`, 10, y);
    y += 8;
  });

  if (data.checklistFindings?.length) {
    doc.text("Checklist Findings:", 10, y);
    y += 8;
    data.checklistFindings.forEach(item => {
      doc.text(`- ${item}`, 12, y);
      y += 6;
    });
  }

  if (data.photos?.length) {
    doc.text("Photos embedded separately in JSON export.", 10, y);
    y += 8;
  }

  doc.save('inspection.pdf');
}
