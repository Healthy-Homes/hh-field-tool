let lastFHIRBundle = null;
let geoCoords = null;

// Load geolocation + map after page loads
window.onload = function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        geoCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        initMap(geoCoords);
      },
      (err) => {
        console.warn("Geolocation failed:", err.message);
        document.getElementById("map").innerHTML = "<p>Location unavailable.</p>";
      }
    );
  }
};

function initMap(coords) {
  const map = L.map('map').setView([coords.lat, coords.lng], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap contributors'
  }).addTo(map);
  L.marker([coords.lat, coords.lng]).addTo(map)
    .bindPopup("You are here").openPopup();
}

function generateFHIR() {
  const inspection = document.forms['inspectionForm'];
  const sdoh = document.forms['sdohForm'];

  // ✅ Step 3B: Consent & signature validation
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

  const fhirBundle = {
    resourceType: "Bundle",
    type: "collection",
    entry: observations.map(obs => ({
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
        valueBoolean: obs.value,
        ...(geoCoords && {
          extension: [{
            url: "http://hl7.org/fhir/StructureDefinition/geolocation",
            extension: [
              { url: "latitude", valueDecimal: geoCoords.lat },
              { url: "longitude", valueDecimal: geoCoords.lng }
            ]
          }]
        })
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
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Healthy Homes Assessment Summary", 10, 10);
  doc.setFontSize(10);

  let y = 20;
  lastFHIRBundle.entry.forEach(entry => {
    const res = entry.resource;
    if (res.resourceType === "Observation") {
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

  doc.save("healthy-home-assessment.pdf");
}
