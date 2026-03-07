/* ============================================
   SoraWatermarkRemover — Landing Page JS
   Secure: no raw video URLs exposed to client
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('single-url');
    const btnProcess = document.getElementById('btn-process');
    const btnPaste = document.getElementById('btn-paste');
    const results = document.getElementById('results');
    const toast = document.getElementById('toast');

    // Mode tabs
    const modeTabs = document.querySelectorAll('.mode-tab');
    const singleCard = document.getElementById('tool-card-single');
    const batchCard = document.getElementById('tool-card-batch');

    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const mode = tab.dataset.mode;
            if (mode === 'single') {
                singleCard.style.display = '';
                if (batchCard) batchCard.style.display = 'none';
            } else {
                singleCard.style.display = 'none';
                if (batchCard) batchCard.style.display = '';
            }
        });
    });

    // Nav "Batch Mode" link switches to batch tab
    const navBatchLink = document.getElementById('nav-batch-link');
    if (navBatchLink) {
        navBatchLink.addEventListener('click', (e) => {
            e.preventDefault();
            const batchTab = document.querySelector('.mode-tab[data-mode="batch"]');
            if (batchTab) batchTab.click();
            document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Navbar toggle (mobile)
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    }

    // Sticky navbar effect on scroll
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Paste button
    if (btnPaste) {
        btnPaste.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                input.value = text.trim();
                showToast('Link pasted!', 'success');
            } catch { showToast('Could not access clipboard', 'error'); }
        });
    }

    // Process single video
    btnProcess.addEventListener('click', async () => {
        const url = input.value.trim();
        if (!url) { showToast('Please paste a Sora video link', 'error'); return; }

        setLoading(btnProcess, true);
        results.innerHTML = '';

        // Show skeleton
        results.innerHTML = `<div class="result-card"><div class="skeleton skeleton-video"></div><div class="skeleton skeleton-text"></div></div>`;

        try {
            const res = await fetch('/api/remove-watermark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();

            if (!res.ok || data.error) throw new Error(data.error || 'Processing failed');

            results.innerHTML = '';
            renderResult(data, url);
            showToast('Ready to download!', 'success');
        } catch (err) {
            results.innerHTML = `<div class="result-card error"><div class="error-message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>${err.message}</div></div>`;
        } finally {
            setLoading(btnProcess, false);
        }
    });

    function renderResult(data, url) {
        // Only a download token is returned — no raw video URL
        if (!data.downloadToken) {
            results.innerHTML = `<div class="result-card error"><div class="error-message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>No download available</div></div>`;
            return;
        }

        const id = data.videoId || extractId(url) || 'sora-video';
        const title = data.title ? escapeHtml(data.title).substring(0, 120) : id;
        const downloadUrl = `/api/download/${data.downloadToken}`;

        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
      <video class="result-video" controls preload="metadata" src="${downloadUrl}" ${data.thumbnail ? `poster="${data.thumbnail}"` : ''}></video>
      <div class="result-info">
        <div class="result-meta">
          <div class="result-title">${title}</div>
        </div>
        <div class="result-actions">
          <a href="${downloadUrl}" class="btn-download" download="${id}.mp4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download MP4
          </a>
        </div>
      </div>`;
        results.appendChild(card);
    }

    function extractId(url) {
        const m = url.match(/\/p\/(s_[a-f0-9]+)/);
        return m ? m[1] : null;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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
