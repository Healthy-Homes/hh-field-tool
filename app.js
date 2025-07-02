let currentLang = 'en';

const translations = {
  en: {},
  zh: {}
};

const uploadedImages = [];

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

// Populate <select> elements
function populateSelectOptions() {
  document.querySelectorAll('[data-i18n-options]').forEach(select => {
    const key = select.getAttribute('data-i18n-options');
    const options = translations[currentLang]?.sdohOptions?.[key];

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

// Generate FHIR JSON
function generateFHIR() {
  const formData = {};
  document.querySelectorAll('#sdohForm select, #sdohForm input[type="text"], #sdohForm input[type="number"]').forEach(el => {
    if (el.name && el.value) {
      formData[el.name] = el.value;
    }
  });

  const checklistIds = [
    'moldVisible', 'leakingPipes', 'noVentilation',
    'pestDroppings', 'electrical', 'tripHazards', 'otherHazards'
  ];

  const checklistItems = checklistIds.filter(id => {
    const checkbox = document.getElementById(id);
    return checkbox?.checked;
  });

  const observation = {
    resourceType: "Observation",
    status: "final",
    code: {
      coding: [{
        system: "http://loinc.org",
        code: "75275-8",
        display: "Healthy homes environmental inspection"
      }]
    },
    subject: {
      display: document.getElementById("residentName").value || "Unknown Resident"
    },
    component: [],
    photo: uploadedImages.map(img => ({
      url: `data:${img.type};base64,${img.data.split(',')[1]}`,
      title: img.name
    }))
  };

  // Add SDOH fields as components
  Object.entries(formData).forEach(([key, val]) => {
    observation.component.push({
      code: {
        text: key
      },
      valueString: val
    });
  });

  // Add checklist fields as components
  checklistItems.forEach(item => {
    observation.component.push({
      code: {
        text: item
      },
      valueBoolean: true
    });
  });

  document.getElementById('output').textContent = JSON.stringify(observation, null, 2);
  document.getElementById('downloadJsonBtn').disabled = false;
  document.getElementById('downloadPdfBtn').disabled = false;
}

// PDF Export
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const data = JSON.parse(document.getElementById('output').textContent || '{}');

  doc.setFontSize(12);
  doc.text("Healthy Homes Assessment Summary", 10, 10);
  let y = 20;

  if (data.component?.length) {
    doc.text("Responses:", 10, y);
    y += 8;
    data.component.forEach(entry => {
      const label = entry.code?.text || "Unknown";
      const val = entry.valueString || entry.valueBoolean || "—";
      doc.text(`${label}: ${val}`, 12, y);
      y += 6;
    });
    y += 4;
  }

  if (data.photo?.length) {
    doc.text("Photos embedded separately in JSON export.", 10, y);
  }

  doc.save('inspection.pdf');
}

// JSON Export
function downloadJSON() {
  const blob = new Blob([document.getElementById('output').textContent], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'inspection.json';
  a.click();
}

// Photo Upload
document.getElementById('photoUpload').addEventListener('change', function (e) {
  const preview = document.getElementById('photoPreview');
  const uploadStatus = document.getElementById('uploadStatus');
  preview.innerHTML = '';
  uploadedImages.length = 0;

  [...e.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = function (e) {
      uploadedImages.push({
        name: file.name,
        type: file.type,
        data: e.target.result
      });
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

// Language Switch
document.getElementById('langSelect').addEventListener('change', async e => {
  currentLang = e.target.value;
  await loadTranslations(currentLang);
});

// Map + Location
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
        document.getElementById("userAddress").textContent = `📍 ${data.display_name}`;
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

// Expose global functions
window.getLocation = getLocation;
window.generateFHIR = generateFHIR;
window.downloadJSON = downloadJSON;
window.downloadPDF = downloadPDF;

// Init
window.addEventListener('DOMContentLoaded', async () => {
  await loadTranslations(currentLang);
  getLocation();
  document.getElementById('dummyBanner').style.display = 'block';
  document.getElementById('downloadJsonBtn').disabled = true;
  document.getElementById('downloadPdfBtn').disabled = true;
});
