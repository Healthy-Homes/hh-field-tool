console.log("✅ app.js loaded and running");
let lastFHIRBundle = null;
let translations = {};
let currentLang = 'en';
let map;

// Load language file based on selected value
async function loadLanguage(lang) {
  const response = await fetch(`lang/${lang}.json`);
  translations = await response.json();
  currentLang = lang;
  applyTranslations();
  document.documentElement.setAttribute("lang", lang);
}

function applyTranslations() {
  // Apply text translations
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const keys = el.getAttribute("data-i18n").split(".");
    let text = translations;
    for (const k of keys) text = text?.[k];
    if (text) el.textContent = text;
  });

  // Apply dropdown options
  document.querySelectorAll("[data-i18n-options]").forEach(select => {
    const keys = select.getAttribute("data-i18n-options").split(".");
    let optionsData = translations;
    for (const k of keys) optionsData = optionsData?.[k];

    if (optionsData) {
      select.innerHTML = ""; // clear existing
      for (const [value, label] of Object.entries(optionsData)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      }
    }
  });
}


// 🌍 EJScreen (Mock for Now — Easily Upgradable)
async function getEJScreenData(lat, lon) {
  console.warn("🧪 Using MOCK EJScreen data — replace this for real deployment.");

  return {
    asthmaRisk: "High",
    leadRisk: "Moderate",
    pm25: "21.3 μg/m³",
    proximityToTraffic: "Low",
    dieselPM: "7.8 μg/m³"
  };
}

// Geolocation + EJScreen Wrapper
async function getLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
    const data = await response.json();
    document.getElementById("userAddress").textContent = data.display_name || `${latitude}, ${longitude}`;

    const env = await getEJScreenData(latitude, longitude);

    document.getElementById("asthmaRisk").textContent = env.asthmaRisk;
    document.getElementById("leadRisk").textContent = env.leadRisk;
    document.getElementById("pm25").textContent = env.pm25;

    const mockWarning = document.getElementById("mockWarning");
    if (mockWarning) mockWarning.style.display = "block";

    window.ejScreenInfo = {
      coords: { latitude, longitude },
      address: data.display_name,
      ...env
    };
  }, () => {
    alert("Unable to retrieve your location.");
  });
}

// 📸 Leaflet map snapshot
function captureMapImage(callback) {
  const { latitude, longitude } = window.ejScreenInfo?.coords || {
    latitude: 25.032969,
    longitude: 121.565418
  };

  const mapboxToken = 'pk.eyJ1IjoibXd1bHNoIiwiYSI6ImNtY2p1M2RzbDA3ZWgybXB6OHdua3l0OGUifQ.mOwY0FB4d5wvQ6vmijQF4g';
  const zoom = 13;
  const width = 600;
  const height = 400;

  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${longitude},${latitude},${zoom}/${width}x${height}?access_token=${mapboxToken}`;

  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.onload = function () {
        callback(reader.result); // base64 image data
      };
      reader.readAsDataURL(blob);
    })
    .catch(err => {
      console.error("Mapbox Static API error:", err);
      callback(null);
    });
}


// 🧬 FHIR Bundle Construction
function generateFHIR() {
  const inspection = document.forms['inspectionForm'];
  const sdoh = document.forms['sdohForm'];

  const consentGiven = document.getElementById("consentCheckbox").checked;
  const residentName = document.getElementById("residentName").value.trim();
  const residentSignature = document.getElementById("residentSignature").value.trim();

  if (!consentGiven) {
    alert("You must obtain resident consent before generating the report.");
    return;
  }

  const observations = [];

  if (inspection.mold.checked) observations.push({ code: "93041-2", description: "Visible mold", value: true });
  if (inspection.pests.checked) observations.push({ code: "93043-8", description: "Pest infestation", value: true });
  if (inspection.leaks.checked) observations.push({ code: "99999-9", description: "Water leaks or dampness", value: true });
  if (inspection.lead.checked) observations.push({ code: "93044-6", description: "Lead paint risk (pre-1978 home)", value: true });

  const socialNeeds = {
    housingStable: sdoh.housingStable.value,
    utilityShutoff: sdoh.utilityShutoff.value,
    foodInsecurity: sdoh.foodInsecurity.value,
    languagePref: sdoh.languagePref.value
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
    .concat({
      resource: {
        resourceType: "QuestionnaireResponse",
        status: "completed",
        item: Object.keys(socialNeeds).map(key => ({
          linkId: key,
          text: key,
          answer: [{ valueString: socialNeeds[key] }]
        }))
      }
    })
    .concat({
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
    })
    .concat({
      resource: {
        resourceType: "Observation",
        status: "final",
        code: { coding: [{ system: "https://example.org", code: "ejscreen-summary", display: "Environmental Context" }] },
        component: [
          { code: { text: "Asthma Risk" }, valueString: ej.asthmaRisk || "N/A" },
          { code: { text: "Lead Risk" }, valueString: ej.leadRisk || "N/A" },
          { code: { text: "PM2.5" }, valueString: ej.pm25 || "N/A" },
          { code: { text: "Address" }, valueString: ej.address || "N/A" }
        ]
      }
    })
  };

  document.getElementById("output").textContent = JSON.stringify(fhirBundle, null, 2);
  lastFHIRBundle = fhirBundle;
}

function downloadJSON() {
  if (!lastFHIRBundle) return alert("Run the assessment first.");
  const blob = new Blob([JSON.stringify(lastFHIRBundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "healthy-home-assessment.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadPDF() {
  if (!lastFHIRBundle) return alert("Run the assessment first.");

  captureMapImage((imgData) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Healthy Homes Assessment Summary", 10, 10);
    doc.setFontSize(10);

    let y = 20;
    lastFHIRBundle.entry.forEach(entry => {
      const res = entry.resource;
      if (res.resourceType === "Observation" && res.code?.coding?.[0]?.code !== "ejscreen-summary") {
        doc.text(`• ${res.code.coding[0].display}: ${res.valueBoolean ? "Yes" : "No"}`, 10, y);
        y += 7;
      }
    });

    const sdoh = lastFHIRBundle.entry.find(e => e.resource.resourceType === "QuestionnaireResponse");
    if (sdoh) {
      doc.text("Resident SDOH Responses:", 10, y + 5);
      y += 12;
      sdoh.resource.item.forEach(item => {
        doc.text(`• ${item.text}: ${item.answer[0].valueString}`, 10, y);
        y += 7;
      });
    }

    const consent = lastFHIRBundle.entry.find(e => e.resource.id === "consent-info");
    if (consent) {
      const ext = consent.resource.extension;
      const get = (key) => ext.find(e => e.url === key)?.valueString || "N/A";

      y += 10;
      doc.text("Resident Consent:", 10, y);
      y += 6;
      doc.text(`Name: ${get("residentName")}`, 10, y);
      y += 6;
      doc.text(`Signature: ${get("residentSignature")}`, 10, y);
      y += 6;
      doc.text(`Consent Given: Yes`, 10, y);
    }

    const ej = window.ejScreenInfo;
    if (ej) {
      y += 10;
      doc.text("Environmental Context (EJScreen):", 10, y);
      y += 6;
      doc.text(`Address: ${ej.address}`, 10, y);
      y += 6;
      doc.text(`Asthma Risk: ${ej.asthmaRisk}`, 10, y);
      y += 6;
      doc.text(`Lead Risk: ${ej.leadRisk}`, 10, y);
      y += 6;
      doc.text(`PM2.5: ${ej.pm25}`, 10, y);
    }

    if (imgData) {
      y += 10;
      doc.text("Map Snapshot:", 10, y);
      doc.addImage(imgData, "PNG", 10, y + 5, 180, 80);
    }

    doc.save("healthy-home-assessment.pdf");
  });
}

// 🗺️ Init on page load
document.addEventListener("DOMContentLoaded", () => {
  loadLanguage("en");
  document.getElementById("langSelect").addEventListener("change", (e) => {
    loadLanguage(e.target.value);
  });

  try {
    map = L.map('map').setView([25.032969, 121.565418], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    console.log("✅ Leaflet map initialized.");
  } catch (err) {
    console.error("❌ Error initializing Leaflet:", err);
  }
});

