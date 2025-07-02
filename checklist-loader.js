<script>
// checklist-loader.js
async function loadChecklist() {
  const response = await fetch('data/checklist.csv');
  const text = await response.text();
  const rows = Papa.parse(text, { header: true }).data;

  const checklistContainer = document.getElementById('inspectionForm');
  rows.forEach(row => {
    const label = document.createElement('label');
    label.className = 'flex items-center space-x-2';
    label.htmlFor = row.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = row.id;
    checkbox.name = row.id;

    const span = document.createElement('span');
    span.setAttribute('data-i18n', `inspection.${row.id}`);
    span.textContent = translations[currentLang]?.inspection?.[row.id] || row.label;

    label.appendChild(checkbox);
    label.appendChild(span);
    checklistContainer.appendChild(label);
  });
}

window.addEventListener('DOMContentLoaded', loadChecklist);
</script>

<script>
// sdoh-loader.js
async function loadSDOH() {
  const response = await fetch('data/sdoh.csv');
  const text = await response.text();
  const rows = Papa.parse(text, { header: true }).data;

  const sdohForm = document.getElementById('sdohForm');
  rows.forEach(row => {
    const label = document.createElement('label');
    label.className = 'block text-sm font-medium text-gray-700';
    label.htmlFor = row.id;
    label.setAttribute('data-i18n', `sdoh.${row.id}`);
    label.textContent = translations[currentLang]?.sdoh?.[row.id] || row.label;

    const select = document.createElement('select');
    select.id = row.id;
    select.name = row.id;
    select.className = 'block w-full rounded border-gray-300 shadow-sm';
    select.setAttribute('data-i18n-options', row.id);

    const options = translations[currentLang]?.sdohOptions?.[row.id];
    if (options) {
      Object.entries(options).forEach(([val, text]) => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = text;
        select.appendChild(opt);
      });
    }

    sdohForm.appendChild(label);
    sdohForm.appendChild(select);
  });
}

window.addEventListener('DOMContentLoaded', loadSDOH);
</script>
