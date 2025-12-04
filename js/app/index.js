document.addEventListener("DOMContentLoaded", () => {
  // Set translation prefix for this page
  if (window.setTranslationPrefix) {
    window.setTranslationPrefix('index');
  }

  const langSelect = document.getElementById("langSelect");
  
  // Detect browser language
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  let userLang = browserLang.startsWith('es') ? 'es' : 'en';

  // Load saved language
  const savedLang = localStorage.getItem("portal_selectedLang");
  if (savedLang) {
    userLang = savedLang;
  }
  
  if (langSelect) {
    langSelect.value = userLang;
    langSelect.addEventListener("change", (e) => {
      const newLang = e.target.value;
      localStorage.setItem("portal_selectedLang", newLang);
      if (window.loadTranslations) {
        window.loadTranslations(newLang);
      }
    });
  }

  // Load initial translations
  if (window.loadTranslations) {
    window.loadTranslations(userLang);
  }
});
