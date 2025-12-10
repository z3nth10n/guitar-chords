window.currentLang = "en";
window.translations = {};

const ABSOLUTE_PATH = getAbsolutePath();
const DEFAULT_TRANSLATION_BASE = `${ABSOLUTE_PATH}langs`;

function normalizeBasePath(path) {
  if (!path) return DEFAULT_TRANSLATION_BASE;
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

function detectTranslationConfig() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get("view");

  if (path.includes("chord-analysis") || viewParam === "chord-analysis") {
    return {
      prefix: "chord-analysis",
      basePath: `${ABSOLUTE_PATH}components/chord-analysis/langs`,
    };
  }

  if (path.includes("chord-by-fret") || viewParam === "chord-by-fret") {
    return {
      prefix: "chord-by-fret",
      basePath: `${ABSOLUTE_PATH}components/chord-by-fret/langs`,
    };
  }

  if (path.includes("chord-library") || viewParam === "chord-library") {
    return {
      prefix: "chord-library",
      basePath: `${ABSOLUTE_PATH}components/chord-library/langs`,
    };
  }

  if (path.includes("visual-tab") || viewParam === "visual-tab") {
    return {
      prefix: "visual-tab",
      basePath: `${ABSOLUTE_PATH}components/visual-tab/langs`,
    };
  }

  return { prefix: "index", basePath: DEFAULT_TRANSLATION_BASE };
}

window.translationConfig = detectTranslationConfig();
window.translationPrefix = window.translationConfig.prefix;
console.log("Auto-detected translation prefix:", window.translationPrefix);

window.setTranslationPrefix = function (prefix, basePath) {
  window.translationConfig = {
    prefix: prefix || "index",
    basePath: normalizeBasePath(basePath),
  };
  window.translationPrefix = window.translationConfig.prefix;
};

window.loadTranslations = function (lang, onLanguageLoaded) {
  console.log("Loading translations for:", lang);

  return new Promise((resolve) => {
    // Remove any existing translation script to avoid duplicates/conflicts
    const oldScript = document.getElementById("lang-script");
    if (oldScript) {
      oldScript.remove();
    }

    const { prefix, basePath } = window.translationConfig || {};
    const finalPrefix = prefix || "index";
    const base = normalizeBasePath(basePath);

    const script = document.createElement("script");
    script.id = "lang-script";
    script.src = `${base}/${finalPrefix}.${lang}.js?v=${new Date().getTime()}`;

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
        resolve();
      } else {
        console.error("Translations object not found for", lang);
        if (lang !== "en") {
          console.log("Falling back to English");
          window
            .loadTranslations("en", onLanguageLoaded)
            .finally(() => resolve());
        } else {
          resolve();
        }
      }
    };

    script.onerror = function () {
      console.error("Error loading translation script for", lang);
      if (lang !== "en") {
        console.log("Falling back to English");
        window
          .loadTranslations("en", onLanguageLoaded)
          .finally(() => resolve());
      } else {
        resolve();
      }
    };

    document.body.appendChild(script);
  });
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

  // Update common attributes such as title or aria-label
  const attrConfigs = [
    { attr: "title", keyAttr: "data-i18n-title" },
    { attr: "aria-label", keyAttr: "data-i18n-aria-label" },
  ];
  attrConfigs.forEach(({ attr, keyAttr }) => {
    const attrElements = document.querySelectorAll(`[${keyAttr}]`);
    attrElements.forEach((el) => {
      const key = el.getAttribute(keyAttr);
      if (window.translations[key]) {
        el.setAttribute(attr, window.translations[key]);
      }
    });
  });
}

window.t = function (key) {
  return window.translations[key] || key;
};
