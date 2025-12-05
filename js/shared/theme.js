(function() {
  const themeKey = 'guitar-tools-theme';
  
  function getTheme() {
    return localStorage.getItem(themeKey) || 'dark';
  }
  
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(themeKey, theme);
    updateButtonIcon(theme);
  }
  
  function toggleTheme() {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }
  
  function updateButtonIcon(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    // Sun for light (to switch to dark), Moon for dark (to switch to light)
    // Actually usually the icon represents the CURRENT state or the ACTION.
    // Let's use: Sun icon when in Dark mode (click to go Light), Moon icon when in Light mode (click to go Dark).
    btn.innerHTML = theme === 'dark' ? '☀️' : '🌙'; 
    btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }
  
  function initTheme() {
    const theme = getTheme();
    setTheme(theme);
    
    // Create button if it doesn't exist
    if (!document.getElementById('theme-toggle-btn')) {
      const btn = document.createElement('button');
      btn.id = 'theme-toggle-btn';
      btn.className = 'theme-toggle-btn';
      btn.onclick = toggleTheme;
      
      // Check if lang-selector exists to adjust position class
      if (document.querySelector('.lang-selector')) {
        btn.classList.add('has-lang-selector');
      }
      
      document.body.appendChild(btn);
      updateButtonIcon(theme);
    }
  }
  
  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
