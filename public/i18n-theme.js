/**
 * SoraWatermarkRemover - Theme & Internationalization (i18n)
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initI18n();
});

/* ==========================================
 * THEME TOGGLE
 * ========================================== */
function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('sora-theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    // Default is dark. If saved is light or (no saved and system is light), set light.
    if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    toggleBtn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('sora-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('sora-theme', 'light');
        }
    });
}

/* ==========================================
 * INTERNATIONALIZATION (i18n)
 * ========================================== */
const translations = {
    en: {
        flag: '🇺🇸', name: 'English',
        'nav.howItWorks': 'How It Works',
        'nav.features': 'Features',
        'nav.batchMode': 'Batch Mode',
        'nav.blog': 'Blog',
        'nav.faq': 'FAQ',
        'nav.contact': 'Contact',
        'hero.badge': '⚡ Free • Fast • No Signup',
        'hero.title': 'Remove Sora Watermark',
        'hero.titleAccent': 'In 2 Seconds',
        'hero.subtitle': 'Paste any Sora share link — get a watermark-free HD video instantly. No upload needed, no account required.',
        'hero.singleVideo': 'Single Video',
        'hero.batchMode': 'Batch Mode',
        'hero.inputPlaceholder': 'Paste Sora video share link here…',
        'hero.paste': 'Paste',
        'hero.removeBtn': 'Remove Watermark Now'
    },
    ar: {
        flag: '🇸🇦', name: 'العربية',
        'nav.howItWorks': 'كيف يعمل',
        'nav.features': 'الميزات',
        'nav.batchMode': 'الوضع الجماعي',
        'nav.blog': 'المدونة',
        'nav.faq': 'الأسئلة الشائعة',
        'nav.contact': 'اتصل بنا',
        'hero.badge': '⚡ مجاني • سريع • بدون تسجيل',
        'hero.title': 'إزالة علامة سورا المائية',
        'hero.titleAccent': 'في ثانيتين',
        'hero.subtitle': 'الصق أي رابط فيديو سورا — احصل على فيديو عالي الدقة بدون علامة مائية على الفور. لا حاجة للرفع، لا حاجة لحساب.',
        'hero.singleVideo': 'فيديو واحد',
        'hero.batchMode': 'الوضع الجماعي',
        'hero.inputPlaceholder': 'الصق رابط فيديو سورا هنا…',
        'hero.paste': 'لصق',
        'hero.removeBtn': 'إزالة العلامة المائية الآن'
    },
    fr: {
        flag: '🇫🇷', name: 'Français',
        'nav.howItWorks': 'Comment ça marche',
        'nav.features': 'Fonctionnalités',
        'nav.batchMode': 'Mode en lot',
        'nav.blog': 'Blog',
        'nav.faq': 'FAQ',
        'nav.contact': 'Contact',
        'hero.badge': '⚡ Gratuit • Rapide • Sans Inscription',
        'hero.title': 'Supprimer le filigrane Sora',
        'hero.titleAccent': 'En 2 Secondes',
        'hero.subtitle': 'Collez n\'importe quel lien vidéo Sora — obtenez une vidéo HD sans filigrane instantanément. Aucun téléchargement nécessaire, aucun compte requis.',
        'hero.singleVideo': 'Vidéo unique',
        'hero.batchMode': 'Mode en lot',
        'hero.inputPlaceholder': 'Collez le lien de la vidéo Sora ici…',
        'hero.paste': 'Coller',
        'hero.removeBtn': 'Supprimer le filigrane maintenant'
    },
    de: {
        flag: '🇩🇪', name: 'Deutsch',
        'nav.howItWorks': 'Wie es funktioniert',
        'nav.features': 'Funktionen',
        'nav.batchMode': 'Stapelverarbeitung',
        'nav.blog': 'Blog',
        'nav.faq': 'FAQ',
        'nav.contact': 'Kontakt',
        'hero.badge': '⚡ Kostenlos • Schnell • Keine Anmeldung',
        'hero.title': 'Sora-Wasserzeichen entfernen',
        'hero.titleAccent': 'In 2 Sekunden',
        'hero.subtitle': 'Fügen Sie einen beliebigen Sora-Link ein — erhalten Sie sofort ein HD-Video ohne Wasserzeichen. Kein Upload nötig, kein Konto erforderlich.',
        'hero.singleVideo': 'Einzelnes Video',
        'hero.batchMode': 'Stapelverarbeitung',
        'hero.inputPlaceholder': 'Sora-Video-Link hier einfügen…',
        'hero.paste': 'Einfügen',
        'hero.removeBtn': 'Wasserzeichen jetzt entfernen'
    },
    ru: {
        flag: '🇷🇺', name: 'Русский',
        'nav.howItWorks': 'Как это работает',
        'nav.features': 'Функции',
        'nav.batchMode': 'Пакетный режим',
        'nav.blog': 'Блог',
        'nav.faq': 'ЧАВО',
        'nav.contact': 'Контакты',
        'hero.badge': '⚡ Бесплатно • Быстро • Без регистрации',
        'hero.title': 'Удалить водяной знак Sora',
        'hero.titleAccent': 'За 2 секунды',
        'hero.subtitle': 'Вставьте любую ссылку на видео Sora — мгновенно получите HD-видео без водяных знаков. Не нужно загружать, не нужен аккаунт.',
        'hero.singleVideo': 'Одно видео',
        'hero.batchMode': 'Пакетный режим',
        'hero.inputPlaceholder': 'Вставьте ссылку на видео Sora здесь…',
        'hero.paste': 'Вставить',
        'hero.removeBtn': 'Удалить водяной знак сейчас'
    }
};

function initI18n() {
    const langBtn = document.getElementById('lang-btn');
    const langDropdown = document.getElementById('lang-dropdown');
    const langOpts = document.querySelectorAll('.lang-opt');
    const flagEl = document.getElementById('lang-flag');
    const codeEl = document.getElementById('lang-code');
    if (!langBtn) return;

    // Determine initial language (saved or fallback to 'en')
    let currentLang = localStorage.getItem('sora-lang');
    if (!currentLang) {
        currentLang = 'en';
    }

    setLanguage(currentLang);

    // Only attach dropdown listeners if the elements exist on this page
    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            langDropdown.classList.remove('active');
        });

        langOpts.forEach(btn => {
            btn.addEventListener('click', () => {
                const selected = btn.getAttribute('data-lang');
                setLanguage(selected);
                langDropdown.classList.remove('active');
            });
        });
    }

    function setLanguage(langCode) {
        if (!translations[langCode]) langCode = 'en'; // fallback

        // Update UI elements if they exist
        const dict = translations[langCode];
        if (flagEl) flagEl.textContent = dict.flag;
        if (codeEl) codeEl.textContent = langCode.toUpperCase();

        // Update active class in dropdown if options exist
        if (langOpts.length > 0) {
            langOpts.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-lang') === langCode);
            });
        }

        // Translate DOM elements globally across any page
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.innerHTML = dict[key];
            }
        });

        // Translate placeholders globally across any page
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) {
                el.setAttribute('placeholder', dict[key]);
            }
        });

        // Save preference globally
        localStorage.setItem('sora-lang', langCode);

        // Set text direction for Arabic globally
        if (langCode === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', 'ar');
        } else {
            document.documentElement.removeAttribute('dir');
            document.documentElement.setAttribute('lang', langCode);
        }
    }
}
