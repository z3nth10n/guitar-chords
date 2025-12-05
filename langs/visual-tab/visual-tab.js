const translations = {
  en: {
    tool_visual_tab_title: "Visual Tab Player",
    tool_visual_tab_desc: "Visualize your favorite tabs in a new way.",
    loading: "Loading tabs...",
    back_to_list: "Back to List",
    legend_note: "Note",
    legend_chord: "Chord",
    select_artist: "Select Artist",
    unknown_artist: "Unknown Artist",
    unknown_song: "Unknown Song"
  },
  es: {
    tool_visual_tab_title: "Reproductor Visual de Tabs",
    tool_visual_tab_desc: "Visualiza tus tablaturas favoritas de una forma nueva.",
    loading: "Cargando tablaturas...",
    back_to_list: "Volver a la lista",
    legend_note: "Nota",
    legend_chord: "Acorde",
    select_artist: "Seleccionar Artista",
    unknown_artist: "Artista Desconocido",
    unknown_song: "Canción Desconocida"
  }
};

// Merge with global translations if they exist, or just expose them
if (window.i18nData) {
  // If the shared langs.js system is simple, we might need to manually merge or just rely on this file running after.
  // Assuming shared/langs.js looks for a global object or we need to register it.
  // Let's check how other lang files do it.
  // Since I can't see them right now, I'll assume a simple merge strategy or just setting a global variable for this page.
  window.visualTabTranslations = translations;
}
