document.addEventListener("DOMContentLoaded", () => {
  // Set translation prefix for this page
  if (window.setTranslationPrefix) {
    window.setTranslationPrefix("index");
  }

  const langSelect =
    document.getElementById("globalLangSelect") ||
    document.getElementById("langSelect");
  const isGlobalSelector = langSelect && langSelect.id === "globalLangSelect";

  // Detect browser language
  const browserLang = navigator.language || navigator.userLanguage || "en";
  let userLang = browserLang.startsWith("es") ? "es" : "en";

  // Load saved language
  const savedLang = localStorage.getItem("portal_selectedLang");
  if (savedLang) {
    userLang = savedLang;
  }

  if (langSelect) {
    langSelect.value = userLang;

    if (!isGlobalSelector) {
      langSelect.addEventListener("change", (e) => {
        const newLang = e.target.value;
        localStorage.setItem("portal_selectedLang", newLang);
        if (window.loadTranslations) {
          window.loadTranslations(newLang);
        }
      });
    }
  }

  // Load initial translations (global selector handled by router)
  if (window.loadTranslations && !isGlobalSelector) {
    window.loadTranslations(userLang);
  }
});
