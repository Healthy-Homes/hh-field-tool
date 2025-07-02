document.addEventListener("DOMContentLoaded", () => {
  Papa.parse("data/sdoh.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      const sdohForm = document.getElementById("sdohForm");
      results.data.forEach(row => {
        const id = row.id?.trim();
        const enLabel = row.label_en?.trim();
        const zhLabel = row.label_zh?.trim();
        const type = row.type?.trim().toLowerCase();
        const options = row.options?.split('|').map(opt => opt.trim()) || [];

        if (!id || !type || !enLabel) return;

        // Label
        const label = document.createElement("label");
        label.setAttribute("for", id);
        label.setAttribute("data-i18n", `sdoh.${id}`);
        label.className = "block text-sm font-medium text-gray-700 mt-2";
        label.textContent = enLabel;
        sdohForm.appendChild(label);

        // Input field
        if (type === "select") {
          const select = document.createElement("select");
          select.name = id;
          select.id = id;
          select.className = "block w-full rounded border-gray-300 shadow-sm";
          select.setAttribute("data-i18n-options", id);
          select.setAttribute("data-sdoh", "");

          // Populate default options (so the dropdown isn't empty)
          const optDefault = document.createElement("option");
          optDefault.value = "";
          optDefault.textContent = currentLang === "zh" ? "請選擇" : "Select";
          select.appendChild(optDefault);

          options.forEach(val => {
            const opt = document.createElement("option");
            opt.value = val;
            opt.textContent = val;
            select.appendChild(opt);
          });

          sdohForm.appendChild(select);
        } else if (type === "number" || type === "text") {
          const input = document.createElement("input");
          input.type = type;
          input.name = id;
          input.id = id;
          input.setAttribute("data-sdoh", "");
          input.className = "block w-full rounded border-gray-300 shadow-sm";
          sdohForm.appendChild(input);
        }
      });

      populateSelectOptions();  // re-translate dropdowns
      applyTranslations();      // re-translate labels
    }
  });
});
