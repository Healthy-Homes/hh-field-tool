// checklist-loader.js using PapaParse
async function loadChecklistCSV() {
  const response = await fetch('data/Final_Risk_List_CSV.csv');
  const text = await response.text();

  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  });

  const checklistContainer = document.querySelector('#inspectionForm .grid');
  checklistContainer.innerHTML = '';

  const currentLang = document.getElementById('langSelect')?.value || 'en';

  result.data.forEach(item => {
    const label = document.createElement('label');
    label.className = 'flex items-center space-x-2';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = item.key;
    if (item.code_system) input.dataset.codeSystem = item.code_system;
    if (item.custom_code) input.dataset.customCode = item.custom_code;

    const span = document.createElement('span');
    span.textContent = currentLang === 'zh' ? item.chinese : item.english;

    label.appendChild(input);
    label.appendChild(span);
    checklistContainer.appendChild(label);
  });
}

document.getElementById('langSelect').addEventListener('change', () => {
  loadChecklistCSV();
});

window.addEventListener('DOMContentLoaded', () => {
  loadChecklistCSV();
});
