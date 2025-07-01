// ✅ app.js – Fully synced, with restored SDOH fields and complete i18n toggle
console.log("✅ app.js loaded and running");

let lastFHIRBundle = null;
let translations = {};
let currentLang = 'en';
let map;
let base64Photos = [];

// 🌐 Load and apply language translations
async function loadLanguage(lang) {
  try {
    const response = await fetch(`lang/${lang}.json`);
    translations = await response.json();
    currentLang = lang;
    applyTranslations();
    document.documentElement.setAttribute("lang", lang);
  } catch (err) {
    console.error("❌ Failed to load language file:", err);
  }
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const keys = el.getAttribute("data-i18n").split(".");
    let text = translations;
    for (const k of keys) text = text?.[k];
    if (text) el.textContent = text;
  });

  const selectFields = ["incomeLevel", "housingStable", "utilityShutoff", "foodInsecurity", "languagePref"];
  selectFields.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const i18nKey = select.getAttribute("data-i18n-options");
    let optionSet = translations;
    for (const part of i18nKey.split(".")) optionSet = optionSet?.[part];
    if (optionSet) {
      const current = select.value;
      select.innerHTML = "";
      for (const [value, label] of Object.entries(optionSet)) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        select.appendChild(opt);
      }
      select.value = current;
    }
  });
}

// 🗺️ Geolocation + mock EJScreen data
async function getEJScreenData(lat, lon) {
  const banner = document.createElement("div");
  banner.textContent = "🧪 Using MOCK EJScreen data";
  banner.className = "bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded my-4";
  document.querySelector("#map").insertAdjacentElement("beforebegin", banner);
  console.warn("🧪 Using MOCK EJScreen data");
  return {
    asthmaRisk: "High",
    leadRisk: "Moderate",
    pm25: "21.3 μg/m³",
    proximityToTraffic: "Low",
    dieselPM: "7.8 μg/m³"
  };
}

async function getLocation() {
  if (!navigator.geolocation) return alert("Geolocation not supported.");
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const { latitude, longitude } = coords;
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
    const data = await response.json();
    document.getElementById("userAddress").textContent = data.display_name || `${latitude}, ${longitude}`;
    const env = await getEJScreenData(latitude, longitude);
    document.getElementById("asthmaRisk").textContent = env.asthmaRisk;
    document.getElementById("leadRisk").textContent = env.leadRisk;
    document.getElementById("pm25").textContent = env.pm25;
    window.ejScreenInfo = { coords, address: data.display_name, ...env };
  }, () => alert("Unable to retrieve location."));
}

// 🖼️ Photo upload
function handlePhotoUpload(event) {
  const files = Array.from(event.target.files || []);
  const previewGrid = document.getElementById("photoPreview");
  const status = document.getElementById("uploadStatus");
  previewGrid.innerHTML = "";
  base64Photos = [];

  if (files.length === 0) {
    status.textContent = "No photos selected.";
    return;
  }

  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.className = "w-full h-auto border border-gray-300 rounded";
      previewGrid.appendChild(img);
      base64Photos.push(e.target.result.split(",")[1]);
      if (index === files.length - 1) {
        status.textContent = `✅ ${files.length} photo(s) loaded.`;
      }
    };
    reader.readAsDataURL(file);
  });
}

// 🧬 FHIR export
function generateFHIR() {
  const inspection = document.forms['inspectionForm'];
  const sdoh = document.forms['sdohForm'];
  const consentGiven = document.getElementById("consentCheckbox").checked;
  const residentName = document.getElementById("residentName").value.trim();
  const residentSignature = document.getElementById("residentSignature").value.trim();

  if (!consentGiven) return alert("Resident consent is required.");

  const fieldMap = {
    moldVisible: "Visible mold",
    leakingPipes: "Water damage or leaks",
    noVentilation: "Poor ventilation",
    pestDroppings: "Signs of pests",
    electrical: "Unsafe electrical systems",
    tripHazards: "Trip hazards",
    otherHazards: "Other risks"
  };

  const observations = Object.keys(fieldMap).filter(id => {
    return inspection.elements[id]?.checked;
  }).map(id => ({
    code: "99999-0",
    description: fieldMap[id],
    value: true
  }));

  const socialNeeds = {
    housingStable: sdoh.housingStable?.value || "",
    utilityShutoff: sdoh.utilityShutoff?.value || "",
    foodInsecurity: sdoh.foodInsecurity?.value || "",
    languagePref: sdoh.languagePref?.value || ""
  };

  const ej = window.ejScreenInfo || {};

  const fhirBundle = {
    resourceType: "Bundle",
    type: "collection",
    entry: observations.map(obs => ({
      resource: {
        resourceType: "Observation",
        status: "final",
        code: {
          coding: [{ system: "http://loinc.org", code: obs.code, display: obs.description }]
        },
        valueBoolean: obs.value
      }
    }))
  };

  fhirBundle.entry.push({
    resource: {
      resourceType: "QuestionnaireResponse",
      status: "completed",
      item: Object.keys(socialNeeds).map(key => ({
        linkId: key,
        text: key,
        answer: [{ valueString: socialNeeds[key] }]
      }))
    }
  });

  fhirBundle.entry.push({
    resource: {
      resourceType: "Basic",
      id: "consent-info",
      code: {
        coding: [{ system: "http://hl7.org/fhir/basic-resource-type", code: "consent-info", display: "Resident Consent Info" }]
      },
      extension: [
        { url: "residentName", valueString: residentName || "N/A" },
        { url: "residentSignature", valueString: residentSignature || "N/A" },
        { url: "consentGiven", valueBoolean: true }
      ]
    }
  });

  fhirBundle.entry.push({
    resource: {
      resourceType: "Observation",
      status: "final",
      code: {
        coding: [{ system: "https://example.org", code: "ejscreen-summary", display: "Environmental Context" }]
      },
      component: [
        { code: { text: "Asthma Risk" }, valueString: ej.asthmaRisk || "N/A" },
        { code: { text: "Lead Risk" }, valueString: ej.leadRisk || "N/A" },
        { code: { text: "PM2.5" }, valueString: ej.pm25 || "N/A" },
        { code: { text: "Address" }, valueString: ej.address || "N/A" }
      ]
    }
  });

  base64Photos.forEach(photo => {
    fhirBundle.entry.push({
      resource: {
        resourceType: "Media",
        type: "photo",
        content: {
          contentType: "image/png",
          data: photo
        }
      }
    });
  });

  document.getElementById("output").textContent = JSON.stringify(fhirBundle, null, 2);
  lastFHIRBundle = fhirBundle;
}

// 📦 JSON download
function downloadJSON() {
  if (!lastFHIRBundle) return alert("Generate the FHIR report first.");
  const blob = new Blob([JSON.stringify(lastFHIRBundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fhir-report.json";
  a.click();
  URL.revokeObjectURL(url);
}

// 📄 PDF download
function downloadPDF() {
  if (!lastFHIRBundle) return alert("Generate the FHIR report first.");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const text = JSON.stringify(lastFHIRBundle, null, 2);
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 10, 10);
  doc.save("fhir-report.pdf");
}

// 🚀 Init
window.addEventListener("DOMContentLoaded", () => {
  loadLanguage("en");
  document.getElementById("langSelect").addEventListener("change", e => {
    loadLanguage(e.target.value);
  });
  const photoInput = document.getElementById("photoUpload");
  if (photoInput) photoInput.addEventListener("change", handlePhotoUpload);
  try {
    map = L.map('map').setView([25.032969, 121.565418], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
  } catch (err) {
    console.error("❌ Map error:", err);
  }
});
