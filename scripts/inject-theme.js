const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const files = ['blog.html', 'contact.html', 'about.html', 'batch.html', 'privacy.html', 'terms.html', 'disclaimer.html', 'cookie.html'];

files.forEach(file => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('i18n-theme.js')) {
            content = content.replace('</body>', '  <script src="i18n-theme.js"></script>\n</body>');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Injected i18n-theme.js into ${file}`);
        } else {
            console.log(`${file} already has i18n-theme.js`);
        }
    }
});
