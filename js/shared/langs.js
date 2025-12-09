window.currentLang = "en";
window.translations = {};

const ABSOLUTE_PATH = '/music-tools';

function detectTranslationPrefix() {
  const path = `${ABSOLUTE_PATH}/langs`;
  if (path.indexOf("chord-analysis.html") !== -1) {
    return "chord-analysis/chord-analysis";
  } else if (path.indexOf("chord-by-fret.html") !== -1) {
    return "chord-by-fret/chord-by-fret";
  } else if (path.indexOf("chord-library.html") !== -1) {
    return "chord-library/chord-library";
  } else if (path.indexOf("visual-tab.html") !== -1) {
    return "visual-tab/visual-tab";
  }
  return "index";
}

window.translationPrefix = detectTranslationPrefix();
console.log("Auto-detected translation prefix:", window.translationPrefix);

window.setTranslationPrefix = function (prefix) {
  window.translationPrefix = prefix;
};

window.loadTranslations = function (lang, onLanguageLoaded) {
  console.log("Loading translations for:", lang);

  // Remove any existing translation script to avoid duplicates/conflicts
  const oldScript = document.getElementById("lang-script");
  if (oldScript) {
    oldScript.remove();
  }

  const script = document.createElement("script");
  script.id = "lang-script";
  script.src =
    "langs/" +
    window.translationPrefix +
    "." +
    lang +
    ".js?v=" +
    new Date().getTime();

  script.onload = function () {
    // The script should have set window.translations_en or window.translations_es
    const loadedTranslations = window["translations_" + lang];

    if (loadedTranslations) {
      window.translations = loadedTranslations;
      window.currentLang = lang;
      console.log(
        "Translations loaded:",
        Object.keys(window.translations).length,
        "keys"
      );
      applyTranslations();
      if (onLanguageLoaded) onLanguageLoaded();
    } else {
      console.error("Translations object not found for", lang);
      if (lang !== "en") {
        console.log("Falling back to English");
        window.loadTranslations("en", onLanguageLoaded);
      }
    }
  };

  script.onerror = function () {
    console.error("Error loading translation script for", lang);
    if (lang !== "en") {
      console.log("Falling back to English");
      window.loadTranslations("en", onLanguageLoaded);
    }
  };

  document.body.appendChild(script);
};

function applyTranslations() {
  // Update text content
  const textElements = document.querySelectorAll("[data-i18n]");
  textElements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (window.translations[key]) {
      if (el.getAttribute("data-i18n-html") === "true") {
        el.innerHTML = window.translations[key];
      } else {
        el.textContent = window.translations[key];
      }
    }
  });

  // Update placeholders
  const placeholderElements = document.querySelectorAll(
    "[data-i18n-placeholder]"
  );
  console.log("Found placeholder elements:", placeholderElements.length);
  placeholderElements.forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (window.translations[key]) {
      el.placeholder = window.translations[key];
      // Force update attribute for some browsers/inspectors
      el.setAttribute("placeholder", window.translations[key]);
    } else {
      console.warn("Missing translation for placeholder key:", key);
    }
  });
}

window.t = function (key) {
  return window.translations[key] || key;
};
