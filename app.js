// ✅ Updated app.js for Healthy Homes App

console.log("✅ app.js loaded and running");
let lastFHIRBundle = null;
let translations = {};
let currentLang = 'en';
let map;

// Load and apply language translations
async function loadLanguage(lang) {
  const response = await fetch(`lang/${lang}.json`);
  translations = await response.json();
  currentLang = lang;
  applyTranslations();
  document.documentElement.setAttribute("lang", lang);
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const keys = el.getAttribute("data-i18n").split(".");
    let text = translations;
    for (const k of keys) text = text?.[k];
    if (text) el.textContent = text;
  });

  document.querySelectorAll("select[data-i18n-options]").forEach(select => {
    const optionsKey = select.getAttribute("data-i18n-options");
    const keys = optionsKey.split(".");
    let optionSet = translations;
    for (const k of keys) optionSet = optionSet?.[k];

    if (optionSet) {
      const currentValue = select.value;
      select.innerHTML = "";
      for (const [value, label] of Object.entries(optionSet)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      }
      if (select.querySelector(`option[value="${currentValue}"]`)) {
        select.value = currentValue;
      }
    }
  });

  const checklistItems = [
    "moldVisible",
    "dampSmell",
    "leakingPipes",
    "pestDroppings",
    "openEntryPoints",
    "brokenStairs",
    "tripHazards",
    "noVentilation",
    "hvacInadequate",
    "pre1978Paint",
    "gasSmell",
    "noRunningWater",
    "visibleTrash",
    "asthmaTriggers",
    "otherHazards"
  ];

  checklistItems.forEach(id => {
    const label = document.querySelector(`label[for='${id}'] span[data-i18n]`);
    const key = `inspection.${id}`;
    const keys = key.split(".");
    let text = translations;
    for (const k of keys) text = text?.[k];
    if (label && text) label.textContent = text;
  });

  const consentLabels = {
    name: "consent.name",
    signature: "consent.signature"
  };

  for (const [id, keyPath] of Object.entries(consentLabels)) {
    const label = document.querySelector(`label[for='${id}']`);
    const keys = keyPath.split(".");
    let text = translations;
    for (const k of keys) text = text?.[k];
    if (label && text) label.textContent = text;
  }
}

// 🌍 EJScreen Mock API
async function getEJScreenData(lat, lon) {
  const banner = document.createElement("div");
  banner.textContent = "🧪 Using MOCK EJScreen data";
  banner.className = "bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded my-2";
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

// 📍 Geolocation with Address and EJ Data
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

function generateFHIR() {
  const inspection = document.forms['inspectionForm'];
  const sdoh = document.forms['sdohForm'];
  const consentGiven = document.getElementById("consentCheckbox").checked;
  const residentName = document.getElementById("residentName").value.trim();
  const residentSignature = document.getElementById("residentSignature").value.trim();

  if (!consentGiven) return alert("Resident consent is required.");

  const fieldMap = {
    moldVisible: "Visible mold",
    dampSmell: "Musty odors",
    leakingPipes: "Plumbing/roof leaks",
    pestDroppings: "Pest droppings",
    openEntryPoints: "Unsealed cracks",
    brokenStairs: "Broken steps",
    tripHazards: "Trip hazards",
    noVentilation: "No ventilation",
    hvacInadequate: "No HVAC",
    pre1978Paint: "Lead paint risk",
    gasSmell: "Smell of gas",
    noRunningWater: "No water/toilet",
    visibleTrash: "Trash/sewage",
    asthmaTriggers: "Asthma triggers",
    otherHazards: "Other risks"
  };

  const observations = Object.keys(fieldMap).filter(name => {
    return inspection.elements[name]?.checked;
  }).map(name => ({
    code: "99999-0",
    description: fieldMap[name],
    value: true
  }));

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
    })).concat({
      resource: {
        resourceType: "QuestionnaireResponse",
        status: "completed",
        item: Object.keys(socialNeeds).map(key => ({
          linkId: key,
          text: key,
          answer: [{ valueString: socialNeeds[key] }]
        }))
      }
    }).concat({
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
    }).concat({
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
// 💾 Export Functions
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

  doc.save("healthy-home-assessment.pdf");
}

// Init

document.addEventListener("DOMContentLoaded", () => {
  loadLanguage("en");
  document.getElementById("langSelect").addEventListener("change", e => {
    loadLanguage(e.target.value);
  });

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
