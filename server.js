const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Server-side token store — maps tokens to video URLs (never exposed to client)
const downloadTokens = new Map();
const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

function createDownloadToken(videoUrl, filename) {
    const token = crypto.randomBytes(24).toString('hex');
    downloadTokens.set(token, { videoUrl, filename, createdAt: Date.now() });
    // Cleanup expired tokens periodically
    setTimeout(() => downloadTokens.delete(token), TOKEN_EXPIRY_MS);
    return token;
}


const app = express();
const PORT = 3000;

// Security basic headers (CSP disabled to avoid breaking unoptimized frontend scripts)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Limit API requests to prevent abuse
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 60, // limit each IP to 60 API requests per minute
    message: { error: 'Too many requests from this IP, please try again in a minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json());

// SEO: Smart caching headers for static assets and HTML
app.use((req, res, next) => {
    const url = req.url.toLowerCase();

    // Long cache for static assets (CSS, JS, images, fonts, videos)
    if (/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|mp4|webm)$/i.test(url)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    // Short cache for HTML pages (1 hour) — allows fresh content while still caching
    else if (/\.(html?)$/i.test(url) || url === '/' || url === '') {
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
        res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    // Cache for XML/TXT (sitemap, robots) — 6 hours
    else if (/\.(xml|txt)$/i.test(url)) {
        res.setHeader('Cache-Control', 'public, max-age=21600');
    }

    next();
});

// SEO: Trailing slash redirect to prevent duplicate content
app.use((req, res, next) => {
    if (req.path !== '/' && req.path.endsWith('/') && !req.path.startsWith('/api')) {
        const newPath = req.path.slice(0, -1) + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
        return res.redirect(301, newPath);
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Apply the rate limiter strictly to API routes
app.use('/api/', apiLimiter);

// Single watermark removal
app.post('/api/remove-watermark', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const result = await processVideoUrl(url);
        res.json(result);
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to process video' });
    }
});

// Batch watermark removal
app.post('/api/batch', async (req, res) => {
    try {
        const { urls } = req.body;
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        const results = await Promise.allSettled(
            urls.map(url => processVideoUrl(url))
        );

        const output = results.map((r, i) => ({
            originalUrl: urls[i],
            ...(r.status === 'fulfilled' ? r.value : { error: r.reason?.message || 'Failed' })
        }));

        res.json({ results: output });
    } catch (err) {
        console.error('Batch error:', err.message);
        res.status(500).json({ error: err.message || 'Batch processing failed' });
    }
});

// Prepare ZIP — downloads videos in parallel (4 concurrent) with SSE progress
app.post('/api/prepare-zip', async (req, res) => {
    const { tokens } = req.body;
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        return res.status(400).json({ error: 'Tokens array is required' });
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data) => {
        try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch { }
    };

    const total = tokens.length;
    console.log(`\n📦 ZIP: ${total} videos, parallel download...`);
    send({ type: 'start', total });

    // Prepare download tasks
    const tasks = tokens.map((tokenObj, i) => {
        const entry = downloadTokens.get(tokenObj.token);
        const filename = tokenObj.filename || (entry ? entry.filename : null) || `video-${i + 1}.mp4`;
        return { index: i, filename, entry };
    });

    const results = new Array(total).fill(null);
    let completed = 0;
    let totalSize = 0;
    const CONCURRENCY = 4;

    // Worker function — pulls from shared queue
    const queue = [...tasks];
    async function worker() {
        while (queue.length > 0) {
            const task = queue.shift();
            if (!task) break;
            const { index, filename, entry } = task;

            if (!entry) {
                send({ type: 'file', index, filename, status: 'error', error: 'Token expired' });
                completed++;
                send({ type: 'progress', completed, total, pct: Math.round((completed / total) * 90) });
                continue;
            }

            send({ type: 'file', index, filename, status: 'downloading' });

            try {
                const response = await fetch(entry.videoUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://sora2.email/',
                    },
                    timeout: 120000,
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const buffer = await response.buffer();
                const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
                totalSize += buffer.length;
                results[index] = { filename, buffer };

                console.log(`  ✅ ${filename} (${sizeMB} MB)`);
                completed++;
                send({ type: 'file', index, filename, status: 'done', sizeMB });
                send({ type: 'progress', completed, total, pct: Math.round((completed / total) * 90) });
            } catch (err) {
                console.error(`  ❌ ${filename}: ${err.message}`);
                completed++;
                send({ type: 'file', index, filename, status: 'error', error: err.message });
                send({ type: 'progress', completed, total, pct: Math.round((completed / total) * 90) });
            }
        }
    }

    // Launch parallel workers
    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY, tasks.length); i++) {
        workers.push(worker());
    }
    await Promise.all(workers);

    // Filter successful downloads
    const buffers = results.filter(Boolean);

    if (buffers.length === 0) {
        send({ type: 'error', error: 'All downloads failed' });
        res.end();
        return;
    }

    // Build ZIP
    send({ type: 'progress', completed: total, total, pct: 95, status: 'zipping' });

    const archiveChunks = [];
    const archive = archiver('zip', { store: true });
    archive.on('data', chunk => archiveChunks.push(chunk));

    await new Promise((resolve, reject) => {
        archive.on('end', resolve);
        archive.on('error', reject);
        for (const { filename, buffer } of buffers) archive.append(buffer, { name: filename });
        archive.finalize();
    });

    const zipBuffer = Buffer.concat(archiveChunks);
    const zipToken = crypto.randomBytes(16).toString('hex');
    downloadTokens.set('zip_' + zipToken, {
        videoUrl: null,
        zipBuffer,
        filename: 'sora-videos.zip',
        createdAt: Date.now(),
    });
    setTimeout(() => downloadTokens.delete('zip_' + zipToken), 10 * 60 * 1000);

    const zipSizeMB = (zipBuffer.length / 1024 / 1024).toFixed(1);
    console.log(`📦 ZIP ready: ${zipSizeMB} MB, ${buffers.length}/${total} files`);
    send({
        type: 'done',
        zipToken,
        zipSizeMB,
        fileCount: buffers.length,
        totalFiles: total,
    });

    res.end();
});

// Download the pre-built ZIP (instant)
app.get('/api/zip/:token', (req, res) => {
    const entry = downloadTokens.get('zip_' + req.params.token);
    if (!entry || !entry.zipBuffer) {
        return res.status(404).send('ZIP not found or expired');
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="sora-videos.zip"');
    res.setHeader('Content-Length', entry.zipBuffer.length);
    res.send(entry.zipBuffer);
});

// Secure token-based download — video URL never exposed to client
app.get('/api/download/:token', async (req, res) => {
    try {
        const entry = downloadTokens.get(req.params.token);
        if (!entry) return res.status(404).send('Download link expired or invalid');

        // Check expiry
        if (Date.now() - entry.createdAt > TOKEN_EXPIRY_MS) {
            downloadTokens.delete(req.params.token);
            return res.status(410).send('Download link has expired');
        }

        console.log(`[Download] Token ${req.params.token.substring(0, 8)}... -> streaming video`);

        const response = await fetch(entry.videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://sora2.email/',
            }
        });

        if (!response.ok) throw new Error(`Upstream error: ${response.status}`);

        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${entry.filename || 'sora-video.mp4'}"`);
        if (response.headers.get('content-length')) {
            res.setHeader('Content-Length', response.headers.get('content-length'));
        }

        response.body.pipe(res);
    } catch (err) {
        console.error('Download error:', err.message);
        res.status(500).send('Download failed');
    }
});

/**
 * Core function: Process a Sora video URL to get the watermark-free version.
 * 
 * Strategy 1 (PRIMARY): Use the dyysy.com API — returns links.mp4 (NO watermark)
 * Strategy 2 (FALLBACK): Direct CDN URL construction
 */

const API_BASE = 'https://api.dyysy.com/links20260207/';
const CDN_BASE = 'https://oscdn2.dyysy.com/MP4/';

function extractSoraVideoId(url) {
    // Match s_{hex} pattern
    const sMatch = url.match(/s_([a-fA-F0-9]+)/);
    if (sMatch) return 's_' + sMatch[1];

    // Match /p/{id} or /g/{id} pattern
    const pathMatch = url.match(/\/(?:p|g)\/([^/?#&]+)/);
    if (pathMatch) return pathMatch[1];

    return null;
}

async function processVideoUrl(url) {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) throw new Error('Empty URL');

    const videoId = extractSoraVideoId(trimmedUrl);
    const legacyId = extractVideoId(trimmedUrl);
    console.log(`\n[Processing] ${trimmedUrl}`);
    console.log(`[Video ID] ${videoId || 'unknown'}`);

    // ═══════════════════════════════════════════════════════
    // STRATEGY 1: dyysy.com API (PRIMARY — returns NO watermark)
    // The API response has:
    //   links.mp4        → watermark-FREE video ✅
    //   links.mp4_source → alternative no-watermark source
    //   links.mp4_wm     → WITH watermark (DO NOT USE)
    // ═══════════════════════════════════════════════════════
    try {
        const encodedUrl = encodeURIComponent(trimmedUrl);
        const apiUrl = API_BASE + encodedUrl;
        console.log(`[Strategy 1] API: ${apiUrl.substring(0, 80)}...`);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://sora2.email/',
                'Origin': 'https://sora2.email',
            },
            timeout: 30000,
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[Strategy 1] API response keys:`, Object.keys(data));

            if (data.links) {
                console.log(`[Strategy 1] Available links:`, Object.keys(data.links));
            }

            // Extract the NO-WATERMARK video URL
            // IMPORTANT: Use mp4 or mp4_source, NOT mp4_wm
            const videoUrl = data.links?.mp4 || data.links?.mp4_source || null;
            const wmUrl = data.links?.mp4_wm || null;

            if (videoUrl) {
                console.log(`[Strategy 1] ✅ No-watermark URL found!`);
                console.log(`[Strategy 1]   Clean: ${videoUrl.substring(0, 80)}...`);
                if (wmUrl) console.log(`[Strategy 1]   WM (skipped): ${wmUrl.substring(0, 80)}...`);

                const thumbnail = data.post_info?.thumbnail || data.post_info?.cover || null;
                const title = data.post_info?.title || data.post_info?.desc || 'Sora Video';

                // Create a secure token — video URL stays server-side
                const downloadToken = createDownloadToken(videoUrl, `${legacyId || 'sora-video'}.mp4`);

                return {
                    success: true,
                    originalUrl: trimmedUrl,
                    downloadToken,
                    thumbnail,
                    title,
                    videoId: legacyId,
                };
            } else {
                console.log(`[Strategy 1] API returned data but no mp4 link, trying fallback...`);
                console.log(`[Strategy 1] Full response:`, JSON.stringify(data).substring(0, 300));
            }
        } else {
            console.log(`[Strategy 1] API returned ${response.status}, trying fallback...`);
        }
    } catch (err) {
        console.log(`[Strategy 1] API error: ${err.message}, trying fallback...`);
    }

    // ═══════════════════════════════════════════════════════
    // STRATEGY 2: CDN Direct (FALLBACK)
    // Construct URL directly — may or may not have watermark
    // ═══════════════════════════════════════════════════════
    if (videoId) {
        const cdnUrl = CDN_BASE + videoId;
        console.log(`[Strategy 2] CDN: ${cdnUrl}`);

        try {
            const checkResp = await fetch(cdnUrl, {
                method: 'HEAD',
                timeout: 8000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://sora2.email/',
                },
            });

            if (checkResp.ok) {
                const contentType = checkResp.headers.get('content-type') || '';
                const contentLen = checkResp.headers.get('content-length');
                console.log(`[Strategy 2] ✅ CDN works! Type: ${contentType}, Size: ${contentLen ? (parseInt(contentLen) / 1024 / 1024).toFixed(1) + 'MB' : '?'}`);

                let thumbnail = null;
                let title = 'Sora Video';

                const downloadToken = createDownloadToken(cdnUrl, `${legacyId || 'sora-video'}.mp4`);

                return {
                    success: true,
                    originalUrl: trimmedUrl,
                    downloadToken,
                    thumbnail,
                    title,
                    videoId: legacyId,
                };
            } else {
                console.log(`[Strategy 2] CDN returned ${checkResp.status}`);
            }
        } catch (err) {
            console.log(`[Strategy 2] CDN error: ${err.message}`);
        }
    }

    throw new Error('Could not get watermark-free video. The API may be down or the link may be invalid/expired.');
}



function extractVideoId(url) {
    // Match sora.chatgpt.com/p/{id} or sora.com/p/{id}
    let match = url.match(/sora(?:\.chatgpt)?\.com\/(?:p|g)\/([^\/?#]+)/);
    if (match) return match[1];

    // Match short links like /s_{id}
    match = url.match(/\/(s_[^\/?#]+)/);
    if (match) return match[1];

    // Match gen_ pattern
    match = url.match(/(gen_[^\/?#&]+)/);
    if (match) return match[1];

    // Fallback: use last path segment
    try {
        const u = new URL(url);
        const segments = u.pathname.split('/').filter(Boolean);
        if (segments.length) return segments[segments.length - 1];
    } catch { }

    return 'sora-video';
}

app.listen(PORT, () => {
    console.log(`\n⚡ SoraWatermarkRemover running at http://localhost:${PORT}\n`);
});
