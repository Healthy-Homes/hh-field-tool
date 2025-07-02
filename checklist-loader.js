
async function loadChecklist() {
  try {
    const response = await fetch('data/checklist.csv');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const rows = Papa.parse(text, { header: true, skipEmptyLines: true }).data;

    const checklistContainer = document.getElementById('inspectionForm');
    checklistContainer.innerHTML = ''; // Clear any existing entries

    rows.forEach(row => {
      const id = row.id?.trim();
      const label = row.label_en?.trim();
      if (!id || !label) return;

      const wrapper = document.createElement('label');
      wrapper.className = 'flex items-center space-x-2';
      wrapper.htmlFor = id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      checkbox.name = id;

      const span = document.createElement('span');
      span.setAttribute('data-i18n', `inspection.${id}`);
      span.textContent = translations[currentLang]?.inspection?.[id] || label;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(span);
      checklistContainer.appendChild(wrapper);
    });

    applyTranslations();
  } catch (err) {
    console.error('[checklist-loader] Failed to load checklist:', err);
    const checklistContainer = document.getElementById('inspectionForm');
    checklistContainer.innerHTML = '<p class="text-red-600 text-sm">⚠️ Failed to load checklist.csv</p>';
  }
}

window.addEventListener('DOMContentLoaded', loadChecklist);

