(function () {
    const HEADER_PLACEHOLDER = '[data-include="header"]';

    function computeBasePath() {
        const scripts = document.getElementsByTagName('script');
        let scriptSrc = '';

        for (let i = scripts.length - 1; i >= 0; i -= 1) {
            const current = scripts[i];
            const srcAttr = current.getAttribute('src');
            if (srcAttr && srcAttr.includes('/js/header.js')) {
                scriptSrc = srcAttr;
                break;
            }
        }

        if (!scriptSrc) {
            return './';
        }

        const cleanSrc = scriptSrc.split('#')[0].split('?')[0];
        const parts = cleanSrc.split('/');
        parts.pop(); // remove file name
        const maybeJsFolder = parts.pop();

        if (maybeJsFolder && maybeJsFolder !== 'js') {
            parts.push(maybeJsFolder);
        }

        let base = parts.join('/');
        if (!base || base === '.') {
            return './';
        }

        if (!base.endsWith('/')) {
            base += '/';
        }

        return base;
    }

    const SITE_BASE = computeBasePath();
    const PARTIAL_URL = `${SITE_BASE}partials/header.html`;
    const FALLBACK_HTML = `
<header class="site-header" data-component="site-header">
    <div class="header-container">
        <a class="logo-link" data-root-href="index.html" href="#" aria-label="Cooperativa CRAM - Inicio">
            <img data-root-src="assets/logo.png" alt="Logo Cooperativa CRAM" class="logo" loading="lazy">
        </a>
        <h1>Cooperativa CRAM</h1>
        <div class="cram-dropdown" id="userDropdown">
            <button class="btn-login cram-toggle" type="button" aria-expanded="false">
                Mi Cuenta
                <span class="cram-caret" aria-hidden="true"></span>
            </button>
            <div class="cram-menu" role="menu">
                <a data-root-href="credenciales/login.html" href="#">Iniciar sesión</a>
                <a data-root-href="catalogo.html" href="#">Hacer pedido</a>
                <a data-root-href="roles/admin/administracion.html" href="#">Administración</a>
                <a data-root-href="roles/worker/pedidos.html" href="#">Pedidos (trabajo)</a>
                <a data-root-href="roles/marketing/noticias.html" href="#">Novedades</a>
            </div>
        </div>
    </div>
</header>`;

    let headerInitialized = false;

    function markCatalogPage() {
        if (document.querySelector('.main-catalogo')) {
            document.body.classList.add('page-catalogo');
        } else {
            document.body.classList.remove('page-catalogo');
        }
    }

    function initHeaderBehaviour() {
        if (headerInitialized) {
            markCatalogPage();
            return;
        }

        const headerEl = document.querySelector('header.site-header');
        const wrap = document.getElementById('userDropdown');
        const btn = wrap ? wrap.querySelector('.cram-toggle') : null;
        const menu = wrap ? wrap.querySelector('.cram-menu') : null;

        const setHeaderOffset = () => {
            const height = headerEl ? headerEl.offsetHeight || 0 : 0;
            document.documentElement.style.setProperty('--header-offset', `${height}px`);
        };

        if (btn && menu && wrap) {
            const close = () => {
                wrap.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
                menu.style.display = '';
                setHeaderOffset();
            };

            const open = () => {
                wrap.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
                menu.style.display = 'flex';
                setHeaderOffset();
            };

            btn.addEventListener('click', (event) => {
                event.preventDefault();
                if (wrap.classList.contains('open')) {
                    close();
                } else {
                    open();
                }
            });

            document.addEventListener('click', (event) => {
                if (!wrap.contains(event.target)) {
                    close();
                }
            });

            window.addEventListener('resize', setHeaderOffset);
            window.addEventListener('load', setHeaderOffset);
        }

        setHeaderOffset();

        markCatalogPage();
        headerInitialized = true;
    }

    function applyRootPaths(container, basePath) {
        const normalizedBase = basePath === './' ? '' : basePath;

        container.querySelectorAll('[data-root-href]').forEach((el) => {
            const target = el.getAttribute('data-root-href');
            if (target) {
                el.setAttribute('href', `${normalizedBase}${target}`);
            }
        });

        container.querySelectorAll('[data-root-src]').forEach((el) => {
            const target = el.getAttribute('data-root-src');
            if (target) {
                el.setAttribute('src', `${normalizedBase}${target}`);
            }
        });
    }

    function injectHeader(html, containers, basePath) {
        containers.forEach((container) => {
            container.innerHTML = html;
            applyRootPaths(container, basePath);
        });
        initHeaderBehaviour();
    }

    async function loadHeader() {
        const containers = Array.from(document.querySelectorAll(HEADER_PLACEHOLDER));
        if (!containers.length) {
            return;
        }

        try {
            const response = await fetch(PARTIAL_URL, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const html = await response.text();
            injectHeader(html, containers, SITE_BASE);
        } catch (error) {
            console.warn('No se pudo cargar el header desde el parcial, se usará el fallback local.', error);
            injectHeader(FALLBACK_HTML, containers, SITE_BASE);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeader);
    } else {
        loadHeader();
    }
})();
