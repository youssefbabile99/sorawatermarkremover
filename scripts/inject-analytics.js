const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const blogPostsDir = path.join(publicDir, 'blog', 'posts');

const gaScript = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-HK1K6V9BEY"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-HK1K6V9BEY');
</script>`;

function injectAnalytics(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if already injected
        if (content.includes('G-HK1K6V9BEY')) {
            console.log(`[SKIP] Analytics already in ${path.basename(filePath)}`);
            return;
        }

        // Find the closing </head> tag and inject right before it
        const headEndIndex = content.indexOf('</head>');
        if (headEndIndex === -1) {
            console.warn(`[WARN] No </head> tag found in ${path.basename(filePath)}`);
            return;
        }

        const newContent = content.slice(0, headEndIndex) + `    ${gaScript}\n` + content.slice(headEndIndex);

        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`[OK] Injected Analytics into ${path.basename(filePath)}`);
    } catch (err) {
        console.error(`[ERROR] Processing ${filePath}:`, err.message);
    }
}

// Process main public html files
const htmlFiles = ['index.html', 'batch.html', 'about.html', 'blog.html', 'contact.html', 'cookie.html', 'disclaimer.html', 'privacy.html', 'terms.html'];

htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
        injectAnalytics(filePath);
    }
});

// Process all blog post html files
if (fs.existsSync(blogPostsDir)) {
    const blogFiles = fs.readdirSync(blogPostsDir).filter(file => file.endsWith('.html'));
    blogFiles.forEach(file => {
        const filePath = path.join(blogPostsDir, file);
        injectAnalytics(filePath);
    });
}

console.log('✅ Google Analytics injection complete!');
