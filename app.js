// ✅ Cleaned and consolidated app.js

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

// 🌍 Geolocation map logic
let mapInstance;

function getLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (mapInstance) {
        mapInstance.setView([lat, lng], 13);
      } else {
        mapInstance = L.map('map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);
      }

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        const address = data.display_name;
        document.getElementById("userAddress").textContent = `📍 ${address}`;
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
      }

      document.getElementById("asthmaRisk").textContent = "Moderate (mock)";
      document.getElementById("leadRisk").textContent = "Low (mock)";
      document.getElementById("pm25").textContent = "12 µg/m³ (mock)";
    },
    error => {
      alert("Unable to retrieve your location.");
      console.error(error);
    }
  );
}

document.getElementById('langSelect').addEventListener('change', async e => {
  currentLang = e.target.value;
  await loadTranslations(currentLang);
});

window.addEventListener('DOMContentLoaded', async () => {
  await loadTranslations(currentLang);
  getLocation?.();
  document.getElementById('dummyBanner').style.display = 'block';
});

// 📸 Image upload logic
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

// 🧾 Generate FHIR JSON
function generateFHIR() {
  const formData = {};
  document.querySelectorAll('[data-sdoh-key]').forEach(el => {
    formData[el.getAttribute('data-sdoh-key')] = el.value;
  });

  const checklist = [
    'moldVisible', 'leakingPipes', 'noVentilation',
    'pestDroppings', 'electrical', 'tripHazards', 'otherHazards'
  ];

  const checklistItems = checklist.filter(id => document.getElementById(id)?.checked);
  const now = new Date().toISOString();
  const patientName = document.getElementById('residentName')?.value?.trim() || "anonymous";

  const bundle = {
    resourceType: "Bundle",
    id: `hh-bundle-${now.slice(0, 10)}`,
    type: "collection",
    timestamp: now,
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: "example",
          name: [{ text: patientName }]
        }
      },
      ...Object.entries(formData).map(([key, value], i) => ({
        resource: {
          resourceType: "Observation",
          id: `obs-${key}-${i}`,
          status: "final",
          code: {
            coding: [{
              system: "http://loinc.org",
              code: key,
              display: key
            }]
          },
          subject: { reference: "Patient/example" },
          effectiveDateTime: now,
          valueString: value
        }
      })),
      ...checklistItems.map((item, i) => ({
        resource: {
          resourceType: "Observation",
          id: `chk-${item}-${i}`,
          status: "final",
          code: {
            coding: [{
              system: "http://yourorg.org/checklist",
              code: item,
              display: item
            }]
          },
          subject: { reference: "Patient/example" },
          effectiveDateTime: now,
          valueBoolean: true
        }
      }))
    ]
  };

  document.getElementById('output').textContent = JSON.stringify(bundle, null, 2);
}

// 💾 JSON & PDF export
function downloadJSON() {
  const blob = new Blob([document.getElementById('output').textContent], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'inspection.json';
  a.click();
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const data = JSON.parse(document.getElementById('output').textContent || '{}');

  doc.setFontSize(12);
  doc.text("Healthy Homes Assessment Summary", 10, 10);
  let y = 20;

  data.entry?.forEach(entry => {
    const r = entry.resource;
    if (r.resourceType === "Observation") {
      const val = r.valueString ?? r.valueBoolean;
      doc.text(`${r.code.coding[0].display}: ${val}`, 10, y);
      y += 8;
    }
  });

  doc.save('inspection.pdf');
}
