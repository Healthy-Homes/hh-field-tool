function loadChecklist(csvText) {
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      const checklistContainer = document.getElementById('inspectionForm');
      if (!checklistContainer) return;

      checklistContainer.innerHTML = '';

      results.data.forEach(item => {
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'flex items-start';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = item.id;
        checkbox.id = item.id;
        checkbox.value = 'true';
        checkbox.className = 'mt-1';

        const label = document.createElement('label');
        label.setAttribute('for', item.id);
        label.className = 'ml-2 text-sm';
        label.textContent = item.label || '[Missing label]';

        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(label);
        checklistContainer.appendChild(checkboxWrapper);
      });
    }
  });
}

fetch('data/checklist.csv')
  .then(response => response.text())
  .then(csvText => loadChecklist(csvText))
  .catch(error => console.error('Error loading checklist:', error));
