// sdoh-loader.js – renders bilingual SDOH form dynamically
async function loadSDOHCSV() {
  const response = await fetch('data/SDOH_Questions_Bilingual_Updated.csv');
  const text = await response.text();

  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  });

  const sdohForm = document.getElementById('sdohForm');
  sdohForm.innerHTML = ''; // Clear static content

  const currentLang = document.getElementById('langSelect')?.value || 'en';

  // Section title
  const title = document.createElement('h2');
  title.className = 'text-lg font-semibold text-green-700';
  title.textContent = currentLang === 'zh' ? '居民社會決定因素問卷' : 'Resident SDOH Questionnaire';
  sdohForm.appendChild(title);

  result.data.forEach(item => {
    const label = document.createElement('label');
    label.className = 'block text-sm font-medium text-gray-700 mt-4';
    label.setAttribute('for', item.key);
    label.textContent = currentLang === 'zh' ? item.question_zh : item.question_en;

    const select = document.createElement('select');
    select.id = item.key;
    select.className = 'block w-full rounded border-gray-300 shadow-sm mt-1';

    const rawOptions = currentLang === 'zh' ? item.options_zh : item.options_en;
    const choices = rawOptions?.split(';') || [];

    // Add a default empty option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = currentLang === 'zh' ? '請選擇' : 'Select';
    select.appendChild(defaultOption);

    choices.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.trim();
      option.textContent = opt.trim();
      select.appendChild(option);
    });

    sdohForm.appendChild(label);
    sdohForm.appendChild(select);
  });
}

document.getElementById('langSelect').addEventListener('change', () => {
  loadSDOHCSV();
});

window.addEventListener('DOMContentLoaded', () => {
  loadSDOHCSV();
});
