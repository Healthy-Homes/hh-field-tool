// checklist-loader.js

async function loadChecklist() {
  try {
    const response = await fetch('data/checklist.csv');
    const text = await response.text();
    const results = Papa.parse(text.trim(), { header: true });
    console.log(results.data);
  } catch (e) {
    console.error("[checklist-loader] Failed to load checklist:", e);
  }
}

document.addEventListener('DOMContentLoaded', loadChecklist);
