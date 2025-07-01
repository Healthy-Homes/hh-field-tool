let currentLang = 'en';

const translations = {
  en: {}, // loaded dynamically
  zh: {}
};

// Load translation files
async function loadTranslations(lang) {
const response = await fetch(`lang/${lang}.json`);

  translations[lang] = await response.json();
  applyTranslations();
  populateSelectOptions();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const keys = el.getAttribute('data-i18n').split('.');
    let value = translations[currentLang];
    keys.forEach(k => value = value?.[k]);
    if (value) el.textContent = value;
  });
}

function populateSelectOptions() {
  document.querySelectorAll('[data-i18n-options]').forEach(select => {
    const key = select.getAttribute('data-i18n-options');
    const options = translations[currentLang]?.sdohOptions?.[key];
    if (!options) return;
    select.innerHTML = '';
    for (const val in options) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = options[val];
      select.appendChild(opt);
    }
  });
}

// Initial translation load
document.getElementById('langSelect').addEventListener('change', e => {
  currentLang = e.target.value;
  loadTranslations(currentLang);
});
loadTranslations(currentLang);

// Auto-load the map and dummy data banner
window.addEventListener('DOMContentLoaded', () => {
  getLocation();
  document.getElementById('dummyBanner').style.display = 'block';
});

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, () => {
      document.getElementById("userAddress").textContent = "Geolocation permission denied.";
    });
  } else {
    document.getElementById("userAddress").textContent = "Geolocation is not supported.";
  }
}

function showPosition(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const map = L.map('map').setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  L.marker([lat, lng]).addTo(map)
    .bindPopup("Inspection Location").openPopup();
  document.getElementById("userAddress").textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
}

// Handle photo uploads
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

// Generate FHIR Report
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

// Download JSON
function downloadJSON() {
  const blob = new Blob([document.getElementById('output').textContent], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'inspection.json';
  a.click();
}

// Download PDF
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
