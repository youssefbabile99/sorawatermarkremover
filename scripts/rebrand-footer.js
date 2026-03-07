const fs = require('fs');
const path = require('path');

const targetStr = '<span>Sora<span class="accent-text">WM</span></span>';
const newStr = '<span>Sora<span class="accent-text">WM</span></span>';

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (stat.isFile() && (file.endsWith('.html') || file.endsWith('.js'))) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(targetStr) || content.includes('SoraWatermarkRemover')) {
                let updatedContent = content.split(targetStr).join(newStr);
                updatedContent = updatedContent.replace(/SoraWatermarkRemover/g, 'SoraWatermarkRemover');

                if (updatedContent !== content) {
                    fs.writeFileSync(filePath, updatedContent, 'utf8');
                    console.log(`Rebranded footers in: ${filePath}`);
                }
            }
        }
    });
}

processDirectory(path.join(__dirname, '..', 'public'));
processDirectory(path.join(__dirname, '..', 'scripts'));
console.log('Rebranding complete.');
