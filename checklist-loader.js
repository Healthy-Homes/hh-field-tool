// checklist-loader.js
fetch('data/checklist.csv')
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        const checklistContainer = document.getElementById('inspectionForm');
        if (!checklistContainer) return;
        checklistContainer.innerHTML = '';

        results.data.forEach(item => {
          const wrapper = document.createElement('div');
          wrapper.className = 'flex items-start';

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.name = item.id;
          checkbox.id = item.id;
          checkbox.value = 'true';
          checkbox.className = 'mt-1';

          const label = document.createElement('label');
          label.setAttribute('for', item.id);
          label.className = 'ml-2 text-sm';
          label.textContent = item.label;

          wrapper.appendChild(checkbox);
          wrapper.appendChild(label);
          checklistContainer.appendChild(wrapper);
        });
      }
    });
  })
  .catch(error => console.error('Error loading checklist:', error));
