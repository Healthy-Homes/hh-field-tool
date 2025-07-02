// sdoh-loader.js
fetch('data/sdoh.csv')
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        const sdohContainer = document.getElementById('sdohForm');
        if (!sdohContainer) return;
        sdohContainer.innerHTML = '';

        results.data.forEach(item => {
          const wrapper = document.createElement('div');

          const label = document.createElement('label');
          label.setAttribute('for', item.id);
          label.className = 'block text-sm font-medium';
          label.textContent = item.label;
          wrapper.appendChild(label);

          if (item.type === 'select') {
            const select = document.createElement('select');
            select.id = item.id;
            select.name = item.id;
            select.className = 'mt-1 block w-full border p-2 rounded';

            const options = item.options ? item.options.split(';') : [];
            options.forEach(opt => {
              const option = document.createElement('option');
              option.value = opt;
              option.textContent = opt;
              select.appendChild(option);
            });

            wrapper.appendChild(select);
          } else {
            const input = document.createElement('input');
            input.type = item.type || 'text';
            input.id = item.id;
            input.name = item.id;
            input.placeholder = item.placeholder || '';
            input.className = 'mt-1 block w-full border p-2 rounded';
            wrapper.appendChild(input);
          }

          sdohContainer.appendChild(wrapper);
        });
      }
    });
  })
  .catch(error => console.error('Error loading SDOH:', error));
