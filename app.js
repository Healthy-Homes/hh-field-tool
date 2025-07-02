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

// ✅ Populate dropdowns from sdohOptions
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

// 🌍 Get current geolocation and show map
function getLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async position => {
      const { latitude, longitude } = position.coords;
      const latlng = [latitude, longitude];

      const map = L.map('map').setView(latlng, 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      L.marker(latlng).addTo(map);

      document.getElementById('userAddress').textContent = `Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}`;
    },
    error => {
      console.error('Geolocation error:', error);
      alert('Unable to retrieve your location.');
    }
  );
}

// 🔁 Handle language change
document.getElementById('langSelect').addEventListener('change', async e => {
  currentLang = e.target.value;
  await loadTranslations(currentLang);
});
// Safe map loading
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

      // Avoid reinitializing the map if it already exists
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

      // Placeholder values for environmental context
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

// ✅ DOM Ready
window.addEventListener('DOMContentLoaded', async () => {
  await loadTranslations(currentLang);
  getLocation?.(); // Load location on page load
  document.getElementById('dummyBanner').style.display = 'block';
});

// 📸 Handle photo uploads
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

// 💾 Download JSON
function downloadJSON() {
  const blob = new Blob([document.getElementById('output').textContent], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'inspection.json';
  a.click();
}

// 📄 Download PDF
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
