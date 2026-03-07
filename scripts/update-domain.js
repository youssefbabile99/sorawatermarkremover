const fs = require('fs');
const path = require('path');

const directories = [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'public', 'blog', 'posts'),
    __dirname
];

const targetPattern = /www\.removesorawatermark\.online/g;
const newDomain = 'sorawatermarkremover.live';

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile() && (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.xml') || file.endsWith('.txt'))) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.match(targetPattern)) {
                content = content.replace(targetPattern, newDomain);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated domain in: ${filePath}`);
            }
        }
    });
}

directories.forEach(processDirectory);
console.log('Domain replacement complete.');
