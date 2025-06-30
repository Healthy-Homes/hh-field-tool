let lastFHIRBundle = null;
let translations = {};
let currentLang = 'en';

// Load language file based on selected value
async function loadLanguage(lang) {
  const response = await fetch(`lang/${lang}.json`);
  translations = await response.json();
  currentLang = lang;
  applyTranslations();
  document.documentElement.setAttribute("lang", lang);
}

// Apply translation to all elements with data-i18n attribute
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const keys = el.getAttribute("data-i18n").split(".");
    let text = translations;
    for (const k of keys) text = text?.[k];
    if (text) el.textContent = text;
  });
}

// Language selector and map init
document.addEventListener("DOMContentLoaded", () => {
  loadLanguage("en"); // Default language
  document.getElementById("langSelect").addEventListener("change", (e) => {
    loadLanguage(e.target.value);
  });

  const map = L.map('map').setView([25.032969, 121.565418], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);
});

// 🌍 EJScreen Integration (mocked for now)
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

    const mockData = {
      asthmaRisk: "High",
      leadRisk: "Moderate",
      pm25: "21.3 μg/m³"
    };

    document.getElementById("asthmaRisk").textContent = mockData.asthmaRisk;
    document.getElementById("leadRisk").textContent = mockData.leadRisk;
    document.getElementById("pm25").textContent = mockData.pm25;

    window.ejScreenInfo = {
      coords: { latitude, longitude },
      address: data.display_name,
      ...mockData
    };
  }, () => {
    alert("Unable to retrieve your location.");
  });
}

// FHIR generation
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

  if (inspection.mold.checked) {
    observations.push({ code: "93041-2", description: "Visible mold", value: true });
  }
  if (inspection.pests.checked) {
    observations.push({ code: "93043-8", description: "Pest infestation", value: true });
  }
  if (inspection.leaks.checked) {
    observations.push({ code: "99999-9", description: "Water leaks or dampness", value: true });
  }
  if (inspection.lead.checked) {
    observations.push({ code: "93044-6", description: "Lead paint risk (pre-1978 home)", value: true });
  }

  const socialNeeds = {
    housingStable: sdoh.housingStable.value,
    utilityShutoff: sdoh.utilityShutoff.value,
    foodInsecurity: sdoh.foodInsecurity.value,
    languagePref: sdoh.languagePref.value
  };

  const entries = observations.map(obs => ({
    resource: {
      resourceType: "Observation",
      status: "final",
      code: {
        coding: [{
          system: "http://loinc.org",
          code: obs.code,
          display: obs.description
        }]
      },
      valueBoolean: obs.value
    }
  }));

  entries.push({
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

  entries.push({
    resource: {
      resourceType: "Basic",
      id: "consent-info",
      code: {
        coding: [{
          system: "http://hl7.org/fhir/basic-resource-type",
          code: "consent-info",
          display: "Resident Consent Info"
        }]
      },
      extension: [
        { url: "residentName", valueString: residentName || "N/A" },
        { url: "residentSignature", valueString: residentSignature || "N/A" },
        { url: "consentGiven", valueBoolean: true }
      ]
    }
  });

  if (window.ejScreenInfo) {
    entries.push({
      resource: {
        resourceType: "Observation",
        id: "ejscreen",
        status: "final",
        code: {
          coding: [{
            system: "https://epa.gov/ejscreen",
            code: "environmental-context",
            display: "Environmental Context (EJScreen)"
          }]
        },
        component: [
          { code: { text: "Address" }, valueString: window.ejScreenInfo.address },
          { code: { text: "Asthma Risk" }, valueString: window.ejScreenInfo.asthmaRisk },
          { code: { text: "Lead Risk" }, valueString: window.ejScreenInfo.leadRisk },
          { code: { text: "PM2.5" }, valueString: window.ejScreenInfo.pm25 }
        ]
      }
    });
  }

  const fhirBundle = {
    resourceType: "Bundle",
    type: "collection",
    entry: entries
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

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Healthy Homes Assessment Summary", 10, 10);
  doc.setFontSize(10);

  let y = 20;
  lastFHIRBundle.entry.forEach(entry => {
    const res = entry.resource;
    if (res.resourceType === "Observation" && !res.id) {
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

  const ejs = lastFHIRBundle.entry.find(e => e.resource.id === "ejscreen");
  if (ejs) {
    const comps = ejs.resource.component;
    y += 10;
    doc.text("Environmental Context (EJScreen):", 10, y);
    y += 6;
    comps.forEach(comp => {
      doc.text(`• ${comp.code.text}: ${comp.valueString}`, 10, y);
      y += 6;
    });
  }

  doc.save("healthy-home-assessment.pdf");
}
