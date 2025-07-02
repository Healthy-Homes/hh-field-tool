function loadChecklist() {
  fetch('data/checklist.csv')
    .then(response => response.text())
    .then(csv => {
      const parsed = Papa.parse(csv, { header: true });
      const checklistContainer = document.getElementById('checklistContainer');
      checklistContainer.innerHTML = '';
      parsed.data.forEach(item => {
        if (!item.id || !item.en) return;
        const div = document.createElement('div');
        div.className = 'mb-2';
        const label = document.createElement('label');
        label.className = 'inline-flex items-center';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = item.id;
        checkbox.name = item.id;
        checkbox.className = 'mr-2';
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(item[currentLang] || item.en));
        div.appendChild(label);
        checklistContainer.appendChild(div);
      });
    })
    .catch(err => {
      console.error('[checklist-loader] Failed to load checklist:', err);
      document.getElementById('checklistContainer').innerHTML = '<p class="text-red-500">⚠️ Failed to load checklist.csv</p>';
    });
}
