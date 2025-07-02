
async function loadSDOH() {
  try {
    const response = await fetch('data/sdoh.csv');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const rows = Papa.parse(text, { header: true, skipEmptyLines: true }).data;

    const sdohForm = document.getElementById('sdohForm');
    sdohForm.innerHTML = ''; // Clear existing entries

    rows.forEach(row => {
      const id = row.id?.trim();
      const type = row.type?.trim().toLowerCase();
      const label_en = row.label_en?.trim();
      if (!id || !type || !label_en) return;

      // Label
      const label = document.createElement('label');
      label.className = 'block text-sm font-medium text-gray-700';
      label.htmlFor = id;
      label.setAttribute('data-i18n', `sdoh.${id}`);
      label.textContent = translations[currentLang]?.sdoh?.[id] || label_en;
      sdohForm.appendChild(label);

      if (type === 'select') {
        const select = document.createElement('select');
        select.id = id;
        select.name = id;
        select.setAttribute('data-i18n-options', id);
        select.setAttribute('data-sdoh', '');
        select.className = 'block w-full rounded border-gray-300 shadow-sm';
        sdohForm.appendChild(select); // options filled via populateSelectOptions()
      } else if (type === 'text' || type === 'number') {
        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.name = id;
        input.setAttribute('data-sdoh', '');
        input.className = 'block w-full rounded border-gray-300 shadow-sm';
        sdohForm.appendChild(input);
      }
    });

    populateSelectOptions();
    applyTranslations();
  } catch (err) {
    console.error('[sdoh-loader] Failed to load SDOH:', err);
    const sdohForm = document.getElementById('sdohForm');
    sdohForm.innerHTML = '<p class="text-red-600 text-sm">⚠️ Failed to load sdoh.csv</p>';
  }
}

window.addEventListener('DOMContentLoaded', loadSDOH);
