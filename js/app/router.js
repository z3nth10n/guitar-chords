(function () {
  const ABSOLUTE_PATH = getAbsolutePath();
  window.__COMPONENT_ROUTER_ACTIVE = true;

  const portalView = document.getElementById("portal-view");
  const portalParent = portalView ? portalView.parentElement : null;
  const portalNextSibling = portalView ? portalView.nextSibling : null;
  const componentView = document.getElementById("component-view");
  const globalLangSelect = document.getElementById("globalLangSelect");
  const globalBackButton = document.getElementById("global-back-btn");

  const templateCache = new Map();
  const loadedStyles = new Set();
  const scriptPromises = new Map();

  const routes = {
    home: {
      name: "home",
      translation: { prefix: "index", basePath: `${ABSOLUTE_PATH}langs` },
      langStorageKey: "portal_selectedLang",
    },
    "chord-by-fret": {
      name: "chord-by-fret",
      template: `${ABSOLUTE_PATH}components/chord-by-fret/chord-by-fret.html`,
      style: `${ABSOLUTE_PATH}components/chord-by-fret/chord-by-fret.css`,
      script: `${ABSOLUTE_PATH}components/chord-by-fret/chord-by-fret.js`,
      initFunction: "renderChordByFret",
      translation: {
        prefix: "chord-by-fret",
        basePath: `${ABSOLUTE_PATH}components/chord-by-fret/langs`,
      },
      langStorageKey: "chordByFret_selectedLang",
    },
    "chord-analysis": {
      name: "chord-analysis",
      template: `${ABSOLUTE_PATH}components/chord-analysis/chord-analysis.html`,
      style: `${ABSOLUTE_PATH}components/chord-analysis/chord-analysis.css`,
      script: `${ABSOLUTE_PATH}components/chord-analysis/chord-analysis.js`,
      initFunction: "renderChordAnalysis",
      translation: {
        prefix: "chord-analysis",
        basePath: `${ABSOLUTE_PATH}components/chord-analysis/langs`,
      },
      langStorageKey: "chordAnalysis_selectedLang",
    },
    "chord-library": {
      name: "chord-library",
      template: `${ABSOLUTE_PATH}components/chord-library/chord-library.html`,
      style: `${ABSOLUTE_PATH}components/chord-library/chord-library.css`,
      script: `${ABSOLUTE_PATH}components/chord-library/chord-library.js`,
      initFunction: "renderChordLibrary",
      translation: {
        prefix: "chord-library",
        basePath: `${ABSOLUTE_PATH}components/chord-library/langs`,
      },
      langStorageKey: "guitar_lang",
    },
    "visual-tab": {
      name: "visual-tab",
      template: `${ABSOLUTE_PATH}components/visual-tab/visual-tab.html`,
      style: `${ABSOLUTE_PATH}components/visual-tab/visual-tab.css`,
      script: `${ABSOLUTE_PATH}components/visual-tab/visual-tab.js`,
      initFunction: "renderVisualTab",
      translation: {
        prefix: "visual-tab",
        basePath: `${ABSOLUTE_PATH}components/visual-tab/langs`,
      },
      langStorageKey: "portal_selectedLang",
    },
  };

  function currentRouteName() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    return view && routes[view] ? view : "home";
  }

  if (globalBackButton) {
    globalBackButton.classList.add("hidden");
  }

  function buildRouteHref(routeName) {
    const url = new URL(window.location.href);
    if (!routeName || routeName === "home") {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", routeName);
    }
    return url.pathname + url.search + url.hash;
  }

  function attachRouteLinks(scope) {
    if (!scope) return;
    const links = scope.querySelectorAll("[data-route]");
    links.forEach((link) => {
      if (link.dataset.routeBound === "true") return;
      const target = link.getAttribute("data-route") || "home";
      link.href = buildRouteHref(target);
      link.addEventListener("click", (event) => {
        event.preventDefault();
        navigate(target);
      });
      link.dataset.routeBound = "true";
    });
  }

  function getGlobalLanguage() {
    const saved = localStorage.getItem("portal_selectedLang");
    if (saved) return saved;
    if (globalLangSelect && globalLangSelect.value) {
      return globalLangSelect.value;
    }
    const browserLang = navigator.language || navigator.userLanguage || "en";
    return browserLang.startsWith("es") ? "es" : "en";
  }

  function updateGlobalLanguageSelection(lang, triggerChange = false) {
    if (!lang) return;
    if (globalLangSelect) {
      globalLangSelect.value = lang;
      if (triggerChange) {
        const evt = new Event("change", { bubbles: true });
        globalLangSelect.dispatchEvent(evt);
      }
    }
    localStorage.setItem("portal_selectedLang", lang);
  }

  function syncComponentLanguage(lang, triggerChange = true) {
    if (!componentView) return;
    const compLangSelect = componentView.querySelector("#langSelect");
    if (compLangSelect) {
      compLangSelect.value = lang;
      if (triggerChange) {
        const evt = new Event("change", { bubbles: true });
        compLangSelect.dispatchEvent(evt);
      }
    }
  }

  function toggleBackButton(show) {
    if (!globalBackButton) return;
    globalBackButton.classList.toggle("hidden", !show);
  }

  function restorePortalIfNeeded() {
    if (!portalView || !portalParent) return;
    if (!portalView.isConnected) {
      if (portalNextSibling && portalNextSibling.parentElement === portalParent) {
        portalParent.insertBefore(portalView, portalNextSibling);
      } else {
        portalParent.appendChild(portalView);
      }
    }
  }

  function removePortalIfNeeded() {
    if (portalView && portalView.isConnected) {
      portalView.remove();
    }
  }

  function setViewVisibility(showPortal) {
    document.documentElement.classList.toggle("component-active", !showPortal);
    if (showPortal) {
      restorePortalIfNeeded();
      if (portalView) {
        portalView.classList.remove("view-hidden");
      }
      if (componentView) {
        componentView.innerHTML = "";
        componentView.classList.add("view-hidden");
      }
    } else {
      removePortalIfNeeded();
    }
    if (componentView) {
      componentView.classList.toggle("view-hidden", showPortal);
    }
  }

  function resolveLanguage(route) {
    const globalLang = getGlobalLanguage();
    if (globalLang) return globalLang;

    if (route && route.langStorageKey) {
      const saved = localStorage.getItem(route.langStorageKey);
      if (saved) return saved;
    }

    const browserLang = navigator.language || navigator.userLanguage || "en";
    return browserLang.startsWith("es") ? "es" : "en";
  }

  function updateUrl(routeName, replaceHistory) {
    const url = new URL(window.location.href);
    if (!routeName || routeName === "home") {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", routeName);
    }
    const method = replaceHistory ? "replaceState" : "pushState";
    window.history[method]({}, "", url);
  }

  async function ensureStyle(href) {
    if (!href || loadedStyles.has(href)) return;
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => resolve();
      link.onerror = (err) => reject(err);
      document.head.appendChild(link);
      loadedStyles.add(href);
    });
  }

  async function ensureScript(src) {
    if (scriptPromises.has(src)) {
      return scriptPromises.get(src);
    }
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = (err) => {
        scriptPromises.delete(src);
        reject(err);
      };
      document.body.appendChild(script);
    });
    scriptPromises.set(src, promise);
    return promise;
  }

  async function loadTemplate(url) {
    if (templateCache.has(url)) {
      return templateCache.get(url);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status}`);
    }
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    doc.querySelectorAll("script").forEach((node) => node.remove());
    const html = doc.body ? doc.body.innerHTML : text;
    templateCache.set(url, html);
    return html;
  }

  async function navigate(routeName, options = {}) {
    const route = routes[routeName] || routes.home;
    const lang = resolveLanguage(route);

    if (!options.skipUrlUpdate) {
      updateUrl(route.name, options.replaceHistory);
    }

    if (route.name === "home") {
      toggleBackButton(false);
      setViewVisibility(true);
      attachRouteLinks(portalView);
      updateGlobalLanguageSelection(lang, false);
      if (window.setTranslationPrefix) {
        window.setTranslationPrefix("index", `${ABSOLUTE_PATH}langs`);
      }
      if (window.loadTranslations) {
        await window.loadTranslations(lang);
      }
      if (componentView) {
        componentView.innerHTML = "";
      }
      window.scrollTo(0, 0);
      return;
    }

    toggleBackButton(true);
    setViewVisibility(false);
    if (componentView) {
      componentView.innerHTML = "";
    }

    try {
      await ensureStyle(route.style);

      const html = await loadTemplate(route.template);
      if (componentView) {
        componentView.innerHTML = html;
        const backButton = componentView.querySelector(".back-button");
        if (backButton) {
          backButton.setAttribute("data-route", "home");
        }
        attachRouteLinks(componentView);
      }

      if (route.translation && window.setTranslationPrefix) {
        window.setTranslationPrefix(
          route.translation.prefix,
          route.translation.basePath
        );
      }

      await ensureScript(route.script);
      if (route.initFunction && typeof window[route.initFunction] === "function") {
        window[route.initFunction]();
      }

      updateGlobalLanguageSelection(lang, false);
      syncComponentLanguage(lang, true);

      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error loading route", route.name, error);
      if (componentView) {
        componentView.innerHTML =
          '<div class="route-error">Unable to load this view right now.</div>';
      }
    }
  }

  window.addEventListener("popstate", () => {
    navigate(currentRouteName(), { replaceHistory: true, skipUrlUpdate: true });
  });

  if (globalLangSelect) {
    globalLangSelect.addEventListener("change", (event) => {
      const lang = event.target.value || "en";
      updateGlobalLanguageSelection(lang, false);

      if (window.loadTranslations) {
        window.loadTranslations(lang).then(() => {
          syncComponentLanguage(lang, true);
        });
      } else {
        syncComponentLanguage(lang, true);
      }
    });
  }

  attachRouteLinks(document);
  navigate(currentRouteName(), { replaceHistory: true });
})();
