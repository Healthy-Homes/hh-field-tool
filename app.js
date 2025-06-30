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
}
