// app.js – Updated for full SDOH alignment, translation toggle integrity, and photo preview functionality

const i18nStrings = {
  en: {
    app: { title: "Healthy Homes Practitioner App", intro: "This tool helps field workers assess housing-related health risks and social needs." },
    language: { label: "Language:" },
    inspection: {
      title: "Home Inspection Checklist",
      moldVisible: "Visible mold",
      leakingPipes: "Water damage or leaks",
      noVentilation: "Poor ventilation",
      pestDroppings: "Signs of pests",
      electrical: "Unsafe electrical systems",
      tripHazards: "Trip hazards",
      otherHazards: "Other risks"
    },
    sdoh: {
      title: "Resident SDOH Questionnaire",
      housingStability: "Is your housing stable?",
      disabilityStatus: "Do you or anyone in your household have a disability?",
      utilityShutoff: "Have your utilities been shut off in the past year?",
      foodInsecurity: "How often do you worry about running out of food?",
      languagePref: "Preferred language for communication?",
      incomeLevel: "What is your monthly household income? (optional)"
    },
    consent: {
      title: "Consent & Signature",
      explained: "I have explained and received consent.",
      name: "Resident Name:",
      signature: "Signature:"
    },
    location: { title: "Inspection Map Location" },
    env: {
      title: "Environmental Context",
      asthmaRisk: "Asthma Risk:",
      leadRisk: "Lead Risk:",
      pm25: "PM2.5:",
      useLocation: "📍 Use My Location"
    },
    photo: { label: "Upload Photos (optional)" },
    fhir: {
      outputTitle: "FHIR JSON Output",
      generate: "Generate FHIR Report",
      downloadJson: "Download JSON",
      downloadPdf: "Download PDF"
    }
  },
  zh: {
    app: { title: "健康住宅實踐者應用程式", intro: "此工具幫助現場工作人員評估與住宅相關的健康風險和社會需求。" },
    language: { label: "語言：" },
    inspection: {
      title: "房屋檢查清單",
      moldVisible: "可見黴菌",
      leakingPipes: "水損或漏水",
      noVentilation: "通風不良",
      pestDroppings: "害蟲跡象",
      electrical: "電力系統不安全",
      tripHazards: "絆倒危險",
      otherHazards: "其他風險"
    },
    sdoh: {
      title: "居民社會健康決定因素問卷",
      housingStability: "您的住房是否穩定？",
      disabilityStatus: "您或您的家庭成員是否有殘疾？",
      utilityShutoff: "過去一年內您的水電是否被停用？",
      foodInsecurity: "您有多常擔心食物不足？",
      languagePref: "溝通偏好的語言？",
      incomeLevel: "您每月的家庭收入是多少？（可選填）"
    },
    consent: {
      title: "同意與簽名",
      explained: "我已說明並獲得同意。",
      name: "居民姓名：",
      signature: "簽名："
    },
    location: { title: "檢查地圖位置" },
    env: {
      title: "環境背景",
      asthmaRisk: "氣喘風險：",
      leadRisk: "鉛暴露風險：",
      pm25: "PM2.5：",
      useLocation: "📍 使用我的位置"
    },
    photo: { label: "上傳照片（可選）" },
    fhir: {
      outputTitle: "FHIR JSON 輸出",
      generate: "產生FHIR報告",
      downloadJson: "下載 JSON",
      downloadPdf: "下載 PDF"
    }
  }
};

function translate(lang) {
  const dict = i18nStrings[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const keys = el.getAttribute('data-i18n').split('.');
    let text = dict;
    keys.forEach(k => text = text?.[k]);
    if (text) el.textContent = text;
  });
  document.querySelectorAll('[data-i18n-options]').forEach(el => {
    const key = el.getAttribute('data-i18n-options').split('.').pop();
    el.innerHTML = `
      <option value="">Select</option>
      <option value="yes">${lang === 'zh' ? '是' : 'Yes'}</option>
      <option value="no">${lang === 'zh' ? '否' : 'No'}</option>
    `;
  });
}

document.getElementById("langSelect").addEventListener("change", e => translate(e.target.value));
window.addEventListener("DOMContentLoaded", () => translate("en"));

function generateFHIR() {
  const sdoh = {
    housingStability: document.getElementById("housingStability").value,
    disabilityStatus: document.getElementById("disabilityStatus").value,
    utilityShutoff: document.getElementById("utilityShutoff").value,
    foodInsecurity: document.getElementById("foodInsecurity").value,
    preferredLanguage: document.getElementById("preferredLanguage").value,
    incomeLevel: document.getElementById("incomeLevel").value
  };
  const fhir = { resourceType: "Observation", extension: Object.entries(sdoh).map(([k, v]) => ({ url: k, valueString: v })) };
  document.getElementById("output").textContent = JSON.stringify(fhir, null, 2);
}

function downloadJSON() {
  const blob = new Blob([document.getElementById("output").textContent], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "fhir_report.json";
  a.click();
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(document.getElementById("output").textContent, 10, 10);
  doc.save("fhir_report.pdf");
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const map = L.map('map').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([lat, lng]).addTo(map);
      document.getElementById("userAddress").textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    });
  }
}

document.getElementById("photoUpload").addEventListener("change", function () {
  const preview = document.getElementById("photoPreview");
  const status = document.getElementById("uploadStatus");
  preview.innerHTML = "";
  [...this.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.className = "w-full rounded border border-gray-300";
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
  status.textContent = `${this.files.length} photo(s) uploaded.`;
});
