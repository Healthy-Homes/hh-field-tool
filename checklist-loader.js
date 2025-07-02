// checklist-loader.js

(async function loadChecklist() {
  const checklistContainer = document.getElementById("inspectionForm");
  if (!checklistContainer) return;

  try {
    const response = await fetch("data/checklist.csv");
    if (!response.ok) throw new Error("Checklist CSV not found.");
    const csvText = await response.text();

    const results = Papa.parse(csvText, { header: true });
    const items = results.data.filter(row => row.key && row.english);

    const title = document.createElement("h2");
    title.className = "text-lg font-semibold text-green-700";
    title.dataset.i18n = "inspection.title";
    title.textContent = translations[currentLang]?.inspection?.title || "Home Inspection Checklist";
    checklistContainer.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 gap-3";
    checklistContainer.appendChild(grid);

    items.forEach(item => {
      const label = document.createElement("label");
      label.className = "flex items-center space-x-2";
      label.setAttribute("for", item.key);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = item.key;
      checkbox.name = item.key;

      const span = document.createElement("span");
      span.dataset.i18n = `inspection.${item.key}`;
      span.textContent = translations[currentLang]?.inspection?.[item.key] || item.english;

      label.appendChild(checkbox);
      label.appendChild(span);
      grid.appendChild(label);
    });
  } catch (err) {
    console.error("Error loading checklist items:", err);
  }
})();
