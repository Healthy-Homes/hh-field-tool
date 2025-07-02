// sdoh-loader.js

async function loadSDOH() {
  try {
    const response = await fetch('data/sdoh.csv');
    const text = await response.text();
    const results = Papa.parse(text.trim(), { header: true });
    console.log(results.data);
  } catch (e) {
    console.error("[sdoh-loader] Failed to load SDOH:", e);
  }
}

document.addEventListener('DOMContentLoaded', loadSDOH);
