const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'batch.html',
    'contact.html',
    'blog.html',
    'about.html',
    'privacy.html',
    'terms.html',
    'disclaimer.html',
    'cookie.html'
];

const navControlsHTML = `      <div class="nav-controls">
        <!-- Language Selector -->
        <div class="lang-selector" id="lang-selector">
          <button class="lang-btn" id="lang-btn" aria-label="Select Language">
            <span class="lang-flag" id="lang-flag">🇺🇸</span>
            <span class="lang-code" id="lang-code">EN</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="lang-dropdown" id="lang-dropdown">
            <button class="lang-opt active" data-lang="en"><span class="opt-flag">🇺🇸</span> English (EN)</button>
            <button class="lang-opt" data-lang="ar"><span class="opt-flag">🇸🇦</span> العربية (AR)</button>
            <button class="lang-opt" data-lang="fr"><span class="opt-flag">🇫🇷</span> Français (FR)</button>
            <button class="lang-opt" data-lang="de"><span class="opt-flag">🇩🇪</span> Deutsch (DE)</button>
            <button class="lang-opt" data-lang="ru"><span class="opt-flag">🇷🇺</span> Русский (RU)</button>
          </div>
        </div>
        <!-- Theme Toggle -->
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle Dark/Light Mode">
          <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>`;

filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, 'public', file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if it already has nav-controls to avoid duplicates
        if (!content.includes('class="nav-controls"')) {
            // Find the closing div of nav-links and insert navControlsHTML right after it
            content = content.replace(/<\/div>\s*<button class="nav-toggle"/, '</div>\n' + navControlsHTML + '\n            <button class="nav-toggle"');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated ' + file);
        } else {
            console.log('Skipped ' + file + ' (already has nav-controls)');
        }
    }
});
