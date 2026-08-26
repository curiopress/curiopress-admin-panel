/* =====================================================
   CURIOPRESS SITEMAP MANAGER
   js/sitemap-manager.js
===================================================== */

(function () {

    "use strict";

    const STORAGE_KEY = "curiopress_sitemap_manager";

    let urls = [];


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function message(text, type = "success") {

        const old =
            document.getElementById("sitemapMessage");

        if (old) old.remove();

        const box =
            document.createElement("div");

        box.id = "sitemapMessage";

        box.textContent = text;

        box.style.cssText = `
            position:fixed;
            right:20px;
            bottom:80px;
            z-index:9999;
            max-width:370px;
            padding:14px 17px;
            border-radius:13px;
            background:${type === "error" ? "#2a1118" : "#10231f"};
            border:1px solid ${type === "error"
                ? "rgba(251,113,133,.3)"
                : "rgba(52,211,153,.25)"};
            color:${type === "error" ? "#fda4af" : "#a7f3d0"};
            font-size:12px;
            font-weight:700;
            box-shadow:0 15px 40px rgba(0,0,0,.4);
        `;

        document.body.appendChild(box);

        setTimeout(() => box.remove(), 3000);

    }


    function load() {

        try {

            const saved =
                localStorage.getItem(STORAGE_KEY);

            urls =
                saved
                    ? JSON.parse(saved)
                    : [];

            if (!Array.isArray(urls)) {
                urls = [];
            }

        } catch {

            urls = [];

        }

    }


    function save() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(urls)
        );

    }


    function validUrl(url) {

        try {

            const parsed = new URL(url);

            return (
                parsed.protocol === "http:" ||
                parsed.protocol === "https:"
            );

        } catch {

            return false;

        }

    }


    /* =====================================================
       ADD URL
    ===================================================== */

    function addUrl() {

        const url =
            prompt(
                "Enter the full page URL:"
            );

        if (url === null) return;

        const clean =
            url.trim();

        if (!validUrl(clean)) {

            message(
                "Enter a valid HTTP or HTTPS URL.",
                "error"
            );

            return;

        }

        if (
            urls.some(
                item => item.url === clean
            )
        ) {

            message(
                "This URL is already in the sitemap.",
                "error"
            );

            return;

        }

        urls.push({

            id:
                crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}_${Math.random()}`,

            url: clean,

            priority: "0.8",

            changefreq: "weekly",

            lastmod:
                new Date()
                    .toISOString()
                    .split("T")[0],

            status: "Included"

        });

        save();

        render();

        stats();

        message(
            "URL added to sitemap."
        );

    }


    /* =====================================================
       DELETE
    ===================================================== */

    function deleteUrl(id) {

        const item =
            urls.find(
                url => url.id === id
            );

        if (!item) return;

        if (
            !confirm(
                `Remove this URL from sitemap?\n\n${item.url}`
            )
        ) {

            return;

        }

        urls =
            urls.filter(
                url => url.id !== id
            );

        save();

        render();

        stats();

        message(
            "URL removed."
        );

    }


    /* =====================================================
       EDIT
    ===================================================== */

    function editUrl(id) {

        const item =
            urls.find(
                url => url.id === id
            );

        if (!item) return;


        const priority =
            prompt(
                "Priority 0.0 to 1.0:",
                item.priority
            );

        if (priority === null) return;


        const number =
            Number(priority);

        if (
            Number.isNaN(number) ||
            number < 0 ||
            number > 1
        ) {

            message(
                "Priority must be between 0.0 and 1.0.",
                "error"
            );

            return;

        }


        const changefreq =
            prompt(
                "Change frequency:",
                item.changefreq
            );

        if (changefreq === null) return;


        const lastmod =
            prompt(
                "Last modified date YYYY-MM-DD:",
                item.lastmod
            );

        if (lastmod === null) return;


        item.priority =
            number.toFixed(1);

        item.changefreq =
            changefreq.trim() || "weekly";

        item.lastmod =
            lastmod.trim() ||
            new Date()
                .toISOString()
                .split("T")[0];


        save();

        render();

        message(
            "Sitemap URL updated."
        );

    }


    /* =====================================================
       IMPORT URLS
    ===================================================== */

    function importUrls() {

        const input =
            prompt(
                "Paste one URL per line:"
            );

        if (input === null) return;


        const lines =
            input
                .split("\n")
                .map(
                    value => value.trim()
                )
                .filter(Boolean);


        let added = 0;


        lines.forEach(url => {

            if (
                !validUrl(url) ||
                urls.some(
                    item => item.url === url
                )
            ) {

                return;

            }


            urls.push({

                id:
                    crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}_${Math.random()}`,

                url,

                priority: "0.8",

                changefreq: "weekly",

                lastmod:
                    new Date()
                        .toISOString()
                        .split("T")[0],

                status: "Included"

            });


            added++;

        });


        save();

        render();

        stats();


        message(
            `${added} URL(s) imported.`
        );

    }


    /* =====================================================
       GENERATE XML
    ===================================================== */

    function generateXml() {

        if (!urls.length) {

            message(
                "Add at least one URL first.",
                "error"
            );

            return "";

        }


        const xmlUrls =
            urls
                .filter(
                    item =>
                        item.status === "Included"
                )
                .map(
                    item => `    <url>
        <loc>${escapeXml(item.url)}</loc>
        <lastmod>${escapeXml(item.lastmod)}</lastmod>
        <changefreq>${escapeXml(item.changefreq)}</changefreq>
        <priority>${escapeXml(item.priority)}</priority>
    </url>`
                )
                .join("\n");


        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${xmlUrls}
</urlset>`;

    }


    function escapeXml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

    }


    /* =====================================================
       DOWNLOAD SITEMAP
    ===================================================== */

    function downloadSitemap() {

        const xml =
            generateXml();

        if (!xml) return;


        const blob =
            new Blob(
                [xml],
                {
                    type:
                        "application/xml;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;

        link.download =
            "sitemap.xml";


        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);


        message(
            "sitemap.xml generated."
        );

    }


    /* =====================================================
       PREVIEW XML
    ===================================================== */

    function previewSitemap() {

        const xml =
            generateXml();

        if (!xml) return;


        const modal =
            document.createElement("div");


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:9998;
            background:rgba(0,0,0,.8);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        `;


        modal.innerHTML = `

            <div style="
                width:min(1000px,100%);
                height:min(80vh,800px);
                display:flex;
                flex-direction:column;
                background:#0d1522;
                border:1px solid rgba(255,255,255,.1);
                border-radius:18px;
                overflow:hidden;
            ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    padding:15px 18px;
                    border-bottom:1px solid rgba(255,255,255,.08);
                ">

                    <strong>
                        sitemap.xml Preview
                    </strong>

                    <button
                        class="mini-button"
                        id="closeSitemapPreview"
                    >
                        Close
                    </button>

                </div>


                <textarea
                    readonly
                    style="
                        flex:1;
                        width:100%;
                        resize:none;
                        border:0;
                        outline:0;
                        padding:20px;
                        background:#080e18;
                        color:#d9e3f0;
                        font-family:monospace;
                        font-size:12px;
                        line-height:1.6;
                    "
                ></textarea>

            </div>

        `;


        document.body.appendChild(modal);


        modal.querySelector("textarea")
            .value = xml;


        modal
            .querySelector(
                "#closeSitemapPreview"
            )
            .addEventListener(
                "click",
                () => modal.remove()
            );

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function search(query) {

        const clean =
            String(query || "")
                .toLowerCase()
                .trim();


        document
            .querySelectorAll(
                "[data-sitemap-row]"
            )
            .forEach(row => {

                row.style.display =
                    !clean ||
                    row.textContent
                        .toLowerCase()
                        .includes(clean)
                        ? ""
                        : "none";

            });

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function render() {

        const container =
            document.getElementById(
                "sitemapTable"
            );

        if (!container) return;


        if (!urls.length) {

            container.innerHTML = `

                <div style="
                    padding:40px;
                    text-align:center;
                    color:#8995a8;
                    font-size:13px;
                ">

                    No sitemap URLs yet.

                </div>

            `;

            return;

        }


        container.innerHTML =
            urls
                .map(
                    item => `

                        <div
                            data-sitemap-row
                            style="
                                display:grid;
                                grid-template-columns:
                                    minmax(240px,1.7fr)
                                    90px
                                    110px
                                    120px
                                    145px;
                                gap:12px;
                                align-items:center;
                                padding:14px 8px;
                                border-bottom:
                                    1px solid rgba(255,255,255,.05);
                            "
                        >

                            <div style="
                                min-width:0;
                            ">

                                <a
                                    href="${escapeHtml(item.url)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style="
                                        display:block;
                                        overflow:hidden;
                                        text-overflow:ellipsis;
                                        white-space:nowrap;
                                        color:#38bdf8;
                                        font-size:12px;
                                    "
                                >
                                    ${escapeHtml(item.url)}
                                </a>

                            </div>


                            <div>
                                <span style="
                                    color:#d5deea;
                                    font-size:11px;
                                ">
                                    ${escapeHtml(item.priority)}
                                </span>
                            </div>


                            <div>
                                <span style="
                                    color:#aeb9c9;
                                    font-size:11px;
                                ">
                                    ${escapeHtml(item.changefreq)}
                                </span>
                            </div>


                            <div>
                                <span style="
                                    color:#8995a8;
                                    font-size:11px;
                                ">
                                    ${escapeHtml(item.lastmod)}
                                </span>
                            </div>


                            <div style="
                                display:flex;
                                gap:6px;
                                justify-content:flex-end;
                            ">

                                <button
                                    class="mini-button"
                                    data-edit-sitemap="${escapeHtml(item.id)}"
                                >
                                    Edit
                                </button>

                                <button
                                    class="mini-button"
                                    data-delete-sitemap="${escapeHtml(item.id)}"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    `
                )
                .join("");


        container
            .querySelectorAll(
                "[data-edit-sitemap]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        editUrl(
                            button.dataset.editSitemap
                        )
                );

            });


        container
            .querySelectorAll(
                "[data-delete-sitemap]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        deleteUrl(
                            button.dataset.deleteSitemap
                        )
                );

            });

    }


    /* =====================================================
       STATS
    ===================================================== */

    function stats() {

        const total =
            document.getElementById(
                "sitemapTotal"
            );

        const included =
            document.getElementById(
                "sitemapIncluded"
            );


        const domains =
            document.getElementById(
                "sitemapDomains"
            );


        const today =
            document.getElementById(
                "sitemapToday"
            );


        if (total) {

            total.textContent =
                urls.length;

        }


        if (included) {

            included.textContent =
                urls.filter(
                    item =>
                        item.status === "Included"
                ).length;

        }


        if (domains) {

            domains.textContent =
                new Set(
                    urls.map(
                        item => {
                            try {
                                return new URL(
                                    item.url
                                ).hostname;
                            } catch {
                                return "";
                            }
                        }
                    )
                ).size;

        }


        if (today) {

            const date =
                new Date()
                    .toISOString()
                    .split("T")[0];


            today.textContent =
                urls.filter(
                    item =>
                        item.lastmod === date
                ).length;

        }

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "sitemapManagerPanel"
            )
        ) {

            return;

        }


        const content =
            document.querySelector(
                ".content"
            );


        if (!content) return;


        const panel =
            document.createElement("section");


        panel.id =
            "sitemapManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Sitemap Manager
                    </h2>

                    <span>
                        Manage and generate sitemap.xml
                    </span>

                </div>


                <div style="
                    display:flex;
                    gap:7px;
                    flex-wrap:wrap;
                    justify-content:flex-end;
                ">

                    <button
                        class="button"
                        id="sitemapImport"
                    >
                        Import URLs
                    </button>

                    <button
                        class="button"
                        id="sitemapPreview"
                    >
                        Preview
                    </button>

                    <button
                        class="button button-primary"
                        id="sitemapDownload"
                    >
                        Generate sitemap.xml
                    </button>

                </div>

            </div>


            <div style="
                display:grid;
                grid-template-columns:
                    repeat(4,minmax(0,1fr));
                gap:10px;
                margin-bottom:18px;
            ">

                <div class="stat-card">

                    <small>
                        Total URLs
                    </small>

                    <strong id="sitemapTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Included
                    </small>

                    <strong id="sitemapIncluded">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Domains
                    </small>

                    <strong id="sitemapDomains">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Modified Today
                    </small>

                    <strong id="sitemapToday">
                        0
                    </strong>

                </div>

            </div>


            <div style="
                display:flex;
                gap:10px;
                margin-bottom:15px;
            ">

                <input
                    id="sitemapSearch"
                    type="search"
                    placeholder="Search sitemap URLs..."
                    style="
                        flex:1;
                        height:43px;
                        padding:0 14px;
                        border:1px solid var(--border);
                        border-radius:12px;
                        outline:none;
                        background:#0c1320;
                        color:white;
                    "
                >


                <button
                    class="button"
                    id="sitemapAdd"
                >
                    Add URL
                </button>

            </div>


            <div style="
                overflow-x:auto;
            ">

                <div style="
                    min-width:760px;
                ">

                    <div style="
                        display:grid;
                        grid-template-columns:
                            minmax(240px,1.7fr)
                            90px
                            110px
                            120px
                            145px;
                        gap:12px;
                        padding:10px 8px;
                        color:#596579;
                        font-size:10px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.8px;
                    ">

                        <span>
                            URL
                        </span>

                        <span>
                            Priority
                        </span>

                        <span>
                            Frequency
                        </span>

                        <span>
                            Last Modified
                        </span>

                        <span>
                            Actions
                        </span>

                    </div>


                    <div
                        id="sitemapTable"
                    ></div>

                </div>

            </div>

        `;


        content.appendChild(panel);


        document
            .getElementById(
                "sitemapAdd"
            )
            .addEventListener(
                "click",
                addUrl
            );


        document
            .getElementById(
                "sitemapImport"
            )
            .addEventListener(
                "click",
                importUrls
            );


        document
            .getElementById(
                "sitemapPreview"
            )
            .addEventListener(
                "click",
                previewSitemap
            );


        document
            .getElementById(
                "sitemapDownload"
            )
            .addEventListener(
                "click",
                downloadSitemap
            );


        document
            .getElementById(
                "sitemapSearch"
            )
            .addEventListener(
                "input",
                event =>
                    search(
                        event.target.value
                    )
            );


        render();

        stats();

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                '.nav-item[data-page="sitemap"]'
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        setTimeout(
                            () => {

                                createPanel();

                                const panel =
                                    document.getElementById(
                                        "sitemapManagerPanel"
                                    );


                                if (panel) {

                                    panel.scrollIntoView({
                                        behavior:
                                            "smooth",
                                        block:
                                            "start"
                                    });

                                }

                            },
                            50
                        );

                    }
                );

            });

    }


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        load();

        createPanel();

        setupNavigation();

        render();

        stats();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.CurioPressSitemapManager = {

        add: addUrl,

        edit: editUrl,

        remove: deleteUrl,

        generate: generateXml,

        download: downloadSitemap,

        getUrls:
            () => [...urls]

    };

})();
