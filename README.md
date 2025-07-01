# hh-field-tool
Privacy-first field tool for assessing environmental and housing health risks, with FHIR/SDOH support.
# Healthy Homes Practitioner App – Stable Release (v1.0)

**Release Tag**: `v1.0-stable`
**Date**: July 1, 2025
**Status**: ✅ Stable MVP Build

---

## 🌟 Overview

This app provides field workers with a browser-based tool for evaluating home environmental conditions, capturing resident social needs (SDOH), and generating standardized health reports with optional geolocation and photos.

---

## ✅ Features in This Release

### 🧩 Functional Components

* **Bilingual UI**: Toggle between English and Traditional Chinese using dynamic `lang/en.json` and `lang/zh.json` files.
* **Checklist System**: Health and safety hazards checklist for homes.
* **SDOH Questionnaire**: Includes food insecurity, housing stability, utility shutoffs, language preference, and income.
* **Consent Capture**: Checkbox + typed name as confirmation.
* **Photo Upload**: Multiple image preview and lightweight image embedding.
* **Geolocation Map**: Auto-loads user location into embedded Leaflet map.
* **Environmental Context (Mock)**: Static values shown for asthma risk, lead risk, and PM2.5.
* **FHIR JSON Export**: Output includes checklist, SDOH, and image metadata.
* **PDF Export**: Text-based summary report download.
* **Responsive UI**: Tailwind CSS-based mobile-friendly layout.

### ⚠️ Known Limitations

* **No backend yet**: All storage is local/in-browser.
* **Photo signatures not yet implemented**
* **No real environmental data APIs (yet)** — values are placeholder
* **Language preference input should be free text** (currently a dropdown)
* **Consent text still needs Traditional Chinese translation**

---

## 🧪 Under Development (for future tags)

* IndexedDB local save support
* Cloud sync (Firebase or GitHub backend)
* API integration with EJScreen or Taiwan equivalent
* Signature capture
* PWA support
* Translated README + multilingual markdown support

---

## 📁 Directory Structure

```
├── index.html            # App homepage
├── app.js                # Core logic (translation, form, map, export)
├── lang/
│   ├── en.json           # English translations
│   └── zh.json           # Traditional Chinese translations
├── style.css             # Optional overrides (minimal)
```

---

## 🚀 Deployment Instructions

1. Host contents via GitHub Pages or local web server.
2. Ensure directory includes all files above.
3. Open `index.html` in your browser.

---

## 💬 Contact

Maintained by Matthew Ulsh
Fulbright Public Health Research Fellow, Taiwan
HealthyHomesApp \[at] gmail.com (or GitHub Issues)

---

## 📝 License

MIT License (2025) – freely available for academic, public health, and nonprofit use.

---

Let this README evolve with the project. This is a public health tool, not a final product — and it gets better each time it’s tested in the real world.
