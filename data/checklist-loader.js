// checklist-loader.js
async function loadChecklistCSV() {
  const response = await fetch('data/Final_Risk_List_CSV.csv');
  const text = await response.text();
  const rows = text.trim().split('\n').slice(1); // Skip header

  const checklistContainer = document.querySelector('#inspectionForm .grid');
  checklistContainer.innerHTML = ''; // Clear any static labels

  const currentLang = document.getElementById('langSelect')?.value || 'en';

  rows.forEach(row => {
    const [key, english, chinese] = row.split(',');

    const label = document.createElement('label');
    label.className = 'flex items-center space-x-2';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = key;

    const span = document.createElement('span');
    span.textContent = currentLang === 'zh' ? chinese : english;

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
