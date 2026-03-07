/* ============================================
   SoraWatermarkRemover — Batch Mode JS
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('batch-urls');
    const btnBatch = document.getElementById('btn-batch');
    const btnPaste = document.getElementById('btn-paste-batch');
    const btnDownloadAll = document.getElementById('btn-download-all');
    const linkCount = document.getElementById('link-count');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const downloadAllContainer = document.getElementById('download-all-container');
    const results = document.getElementById('results');
    const toast = document.getElementById('toast');

    let processedVideos = [];

    // Navbar toggle (mobile)
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (navToggle && navLinks)
        navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

    // Navbar scroll shadow
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.4)' : 'none';
    });

    // Link counter
    if (textarea) {
        textarea.addEventListener('input', updateLinkCount);
        updateLinkCount();
    }

    function getUrls() {
        return textarea.value.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    }

    function updateLinkCount() {
        const urls = getUrls();
        linkCount.textContent = `${urls.length} link${urls.length !== 1 ? 's' : ''}`;
    }

    // Paste
    if (btnPaste) {
        btnPaste.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                textarea.value = textarea.value ? textarea.value.trimEnd() + '\n' + text.trim() : text.trim();
                updateLinkCount();
                showToast('Links pasted!', 'success');
            } catch { showToast('Could not access clipboard', 'error'); }
        });
    }

    // Batch process
    btnBatch.addEventListener('click', async () => {
        const urls = getUrls();
        if (urls.length === 0) { showToast('Please paste at least one link', 'error'); return; }

        setLoading(btnBatch, true);
        results.innerHTML = '';
        processedVideos = [];
        downloadAllContainer.classList.remove('show');

        // Show progress
        progressContainer.style.display = 'flex';
        progressFill.style.width = '0%';
        progressText.textContent = `0 / ${urls.length}`;

        let completed = 0;

        // Process all in parallel (with a concurrency limit of 3)
        const queue = [...urls];
        const workers = [];
        const concurrency = 3;

        for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
            workers.push(processQueue());
        }

        async function processQueue() {
            while (queue.length > 0) {
                const url = queue.shift();
                const index = urls.indexOf(url);

                // Show skeleton
                const skeletonId = `skel-${index}`;
                const skel = document.createElement('div');
                skel.id = skeletonId;
                skel.className = 'result-card';
                skel.innerHTML = `<div class="skeleton skeleton-video"></div><div class="skeleton skeleton-text"></div>`;
                results.appendChild(skel);

                try {
                    const res = await fetch('/api/remove-watermark', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url }),
                    });
                    const data = await res.json();

                    const existing = document.getElementById(skeletonId);
                    if (existing) existing.remove();

                    if (!res.ok || data.error) {
                        renderError(url, data.error || 'Failed');
                    } else if (data.downloadToken) {
                        const id = extractId(url);
                        const title = data.title || id || 'Sora Video';
                        renderResult(data.downloadToken, title, id);
                        processedVideos.push({ token: data.downloadToken, filename: `${id || 'video-' + (index + 1)}.mp4` });
                    } else {
                        renderError(url, 'No download available');
                    }
                } catch (err) {
                    const existing = document.getElementById(skeletonId);
                    if (existing) existing.remove();
                    renderError(url, err.message);
                }

                completed++;
                const pct = (completed / urls.length) * 100;
                progressFill.style.width = `${pct}%`;
                progressText.textContent = `${completed} / ${urls.length}`;
            }
        }

        await Promise.all(workers);
        setLoading(btnBatch, false);

        // Show download all if we have results
        if (processedVideos.length > 0) {
            downloadAllContainer.classList.add('show');
        }
    });

    // Download All as ZIP
    if (btnDownloadAll) {
        btnDownloadAll.addEventListener('click', async () => {
            if (processedVideos.length === 0) return;
            btnDownloadAll.disabled = true;

            // Create progress overlay
            const overlay = document.createElement('div');
            overlay.className = 'zip-overlay';
            overlay.innerHTML = `
                <div class="zip-modal">
                    <h3>📦 Preparing ZIP Download</h3>
                    <div class="zip-progress-bar"><div class="zip-progress-fill" id="zip-fill"></div></div>
                    <div class="zip-status" id="zip-status">Starting...</div>
                    <div class="zip-file-list" id="zip-file-list"></div>
                    <div class="zip-summary" id="zip-summary"></div>
                    <button class="btn-cancel-zip" id="btn-cancel-zip">Cancel</button>
                </div>`;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('show'));

            const fillBar = document.getElementById('zip-fill');
            const statusEl = document.getElementById('zip-status');
            const fileList = document.getElementById('zip-file-list');
            const summaryEl = document.getElementById('zip-summary');
            let cancelled = false;

            document.getElementById('btn-cancel-zip').addEventListener('click', () => {
                cancelled = true;
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
                btnDownloadAll.disabled = false;
            });

            try {
                const res = await fetch('/api/prepare-zip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tokens: processedVideos }),
                });

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let total = processedVideos.length;
                let completed = 0;
                let totalSizeMB = 0;
                let zipToken = null;

                while (true) {
                    if (cancelled) break;
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const data = JSON.parse(line.slice(6));

                        if (data.type === 'start') {
                            total = data.total;
                            statusEl.textContent = `Downloading 0 / ${total} videos...`;
                        }
                        else if (data.type === 'progress') {
                            fillBar.style.width = data.pct + '%';
                            if (data.status === 'zipping') {
                                statusEl.textContent = `Packaging videos into ZIP...`;
                            } else {
                                statusEl.textContent = `Downloaded ${data.completed} / ${data.total} videos`;
                            }
                        }
                        else if (data.type === 'file') {
                            if (data.status === 'downloading') {
                                const row = document.createElement('div');
                                row.className = 'zip-file-row';
                                row.id = `zip-file-${data.index}`;
                                row.innerHTML = `<span class="zip-file-spinner"></span><span class="zip-file-name">${escapeHtml(data.filename)}</span><span class="zip-file-size">downloading...</span>`;
                                fileList.appendChild(row);
                                fileList.scrollTop = fileList.scrollHeight;
                            }
                            else if (data.status === 'done') {
                                const row = document.getElementById(`zip-file-${data.index}`);
                                if (row) {
                                    row.innerHTML = `<span class="zip-file-icon">✅</span><span class="zip-file-name">${escapeHtml(data.filename)}</span><span class="zip-file-size">${data.sizeMB} MB</span>`;
                                }
                            }
                            else if (data.status === 'error') {
                                let row = document.getElementById(`zip-file-${data.index}`);
                                if (!row) {
                                    row = document.createElement('div');
                                    row.id = `zip-file-${data.index}`;
                                    fileList.appendChild(row);
                                }
                                row.className = 'zip-file-row zip-file-error';
                                row.innerHTML = `<span class="zip-file-icon">❌</span><span class="zip-file-name">${escapeHtml(data.filename)}</span><span class="zip-file-size">${data.error}</span>`;
                            }
                        }
                        else if (data.type === 'done') {
                            zipToken = data.zipToken;
                            fillBar.style.width = '100%';
                            statusEl.textContent = `ZIP ready! ${data.fileCount}/${data.totalFiles} videos • ${data.zipSizeMB} MB`;
                            summaryEl.textContent = 'Starting download...';
                        }
                        else if (data.type === 'error') {
                            statusEl.textContent = '❌ ' + data.error;
                            summaryEl.textContent = '';
                        }
                    }
                }

                if (zipToken && !cancelled) {
                    // Auto-download the ZIP
                    const a = document.createElement('a');
                    a.href = `/api/zip/${zipToken}`;
                    a.download = 'sora-videos.zip';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    showToast(`ZIP downloaded!`, 'success');

                    summaryEl.innerHTML = '<span style="color:#4ade80">✅ Download started!</span>';
                    document.getElementById('btn-cancel-zip').textContent = 'Close';
                }
            } catch (err) {
                showToast('ZIP failed: ' + err.message, 'error');
                statusEl.textContent = '❌ ' + err.message;
                document.getElementById('btn-cancel-zip').textContent = 'Close';
            } finally {
                btnDownloadAll.disabled = false;
            }
        });
    }

    function renderResult(downloadToken, title, id) {
        const downloadUrl = `/api/download/${downloadToken}`;
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
      <video class="result-video" controls preload="metadata" src="${downloadUrl}"></video>
      <div class="result-info">
        <div class="result-meta">
          <div class="result-title">${escapeHtml((title || 'Sora Video').substring(0, 120))}</div>
        </div>
        <div class="result-actions">
          <a href="${downloadUrl}" download="${id || 'video'}.mp4" class="btn-download">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download MP4
          </a>
        </div>
      </div>`;
        results.appendChild(card);
    }

    function renderError(url, msg) {
        const card = document.createElement('div');
        card.className = 'result-card error';
        card.innerHTML = `<div class="error-message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>${msg} — ${url.substring(0, 50)}…</div>`;
        results.appendChild(card);
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function extractId(url) {
        const m = url.match(/\/p\/(s_[a-f0-9]+)/);
        return m ? m[1] : null;
    }

    function setLoading(btn, loading) {
        const text = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.btn-spinner');
        if (loading) { text.style.display = 'none'; spinner.style.display = 'block'; btn.disabled = true; }
        else { text.style.display = ''; spinner.style.display = 'none'; btn.disabled = false; }
    }

    function showToast(message, type = '') {
        toast.textContent = message;
        toast.className = 'toast show' + (type ? ' ' + type : '');
        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2500);
    }
});
