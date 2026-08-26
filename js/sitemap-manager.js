/* =====================================================
   CURIOPRESS SITEMAP MANAGER
   js/sitemap-manager.js

   FEATURES
   -----------------------------------------------------
   - Automatic GitHub repository page discovery
   - Recursive HTML file scanning
   - Automatic URL generation
   - Category/article page detection
   - Duplicate protection
   - Manual URL support
   - Search
   - Edit
   - Delete
   - XML preview
   - XML download
   - Save sitemap.xml to GitHub
   - Automatic sitemap statistics
===================================================== */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const STORAGE_KEY =
        "curiopress_sitemap_manager";

    const API_URL =
        "https://curiopress-admin-api.curiopress31.workers.dev";

    const WEBSITE_ORIGIN =
        "https://curiopress.github.io";


    /*
        Paths that should NOT become sitemap URLs.
    */

    const EXCLUDED_PATHS = [

        "404.html",

        "404",

        "admin",

        "curiopress-admin-panel",

        "node_modules",

        ".git",

        ".github"

    ];


    /*
        File extensions that should never be treated
        as HTML pages.
    */

    const NON_HTML_EXTENSIONS = [

        ".css",
        ".js",
        ".json",
        ".xml",
        ".txt",
        ".md",
        ".svg",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".avif",
        ".ico",
        ".pdf",
        ".zip",
        ".rar",
        ".mp4",
        ".webm",
        ".mp3",
        ".wav",
        ".csv"

    ];


    let urls = [];

    let scanning = false;

    let currentSearch = "";


    /* =====================================================
       ELEMENT HELPERS
    ===================================================== */

    function getElement(id) {

        return document.getElementById(id);

    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       XML ESCAPE
    ===================================================== */

    function escapeXml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

    }


    /* =====================================================
       MESSAGE / TOAST
    ===================================================== */

    function message(
        text,
        type = "success"
    ) {

        const old =
            getElement(
                "sitemapMessage"
            );


        if (old) {

            old.remove();

        }


        const box =
            document.createElement(
                "div"
            );


        box.id =
            "sitemapMessage";


        box.textContent =
            text;


        const isError =
            type === "error";


        box.style.cssText = `
            position:fixed;
            right:20px;
            bottom:80px;
            z-index:99999;
            width:max-content;
            max-width:min(430px,calc(100vw - 40px));
            padding:14px 17px;
            border-radius:13px;
            background:${isError ? "#2a1118" : "#10231f"};
            border:1px solid ${
                isError
                    ? "rgba(251,113,133,.3)"
                    : "rgba(52,211,153,.25)"
            };
            color:${isError ? "#fda4af" : "#a7f3d0"};
            font-size:12px;
            font-weight:700;
            line-height:1.5;
            box-shadow:0 15px 40px rgba(0,0,0,.4);
        `;


        document.body.appendChild(
            box
        );


        setTimeout(
            () => {

                if (box.isConnected) {

                    box.remove();

                }

            },
            3500
        );

    }


    /* =====================================================
       LOCAL STORAGE
    ===================================================== */

    function load() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            urls =
                saved
                    ? JSON.parse(saved)
                    : [];


            if (!Array.isArray(urls)) {

                urls = [];

            }


            /*
                Old versions did not have source metadata.

                Treat those URLs as manual entries so they
                are not unexpectedly deleted during scanning.
            */

            urls =
                urls.map(
                    item => {

                        if (!item.source) {

                            return {
                                ...item,
                                source: "manual"
                            };

                        }

                        return item;

                    }
                );

        } catch {

            urls = [];

        }

    }


    function save() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(urls)
            );

        } catch {

            message(
                "Could not save sitemap data in browser storage.",
                "error"
            );

        }

    }


    /* =====================================================
       ID GENERATOR
    ===================================================== */

    function createId() {

        try {

            if (
                crypto &&
                typeof crypto.randomUUID ===
                    "function"
            ) {

                return crypto.randomUUID();

            }

        } catch {

            /* fallback */

        }


        return (
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2)
        );

    }


    /* =====================================================
       DATE
    ===================================================== */

    function today() {

        return new Date()
            .toISOString()
            .split("T")[0];

    }


    /* =====================================================
       URL VALIDATION
    ===================================================== */

    function validUrl(url) {

        try {

            const parsed =
                new URL(url);


            return (
                parsed.protocol === "http:" ||
                parsed.protocol === "https:"
            );

        } catch {

            return false;

        }

    }


    /* =====================================================
       NORMALIZE URL
    ===================================================== */

    function normalizeUrl(url) {

        try {

            const parsed =
                new URL(
                    url,
                    WEBSITE_ORIGIN
                );


            /*
                Remove query/hash because sitemap URLs
                should represent canonical pages.
            */

            parsed.search = "";

            parsed.hash = "";


            let pathname =
                parsed.pathname;


            /*
                Normalize multiple slashes.
            */

            pathname =
                pathname.replace(
                    /\/+/g,
                    "/"
                );


            /*
                Convert /index.html to /
            */

            if (
                pathname ===
                "/index.html"
            ) {

                pathname = "/";

            }


            /*
                Convert /folder/index.html
                to /folder/
            */

            pathname =
                pathname.replace(
                    /\/index\.html$/i,
                    "/"
                );


            /*
                Remove trailing slash from non-root
                .html paths only when appropriate.
            */

            if (
                pathname.length > 1 &&
                pathname.endsWith("/")
            ) {

                pathname =
                    pathname.slice(
                        0,
                        -1
                    );

            }


            return (
                parsed.origin +
                pathname
            );

        } catch {

            return String(url || "")
                .trim();

        }

    }


    /* =====================================================
       REPOSITORY PATH TO PUBLIC URL
    ===================================================== */

    function repositoryPathToUrl(
        path
    ) {

        let clean =
            String(path || "")
                .trim()
                .replace(/^\/+/, "");


        if (!clean) {

            return WEBSITE_ORIGIN + "/";

        }


        /*
            Ignore non HTML files.
        */

        const lower =
            clean.toLowerCase();


        if (
            !lower.endsWith(".html") &&
            !lower.endsWith(".htm")
        ) {

            return null;

        }


        /*
            Remove index.html from root.
        */

        if (
            lower === "index.html"
        ) {

            return WEBSITE_ORIGIN + "/";

        }


        /*
            Remove /index.html from folders.
        */

        if (
            lower.endsWith(
                "/index.html"
            )
        ) {

            clean =
                clean.slice(
                    0,
                    -"index.html".length
                );

        }


        /*
            Convert:
            folder/page.html
            into:
            /folder/page.html
        */

        return normalizeUrl(
            WEBSITE_ORIGIN +
            "/" +
            clean
        );

    }


    /* =====================================================
       EXCLUSION CHECK
    ===================================================== */

    function isExcludedPath(
        path
    ) {

        const clean =
            String(path || "")
                .toLowerCase()
                .replace(/^\/+/, "");


        const parts =
            clean.split("/");


        for (
            const excluded
            of EXCLUDED_PATHS
        ) {

            const value =
                excluded.toLowerCase();


            if (
                clean === value ||
                clean.startsWith(
                    value + "/"
                ) ||
                parts.includes(value)
            ) {

                return true;

            }

        }


        return false;

    }


    /* =====================================================
       HTML PAGE CHECK
    ===================================================== */

    function isHtmlPage(
        item
    ) {

        if (!item) {

            return false;

        }


        if (
            item.type === "dir" ||
            item.type === "tree" ||
            item.type === "folder"
        ) {

            return false;

        }


        const name =
            String(
                item.name ||
                item.path ||
                ""
            )
            .toLowerCase();


        if (
            !name.endsWith(".html") &&
            !name.endsWith(".htm")
        ) {

            return false;

        }


        for (
            const extension
            of NON_HTML_EXTENSIONS
        ) {

            if (
                name.endsWith(
                    extension
                )
            ) {

                return false;

            }

        }


        return true;

    }


    /* =====================================================
       PRIORITY
    ===================================================== */

    function calculatePriority(
        path,
        url
    ) {

        const clean =
            String(path || "")
                .toLowerCase()
                .replace(/^\/+/, "");


        /*
            Homepage
        */

        if (
            clean === "index.html" ||
            url === WEBSITE_ORIGIN ||
            url === WEBSITE_ORIGIN + "/"
        ) {

            return "1.0";

        }


        /*
            Category pages
        */

        if (
            clean.includes("category/") ||
            clean.includes("categories/")
        ) {

            return "0.8";

        }


        /*
            Article / blog pages
        */

        if (
            clean.includes("article/") ||
            clean.includes("articles/") ||
            clean.includes("blog/") ||
            clean.includes("blogs/") ||
            clean.includes("post/") ||
            clean.includes("posts/")
        ) {

            return "0.7";

        }


        /*
            About / contact / important pages
        */

        if (
            clean.includes("about") ||
            clean.includes("contact") ||
            clean.includes("privacy") ||
            clean.includes("terms")
        ) {

            return "0.6";

        }


        /*
            Other indexable pages
        */

        return "0.6";

    }


    /* =====================================================
       CHANGE FREQUENCY
    ===================================================== */

    function calculateFrequency(
        path,
        priority
    ) {

        const clean =
            String(path || "")
                .toLowerCase();


        if (
            priority === "1.0"
        ) {

            return "weekly";

        }


        if (
            clean.includes("blog/") ||
            clean.includes("article/") ||
            clean.includes("articles/") ||
            clean.includes("post/") ||
            clean.includes("posts/")
        ) {

            return "weekly";

        }


        return "monthly";

    }


    /* =====================================================
       API AUTH
    ===================================================== */

    function getAdminKey() {

        return sessionStorage.getItem(
            "curiopress_admin_key"
        );

    }


    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const key =
            getAdminKey();


        if (!key) {

            throw new Error(
                "Admin session is missing. Please login again."
            );

        }


        const headers = {

            "Authorization":
                `Bearer ${key}`,

            "Accept":
                "application/json",

            "Content-Type":
                "application/json",

            ...(options.headers || {})

        };


        let response;


        try {

            response =
                await fetch(
                    `${API_URL}${endpoint}`,
                    {
                        ...options,

                        headers,

                        cache:
                            "no-store"
                    }
                );

        } catch {

            throw new Error(
                "Unable to connect to Admin API."
            );

        }


        const text =
            await response.text();


        let data;


        try {

            data =
                text
                    ? JSON.parse(text)
                    : {};

        } catch {

            data = {

                error:
                    text ||
                    `HTTP ${response.status}`

            };

        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                `HTTP ${response.status}`
            );

        }


        return data;

    }


    /* =====================================================
       GET REPOSITORY FILES
    ===================================================== */

    async function getRepositoryFiles(
        path = ""
    ) {

        const data =
            await apiRequest(
                `/api/files?path=${encodeURIComponent(path)}`
            );


        return Array.isArray(
            data.files
        )
            ? data.files
            : [];

    }


    /* =====================================================
       RECURSIVE REPOSITORY SCANNER
    ===================================================== */

    async function scanDirectory(
        path = "",
        results = [],
        visited = new Set()
    ) {

        /*
            Safety against accidental recursion.
        */

        if (
            visited.has(path)
        ) {

            return results;

        }


        visited.add(path);


        const files =
            await getRepositoryFiles(
                path
            );


        for (
            const item
            of files
        ) {

            const itemPath =
                item.path ||
                (
                    path
                        ? `${path}/${item.name}`
                        : item.name
                );


            if (
                !itemPath
            ) {

                continue;

            }


            if (
                isExcludedPath(
                    itemPath
                )
            ) {

                continue;

            }


            if (
                item.type === "dir" ||
                item.type === "tree" ||
                item.type === "folder"
            ) {

                await scanDirectory(
                    itemPath,
                    results,
                    visited
                );


                continue;

            }


            if (
                isHtmlPage(
                    {
                        ...item,
                        path: itemPath
                    }
                )
            ) {

                results.push({

                    name:
                        item.name ||
                        itemPath
                            .split("/")
                            .pop(),

                    path:
                        itemPath,

                    size:
                        item.size ||
                        0

                });

            }

        }


        return results;

    }


    /* =====================================================
       DISCOVER URLS
    ===================================================== */

    async function discoverRepositoryUrls() {

        if (scanning) {

            return;

        }


        scanning = true;


        const button =
            getElement(
                "sitemapScan"
            );


        const oldText =
            button
                ? button.textContent
                : "";


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Scanning Repository...";

        }


        try {

            message(
                "Scanning CurioPress repository for HTML pages..."
            );


            const files =
                await scanDirectory();


            if (!files.length) {

                throw new Error(
                    "No HTML pages were found in the repository."
                );

            }


            const discovered =
                [];


            const seen =
                new Set();


            files.forEach(
                file => {

                    const url =
                        repositoryPathToUrl(
                            file.path
                        );


                    if (!url) {

                        return;

                    }


                    const normalized =
                        normalizeUrl(
                            url
                        );


                    if (
                        !validUrl(
                            normalized
                        )
                    ) {

                        return;

                    }


                    if (
                        seen.has(
                            normalized
                        )
                    ) {

                        return;

                    }


                    seen.add(
                        normalized
                    );


                    const priority =
                        calculatePriority(
                            file.path,
                            normalized
                        );


                    const frequency =
                        calculateFrequency(
                            file.path,
                            priority
                        );


                    discovered.push({

                        id:
                            createId(),

                        url:
                            normalized,

                        priority,

                        changefreq:
                            frequency,

                        lastmod:
                            today(),

                        status:
                            "Included",

                        source:
                            "auto",

                        repositoryPath:
                            file.path

                    });

                }
            );


            /*
                Preserve manually added URLs.
                Replace all automatically discovered URLs
                with the newest repository scan.
            */

            const manualUrls =
                urls.filter(
                    item =>
                        item.source !==
                        "auto"
                );


            const manualSeen =
                new Set(
                    manualUrls.map(
                        item =>
                            normalizeUrl(
                                item.url
                            )
                    )
                );


            /*
                If a manually added URL is also discovered
                automatically, automatic discovery wins so
                repository information stays current.
            */

            const filteredManual =
                manualUrls.filter(
                    item =>
                        !discovered.some(
                            discoveredItem =>
                                normalizeUrl(
                                    discoveredItem.url
                                ) ===
                                normalizeUrl(
                                    item.url
                                )
                        )
                );


            urls =
                [
                    ...filteredManual,
                    ...discovered
                ];


            /*
                Final duplicate protection.
            */

            const unique =
                new Map();


            urls.forEach(
                item => {

                    const key =
                        normalizeUrl(
                            item.url
                        );


                    if (
                        !unique.has(key)
                    ) {

                        unique.set(
                            key,
                            item
                        );

                    }

                }
            );


            urls =
                Array.from(
                    unique.values()
                );


            save();

            render();

            stats();


            message(
                `Repository scan complete. ${discovered.length} HTML page(s) discovered.`
            );


        } catch (error) {

            message(
                `Repository scan failed: ${error.message}`,
                "error"
            );

        } finally {

            scanning =
                false;


            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    oldText ||
                    "Scan Repository";

            }

        }

    }


    /* =====================================================
       ADD MANUAL URL
    ===================================================== */

    function addUrl() {

        const url =
            prompt(
                "Enter the full page URL:"
            );


        if (
            url === null
        ) {

            return;

        }


        const clean =
            normalizeUrl(
                url.trim()
            );


        if (
            !validUrl(
                clean
            )
        ) {

            message(
                "Enter a valid HTTP or HTTPS URL.",
                "error"
            );

            return;

        }


        if (
            urls.some(
                item =>
                    normalizeUrl(
                        item.url
                    ) === clean
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
                createId(),

            url:
                clean,

            priority:
                "0.8",

            changefreq:
                "weekly",

            lastmod:
                today(),

            status:
                "Included",

            source:
                "manual"

        });


        save();

        render();

        stats();


        message(
            "URL added to sitemap."
        );

    }


    /* =====================================================
       DELETE URL
    ===================================================== */

    function deleteUrl(
        id
    ) {

        const item =
            urls.find(
                url =>
                    url.id === id
            );


        if (!item) {

            return;

        }


        if (
            !confirm(
                `Remove this URL from sitemap?\n\n${item.url}`
            )
        ) {

            return;

        }


        urls =
            urls.filter(
                url =>
                    url.id !== id
            );


        save();

        render();

        stats();


        message(
            "URL removed."
        );

    }


    /* =====================================================
       EDIT URL
    ===================================================== */

    function editUrl(
        id
    ) {

        const item =
            urls.find(
                url =>
                    url.id === id
            );


        if (!item) {

            return;

        }


        const priority =
            prompt(
                "Priority 0.0 to 1.0:",
                item.priority
            );


        if (
            priority === null
        ) {

            return;

        }


        const number =
            Number(
                priority
            );


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


        if (
            changefreq === null
        ) {

            return;

        }


        const lastmod =
            prompt(
                "Last modified date YYYY-MM-DD:",
                item.lastmod
            );


        if (
            lastmod === null
        ) {

            return;

        }


        item.priority =
            number.toFixed(1);


        item.changefreq =
            changefreq.trim() ||
            "weekly";


        item.lastmod =
            lastmod.trim() ||
            today();


        save();

        render();

        stats();


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


        if (
            input === null
        ) {

            return;

        }


        const lines =
            input
                .split("\n")
                .map(
                    value =>
                        value.trim()
                )
                .filter(Boolean);


        let added =
            0;


        lines.forEach(
            rawUrl => {

                const url =
                    normalizeUrl(
                        rawUrl
                    );


                if (
                    !validUrl(
                        url
                    )
                ) {

                    return;

                }


                if (
                    urls.some(
                        item =>
                            normalizeUrl(
                                item.url
                            ) === url
                    )
                ) {

                    return;

                }


                urls.push({

                    id:
                        createId(),

                    url,

                    priority:
                        "0.8",

                    changefreq:
                        "weekly",

                    lastmod:
                        today(),

                    status:
                        "Included",

                    source:
                        "manual"

                });


                added++;

            }
        );


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

        const included =
            urls.filter(
                item =>
                    item.status !==
                    "Excluded"
            );


        if (
            !included.length
        ) {

            message(
                "No included URLs are available.",
                "error"
            );

            return "";

        }


        const xmlUrls =
            included
                .map(
                    item => `    <url>
        <loc>${escapeXml(normalizeUrl(item.url))}</loc>
        <lastmod>${escapeXml(item.lastmod || today())}</lastmod>
        <changefreq>${escapeXml(item.changefreq || "monthly")}</changefreq>
        <priority>${escapeXml(item.priority || "0.6")}</priority>
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


    /* =====================================================
       DOWNLOAD SITEMAP
    ===================================================== */

    function downloadSitemap() {

        const xml =
            generateXml();


        if (!xml) {

            return;

        }


        const blob =
            new Blob(
                [xml],
                {
                    type:
                        "application/xml;charset=utf-8"
                }
            );


        const objectUrl =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            objectUrl;


        link.download =
            "sitemap.xml";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            objectUrl
        );


        message(
            "sitemap.xml generated and downloaded."
        );

    }


    /* =====================================================
       COPY XML
    ===================================================== */

    async function copyXml() {

        const xml =
            generateXml();


        if (!xml) {

            return;

        }


        try {

            await navigator.clipboard.writeText(
                xml
            );


            message(
                "Sitemap XML copied to clipboard."
            );

        } catch {

            message(
                "Could not copy XML. Use Preview and copy it manually.",
                "error"
            );

        }

    }


    /* =====================================================
       PREVIEW XML
    ===================================================== */

    function previewSitemap() {

        const xml =
            generateXml();


        if (!xml) {

            return;

        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "sitemapPreviewModal";


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:99998;
            background:rgba(0,0,0,.82);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        `;


        modal.innerHTML = `

            <div style="
                width:min(1100px,100%);
                height:min(85vh,850px);
                display:flex;
                flex-direction:column;
                background:#0d1522;
                border:1px solid rgba(255,255,255,.1);
                border-radius:20px;
                overflow:hidden;
                box-shadow:0 30px 100px rgba(0,0,0,.6);
            ">


                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:12px;
                    padding:15px 18px;
                    border-bottom:1px solid rgba(255,255,255,.08);
                ">

                    <div>

                        <strong>
                            sitemap.xml Preview
                        </strong>

                        <div style="
                            margin-top:4px;
                            color:#8995a8;
                            font-size:11px;
                        ">
                            ${urls.length} URL(s)
                        </div>

                    </div>


                    <div style="
                        display:flex;
                        gap:7px;
                        flex-wrap:wrap;
                        justify-content:flex-end;
                    ">

                        <button
                            class="mini-button"
                            id="copySitemapXml"
                        >
                            Copy XML
                        </button>

                        <button
                            class="mini-button"
                            id="closeSitemapPreview"
                        >
                            Close
                        </button>

                    </div>

                </div>


                <textarea
                    id="sitemapPreviewText"
                    readonly
                    spellcheck="false"
                    style="
                        flex:1;
                        width:100%;
                        resize:none;
                        border:0;
                        outline:0;
                        padding:20px;
                        background:#080e18;
                        color:#d9e3f0;
                        font-family:
                            ui-monospace,
                            SFMono-Regular,
                            Menlo,
                            Consolas,
                            monospace;
                        font-size:12px;
                        line-height:1.7;
                    "
                ></textarea>


            </div>

        `;


        document.body.appendChild(
            modal
        );


        const textarea =
            modal.querySelector(
                "#sitemapPreviewText"
            );


        textarea.value =
            xml;


        modal
            .querySelector(
                "#closeSitemapPreview"
            )
            .addEventListener(
                "click",
                () =>
                    modal.remove()
            );


        modal
            .querySelector(
                "#copySitemapXml"
            )
            .addEventListener(
                "click",
                async () => {

                    try {

                        await navigator.clipboard.writeText(
                            xml
                        );


                        message(
                            "XML copied."
                        );

                    } catch {

                        message(
                            "Copy failed.",
                            "error"
                        );

                    }

                }
            );

    }


    /* =====================================================
       GET SITEMAP FILE
       ===================================================== */

    async function getSitemapFile() {

        return await apiRequest(
            "/api/file?path=sitemap.xml"
        );

    }


    /* =====================================================
       SAVE SITEMAP TO GITHUB
    ===================================================== */

    async function saveSitemap() {

        const xml =
            generateXml();


        if (!xml) {

            return;

        }


        const button =
            getElement(
                "sitemapSave"
            );


        const oldText =
            button
                ? button.textContent
                : "";


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Saving...";

        }


        try {

            message(
                "Reading current sitemap.xml..."
            );


            let sha =
                null;


            try {

                const existing =
                    await getSitemapFile();


                if (
                    existing &&
                    existing.file
                ) {

                    sha =
                        existing.file.sha ||
                        null;

                }

            } catch (error) {

                /*
                    404 means sitemap.xml does not exist yet.
                    Any other error should be shown.
                */

                if (
                    !String(
                        error.message
                    ).includes("404")
                ) {

                    throw error;

                }

            }


            message(
                "Saving sitemap.xml to GitHub..."
            );


            const data =
                await apiRequest(
                    "/api/file",
                    {
                        method:
                            "PUT",

                        body:
                            JSON.stringify({

                                path:
                                    "sitemap.xml",

                                content:
                                    xml,

                                sha:
                                    sha,

                                message:
                                    "Update sitemap.xml"

                            })

                    }
                );


            if (
                data.success
            ) {

                message(
                    "sitemap.xml saved to GitHub successfully."
                );


                addRecentChange(
                    "Sitemap updated",
                    `${urls.length} URL(s) written to sitemap.xml`
                );

            } else {

                throw new Error(
                    data.error ||
                    "GitHub did not confirm the sitemap update."
                );

            }

        } catch (error) {

            message(
                `Could not save sitemap.xml: ${error.message}`,
                "error"
            );

        } finally {

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    oldText ||
                    "Save Sitemap";

            }

        }

    }


    /* =====================================================
       RECENT CHANGE
    ===================================================== */

    function addRecentChange(
        title,
        description
    ) {

        const container =
            getElement(
                "recentChanges"
            );


        if (!container) {

            return;

        }


        const change =
            document.createElement(
                "div"
            );


        change.className =
            "change";


        change.innerHTML = `

            <div class="change-icon">
                ✓
            </div>

            <div>

                <strong>
                    ${escapeHtml(title)}
                </strong>

                <span>
                    ${escapeHtml(description)}
                </span>

            </div>

        `;


        container.prepend(
            change
        );

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function search(
        query
    ) {

        currentSearch =
            String(
                query || ""
            )
            .toLowerCase()
            .trim();


        document
            .querySelectorAll(
                "[data-sitemap-row]"
            )
            .forEach(
                row => {

                    row.style.display =
                        !currentSearch ||
                        row.textContent
                            .toLowerCase()
                            .includes(
                                currentSearch
                            )
                            ? ""
                            : "none";

                }
            );

    }


    /* =====================================================
       SELECT ALL
    ===================================================== */

    function selectAll() {

        document
            .querySelectorAll(
                "[data-sitemap-checkbox]"
            )
            .forEach(
                checkbox => {

                    checkbox.checked =
                        true;

                }
            );

    }


    /* =====================================================
       DELETE SELECTED
    ===================================================== */

    function deleteSelected() {

        const selected =
            Array.from(
                document.querySelectorAll(
                    "[data-sitemap-checkbox]:checked"
                )
            )
            .map(
                checkbox =>
                    checkbox.dataset
                        .sitemapCheckbox
            );


        if (!selected.length) {

            message(
                "Select at least one URL first.",
                "error"
            );

            return;

        }


        if (
            !confirm(
                `Remove ${selected.length} selected URL(s) from the sitemap?`
            )
        ) {

            return;

        }


        urls =
            urls.filter(
                item =>
                    !selected.includes(
                        item.id
                    )
            );


        save();

        render();

        stats();


        message(
            `${selected.length} URL(s) removed.`
        );

    }


    /* =====================================================
       SORT
    ===================================================== */

    let sortAscending =
        true;


    function sortUrls() {

        urls.sort(
            (a, b) => {

                const first =
                    a.url.toLowerCase();


                const second =
                    b.url.toLowerCase();


                return sortAscending
                    ? first.localeCompare(
                        second
                    )
                    : second.localeCompare(
                        first
                    );

            }
        );


        sortAscending =
            !sortAscending;


        save();

        render();


        message(
            "Sitemap URLs sorted."
        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function render() {

        const container =
            getElement(
                "sitemapTable"
            );


        if (!container) {

            return;

        }


        if (!urls.length) {

            container.innerHTML = `

                <div style="
                    padding:40px;
                    text-align:center;
                    color:#8995a8;
                    font-size:13px;
                ">

                    No sitemap URLs yet.

                    <div style="
                        margin-top:8px;
                        font-size:11px;
                    ">
                        Use Scan Repository to discover
                        your website pages automatically.
                    </div>

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
                                    42px
                                    minmax(260px,1.7fr)
                                    80px
                                    105px
                                    115px
                                    180px;
                                gap:10px;
                                align-items:center;
                                padding:13px 8px;
                                border-bottom:
                                    1px solid rgba(255,255,255,.05);
                            "
                        >


                            <div>

                                <input
                                    type="checkbox"
                                    data-sitemap-checkbox="${escapeHtml(item.id)}"
                                >

                            </div>


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


                                <div style="
                                    margin-top:4px;
                                    color:#596579;
                                    font-size:9px;
                                ">

                                    ${
                                        item.source === "auto"
                                            ? "AUTO DISCOVERED"
                                            : "MANUAL"

                                    }

                                    ${
                                        item.repositoryPath
                                            ? ` • ${escapeHtml(item.repositoryPath)}`
                                            : ""
                                    }

                                </div>

                            </div>


                            <div>

                                <span style="
                                    display:inline-flex;
                                    align-items:center;
                                    justify-content:center;
                                    min-width:40px;
                                    padding:5px 7px;
                                    border-radius:8px;
                                    background:rgba(94,234,212,.08);
                                    color:#5eead4;
                                    font-size:10px;
                                    font-weight:800;
                                ">
                                    ${escapeHtml(item.priority)}
                                </span>

                            </div>


                            <div>

                                <span style="
                                    display:inline-flex;
                                    padding:5px 7px;
                                    border-radius:8px;
                                    background:rgba(56,189,248,.08);
                                    color:#7dd3fc;
                                    font-size:10px;
                                    font-weight:700;
                                ">
                                    ${escapeHtml(item.changefreq)}
                                </span>

                            </div>


                            <div>

                                <span style="
                                    color:#8995a8;
                                    font-size:10px;
                                ">
                                    ${escapeHtml(item.lastmod)}
                                </span>

                            </div>


                            <div style="
                                display:flex;
                                gap:6px;
                                justify-content:flex-end;
                                flex-wrap:wrap;
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
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () =>
                            editUrl(
                                button.dataset
                                    .editSitemap
                            )
                    );

                }
            );


        container
            .querySelectorAll(
                "[data-delete-sitemap]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () =>
                            deleteUrl(
                                button.dataset
                                    .deleteSitemap
                            )
                    );

                }
            );


        search(
            currentSearch
        );

    }


    /* =====================================================
       STATISTICS
    ===================================================== */

    function stats() {

        const total =
            getElement(
                "sitemapTotal"
            );


        const included =
            getElement(
                "sitemapIncluded"
            );


        const domains =
            getElement(
                "sitemapDomains"
            );


        const todayElement =
            getElement(
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
                        item.status !==
                        "Excluded"
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


        if (todayElement) {

            const date =
                today();


            todayElement.textContent =
                urls.filter(
                    item =>
                        item.lastmod ===
                        date
                ).length;

        }


        const pageCount =
            getElement(
                "sitemapPageCount"
            );


        if (pageCount) {

            pageCount.textContent =
                urls.length;

        }

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            getElement(
                "sitemapManagerPanel"
            )
        ) {

            return;

        }


        const content =
            document.querySelector(
                ".content"
            );


        if (!content) {

            return;

        }


        const panel =
            document.createElement(
                "section"
            );


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
                        Automatically discover, manage and generate sitemap.xml
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
                        id="sitemapScan"
                    >
                        Scan Repository
                    </button>


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
                        Preview XML
                    </button>


                    <button
                        class="button"
                        id="sitemapCopy"
                    >
                        Copy XML
                    </button>


                    <button
                        class="button"
                        id="sitemapDownload"
                    >
                        Download XML
                    </button>


                    <button
                        class="button button-primary"
                        id="sitemapSave"
                    >
                        Save Sitemap
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
                padding:15px;
                margin-bottom:15px;
                border-radius:14px;
                background:rgba(94,234,212,.05);
                border:1px solid rgba(94,234,212,.12);
            ">


                <div style="
                    display:flex;
                    align-items:flex-start;
                    gap:12px;
                ">


                    <div style="
                        width:36px;
                        height:36px;
                        flex:0 0 auto;
                        display:grid;
                        place-items:center;
                        border-radius:10px;
                        background:rgba(94,234,212,.1);
                        color:#5eead4;
                        font-weight:900;
                    ">
                        ↻
                    </div>


                    <div>

                        <strong style="
                            display:block;
                            font-size:13px;
                        ">
                            Automatic Page Discovery
                        </strong>


                        <span style="
                            display:block;
                            margin-top:4px;
                            color:#8995a8;
                            font-size:11px;
                            line-height:1.6;
                        ">
                            Scan the CurioPress GitHub repository to automatically
                            find homepage, categories, articles and other HTML pages.
                        </span>

                    </div>


                </div>


            </div>


            <div style="
                display:flex;
                gap:9px;
                flex-wrap:wrap;
                margin-bottom:15px;
            ">


                <button
                    class="button"
                    id="sitemapSelectAll"
                >
                    Select All
                </button>


                <button
                    class="button"
                    id="sitemapDeleteSelected"
                    style="
                        color:#fda4af;
                    "
                >
                    Delete Selected
                </button>


                <button
                    class="button"
                    id="sitemapSort"
                >
                    Sort
                </button>


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
                    min-width:900px;
                ">


                    <div style="
                        display:grid;
                        grid-template-columns:
                            42px
                            minmax(260px,1.7fr)
                            80px
                            105px
                            115px
                            180px;
                        gap:10px;
                        padding:10px 8px;
                        color:#596579;
                        font-size:10px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.8px;
                    ">

                        <span>
                            Select
                        </span>

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


            <div style="
                margin-top:20px;
                padding:16px;
                border-radius:14px;
                background:#0b1320;
                border:1px solid rgba(255,255,255,.06);
            ">


                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:10px;
                    flex-wrap:wrap;
                ">


                    <div>

                        <strong style="
                            font-size:13px;
                        ">
                            Sitemap File
                        </strong>


                        <span style="
                            display:block;
                            margin-top:4px;
                            color:#8995a8;
                            font-size:11px;
                        ">
                            sitemap.xml
                        </span>

                    </div>


                    <a
                        href="${WEBSITE_ORIGIN}/sitemap.xml"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="button"
                    >
                        Open Live Sitemap
                    </a>


                </div>


            </div>


        `;


        content.appendChild(
            panel
        );


        getElement(
            "sitemapAdd"
        )
        .addEventListener(
            "click",
            addUrl
        );


        getElement(
            "sitemapImport"
        )
        .addEventListener(
            "click",
            importUrls
        );


        getElement(
            "sitemapScan"
        )
        .addEventListener(
            "click",
            discoverRepositoryUrls
        );


        getElement(
            "sitemapPreview"
        )
        .addEventListener(
            "click",
            previewSitemap
        );


        getElement(
            "sitemapCopy"
        )
        .addEventListener(
            "click",
            copyXml
        );


        getElement(
            "sitemapDownload"
        )
        .addEventListener(
            "click",
            downloadSitemap
        );


        getElement(
            "sitemapSave"
        )
        .addEventListener(
            "click",
            saveSitemap
        );


        getElement(
            "sitemapSearch"
        )
        .addEventListener(
            "input",
            event =>
                search(
                    event.target.value
                )
        );


        getElement(
            "sitemapSelectAll"
        )
        .addEventListener(
            "click",
            selectAll
        );


        getElement(
            "sitemapDeleteSelected"
        )
        .addEventListener(
            "click",
            deleteSelected
        );


        getElement(
            "sitemapSort"
        )
        .addEventListener(
            "click",
            sortUrls
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
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            setTimeout(
                                () => {

                                    createPanel();


                                    const panel =
                                        getElement(
                                            "sitemapManagerPanel"
                                        );


                                    if (
                                        panel
                                    ) {

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

                }
            );

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

        add:
            addUrl,

        edit:
            editUrl,

        remove:
            deleteUrl,

        scan:
            discoverRepositoryUrls,

        generate:
            generateXml,

        download:
            downloadSitemap,

        save:
            saveSitemap,

        getUrls:
            () => [...urls]

    };


})();
