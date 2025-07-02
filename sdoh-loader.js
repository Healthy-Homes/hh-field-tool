function loadSDOH() {
  fetch('data/sdoh.csv')
    .then(response => response.text())
    .then(csv => {
      const parsed = Papa.parse(csv, { header: true });
      const sdohContainer = document.getElementById('sdohContainer');
      sdohContainer.innerHTML = '';
      parsed.data.forEach(item => {
        if (!item.id || !item.en) return;
        const div = document.createElement('div');
        div.className = 'mb-2';
        const label = document.createElement('label');
        label.textContent = item[currentLang] || item.en;
        label.setAttribute('for', item.id);
        const select = document.createElement('select');
        select.id = item.id;
        select.name = item.id;
        select.className = 'block w-full mt-1';
        const options = (item.options || '').split(';');
        options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.trim();
          option.textContent = opt.trim();
          select.appendChild(option);
        });
        div.appendChild(label);
        div.appendChild(select);
        sdohContainer.appendChild(div);
      });
    })
    .catch(err => {
      console.error('[sdoh-loader] Failed to load SDOH:', err);
      document.getElementById('sdohContainer').innerHTML = '<p class="text-red-500">⚠️ Failed to load sdoh.csv</p>';
    });
}
