
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  try {
    await loadTranslations('en'); // Default language
    document.getElementById('languageSelector')?.addEventListener('change', (e) => {
      loadTranslations(e.target.value);
    });

    if (document.getElementById('useLocationBtn')) {
      document.getElementById('useLocationBtn').addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          document.getElementById('locationInfo').textContent = `Lat: ${latitude}, Lon: ${longitude}`;
        });
      });
    }
  } catch (e) {
    console.error('[App Init] Failed to initialize app:', e);
  }
}

async function loadTranslations(lang) {
  try {
    const res = await fetch(`lang/${lang}.json`);
    const data = await res.json();

    document.getElementById('appTitle')?.textContent = data.appTitle || '';
    document.getElementById('consentText')?.textContent = data.consent || '';
    document.getElementById('nameLabel')?.placeholder = data.fullName || '';
    document.getElementById('locationInfo')?.textContent = '';
  } catch (e) {
    console.error(`[i18n] Failed to load ${lang} translations`, e);
  }
}
