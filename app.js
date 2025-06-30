let lastFHIRBundle = null;

function generateFHIR() {
  const inspection = document.forms['inspectionForm'];
  const sdoh = document.forms['sdohForm'];

  const observations = [];

  if (inspection.mold.checked) {
    observations.push({
      code: "93041-2",
      description: "Visible mold",
      value: true
    });
  }

  if (inspection.pests.checked) {
    observations.push({
      code: "93043-8",
      description: "Pest infestation",
      value: true
    });
  }

  if (inspection.leaks.checked) {
    observations.push({
      code: "99999-9",
      description: "Water leaks or dampness",
      value: true
    });
  }

  if (inspection.lead.checked) {
    observations.push({
      code: "93044-6",
      description: "Lead paint risk (pre-1978 home)",
      value: true
    });
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
  };

  document.getElementById("output").textContent = JSON.stringify(fhirBundle, null, 2);
  lastFHIRBundle = fhirBundle; // Store for download
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
  lastFHIRBundle.entry.forEach((entry, i) => {
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

  doc.save("healthy-home-assessment.pdf");
}
