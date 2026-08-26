/* =====================================================
   CURIOPRESS KEYWORD MANAGER
   js/keyword-manager.js
===================================================== */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API_URL =
        "https://curiopress-admin-api.curiopress31.workers.dev";


    const STORAGE_KEY =
        "curiopress_keyword_manager";


    let keywords = [];


    /* =====================================================
       HELPERS
    ===================================================== */

    function getAdminKey() {

        return sessionStorage.getItem(
            "curiopress_admin_key"
        );

    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function loadLocalKeywords() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );

            keywords =
                saved
                    ? JSON.parse(saved)
                    : [];

            if (!Array.isArray(keywords)) {

                keywords = [];

            }

        } catch {

            keywords = [];

        }

    }


    function saveLocalKeywords() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(keywords)
        );

    }


    function showMessage(
        message,
        type = "success"
    ) {

        const existing =
            document.getElementById(
                "keywordManagerMessage"
            );

        if (existing) {

            existing.remove();

        }


        const box =
            document.createElement("div");


        box.id =
            "keywordManagerMessage";


        box.textContent =
            message;


        box.style.cssText = `
            position:fixed;
            right:20px;
            bottom:80px;
            z-index:9999;
            max-width:360px;
            padding:14px 17px;
            border-radius:13px;
            background:${type === "error"
                ? "#2a1118"
                : "#10231f"};
            border:1px solid ${type === "error"
                ? "rgba(251,113,133,.3)"
                : "rgba(52,211,153,.25)"};
            color:${type === "error"
                ? "#fda4af"
                : "#a7f3d0"};
            font-size:12px;
            font-weight:700;
            box-shadow:0 15px 40px rgba(0,0,0,.4);
        `;


        document.body.appendChild(box);


        setTimeout(() => {

            box.remove();

        }, 3000);

    }


    /* =====================================================
       KEYWORD NORMALIZATION
    ===================================================== */

    function normalizeKeyword(value) {

        return String(value || "")
            .trim()
            .replace(/\s+/g, " ");

    }


    function keywordExists(keyword) {

        const normalized =
            keyword.toLowerCase();

        return keywords.some(
            item =>
                item.keyword.toLowerCase() ===
                normalized
        );

    }


    /* =====================================================
       ADD KEYWORD
    ===================================================== */

    function addKeyword(
        keyword,
        page = "",
        notes = ""
    ) {

        keyword =
            normalizeKeyword(keyword);

        page =
            String(page || "").trim();

        notes =
            String(notes || "").trim();


        if (!keyword) {

            showMessage(
                "Enter a keyword first.",
                "error"
            );

            return false;

        }


        if (keywordExists(keyword)) {

            showMessage(
                "This keyword already exists.",
                "error"
            );

            return false;

        }


        keywords.unshift({

            id:
                crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}_${Math.random()}`,

            keyword,

            page,

            notes,

            status:
                "Tracking",

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        });


        saveLocalKeywords();

        renderKeywordTable();

        updateKeywordStats();


        showMessage(
            "Keyword added successfully."
        );


        return true;

    }


    /* =====================================================
       DELETE KEYWORD
    ===================================================== */

    function deleteKeyword(id) {

        const item =
            keywords.find(
                keyword =>
                    keyword.id === id
            );


        if (!item) {

            return;

        }


        const confirmed =
            confirm(
                `Delete keyword "${item.keyword}"?`
            );


        if (!confirmed) {

            return;

        }


        keywords =
            keywords.filter(
                keyword =>
                    keyword.id !== id
            );


        saveLocalKeywords();

        renderKeywordTable();

        updateKeywordStats();


        showMessage(
            "Keyword deleted."
        );

    }


    /* =====================================================
       EDIT KEYWORD
    ===================================================== */

    function editKeyword(id) {

        const item =
            keywords.find(
                keyword =>
                    keyword.id === id
            );


        if (!item) {

            return;

        }


        const keyword =
            prompt(
                "Keyword:",
                item.keyword
            );


        if (keyword === null) {

            return;

        }


        const cleanKeyword =
            normalizeKeyword(keyword);


        if (!cleanKeyword) {

            showMessage(
                "Keyword cannot be empty.",
                "error"
            );

            return;

        }


        const duplicate =
            keywords.some(
                other =>
                    other.id !== id &&
                    other.keyword.toLowerCase() ===
                    cleanKeyword.toLowerCase()
            );


        if (duplicate) {

            showMessage(
                "That keyword already exists.",
                "error"
            );

            return;

        }


        const page =
            prompt(
                "Target page or URL:",
                item.page || ""
            );


        if (page === null) {

            return;

        }


        const notes =
            prompt(
                "Notes:",
                item.notes || ""
            );


        if (notes === null) {

            return;

        }


        item.keyword =
            cleanKeyword;

        item.page =
            page.trim();

        item.notes =
            notes.trim();

        item.updatedAt =
            new Date().toISOString();


        saveLocalKeywords();

        renderKeywordTable();

        updateKeywordStats();


        showMessage(
            "Keyword updated."
        );

    }


    /* =====================================================
       IMPORT KEYWORDS
    ===================================================== */

    function importKeywords() {

        const input =
            prompt(
                "Enter keywords separated by commas or new lines:"
            );


        if (input === null) {

            return;

        }


        const list =
            input
                .split(/[\n,]+/)
                .map(
                    item =>
                        normalizeKeyword(item)
                )
                .filter(Boolean);


        if (!list.length) {

            showMessage(
                "No keywords found.",
                "error"
            );

            return;

        }


        let added =
            0;


        list.forEach(keyword => {

            if (
                !keywordExists(keyword)
            ) {

                keywords.unshift({

                    id:
                        crypto.randomUUID
                        ? crypto.randomUUID()
                        : `${Date.now()}_${Math.random()}`,

                    keyword,

                    page: "",

                    notes: "",

                    status:
                        "Tracking",

                    createdAt:
                        new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString()

                });


                added++;

            }

        });


        saveLocalKeywords();

        renderKeywordTable();

        updateKeywordStats();


        showMessage(
            `${added} keyword(s) imported.`
        );

    }


    /* =====================================================
       EXPORT KEYWORDS
    ===================================================== */

    function exportKeywords() {

        if (!keywords.length) {

            showMessage(
                "There are no keywords to export.",
                "error"
            );

            return;

        }


        const rows = [

            [
                "Keyword",
                "Target Page",
                "Status",
                "Notes",
                "Created"
            ],

            ...keywords.map(item => [

                item.keyword,

                item.page,

                item.status,

                item.notes,

                item.createdAt

            ])

        ];


        const csv =
            rows
                .map(row =>
                    row
                        .map(value =>
                            `"${String(value ?? "")
                                .replace(/"/g, '""')}"`
                        )
                        .join(",")
                )
                .join("\n");


        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href =
            url;


        link.download =
            "curiopress-keywords.csv";


        document.body.appendChild(link);

        link.click();

        link.remove();


        URL.revokeObjectURL(url);


        showMessage(
            "Keyword CSV exported."
        );

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function filterKeywords(query) {

        const table =
            document.getElementById(
                "keywordTable"
            );


        if (!table) {

            return;

        }


        const clean =
            String(query || "")
                .toLowerCase()
                .trim();


        table
            .querySelectorAll(
                "[data-keyword-row]"
            )
            .forEach(row => {

                const text =
                    row.textContent
                        .toLowerCase();


                row.style.display =
                    !clean ||
                    text.includes(clean)
                        ? ""
                        : "none";

            });

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderKeywordTable() {

        const table =
            document.getElementById(
                "keywordTable"
            );


        if (!table) {

            return;

        }


        if (!keywords.length) {

            table.innerHTML = `

                <div style="
                    padding:35px 15px;
                    text-align:center;
                    color:#8995a8;
                    font-size:13px;
                ">

                    No keywords added yet.

                </div>

            `;

            return;

        }


        table.innerHTML = keywords.map(
            item => `

                <div
                    data-keyword-row
                    style="
                        display:grid;
                        grid-template-columns:
                            minmax(180px,1.4fr)
                            minmax(150px,1fr)
                            100px
                            120px;
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

                        <strong style="
                            display:block;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                            font-size:13px;
                        ">
                            ${escapeHtml(item.keyword)}
                        </strong>

                        ${
                            item.notes
                                ? `
                                    <span style="
                                        display:block;
                                        margin-top:4px;
                                        color:#8995a8;
                                        font-size:10px;
                                    ">
                                        ${escapeHtml(item.notes)}
                                    </span>
                                `
                                : ""
                        }

                    </div>


                    <div style="
                        overflow:hidden;
                        text-overflow:ellipsis;
                        white-space:nowrap;
                        color:#aeb9c9;
                        font-size:11px;
                    ">

                        ${
                            item.page
                                ? escapeHtml(item.page)
                                : "No target page"
                        }

                    </div>


                    <div>

                        <span style="
                            display:inline-flex;
                            padding:6px 9px;
                            border-radius:999px;
                            background:rgba(52,211,153,.08);
                            border:1px solid rgba(52,211,153,.15);
                            color:#86efac;
                            font-size:10px;
                            font-weight:800;
                        ">
                            ${escapeHtml(item.status)}
                        </span>

                    </div>


                    <div style="
                        display:flex;
                        gap:6px;
                        justify-content:flex-end;
                    ">

                        <button
                            class="mini-button"
                            data-keyword-edit="${escapeHtml(item.id)}"
                        >
                            Edit
                        </button>

                        <button
                            class="mini-button"
                            data-keyword-delete="${escapeHtml(item.id)}"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `
        ).join("");


        table
            .querySelectorAll(
                "[data-keyword-edit]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        editKeyword(
                            button.dataset.keywordEdit
                        )
                );

            });


        table
            .querySelectorAll(
                "[data-keyword-delete]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        deleteKeyword(
                            button.dataset.keywordDelete
                        )
                );

            });

    }


    /* =====================================================
       STATISTICS
    ===================================================== */

    function updateKeywordStats() {

        const total =
            document.getElementById(
                "keywordTotal"
            );


        const tracking =
            document.getElementById(
                "keywordTracking"
            );


        const pages =
            document.getElementById(
                "keywordPages"
            );


        const updated =
            document.getElementById(
                "keywordUpdated"
            );


        if (total) {

            total.textContent =
                keywords.length;

        }


        if (tracking) {

            tracking.textContent =
                keywords.filter(
                    item =>
                        item.status ===
                        "Tracking"
                ).length;

        }


        if (pages) {

            pages.textContent =
                new Set(
                    keywords
                        .map(
                            item =>
                                item.page
                        )
                        .filter(Boolean)
                ).size;

        }


        if (updated) {

            updated.textContent =
                keywords.length
                    ? "Ready"
                    : "—";

        }

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createKeywordManager() {

        if (
            document.getElementById(
                "keywordManagerPanel"
            )
        ) {

            return;

        }


        const panel =
            document.createElement("section");


        panel.id =
            "keywordManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Keyword Manager
                    </h2>

                    <span>
                        Manage target keywords for CurioPress
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
                        id="keywordImport"
                    >
                        Import
                    </button>

                    <button
                        class="button"
                        id="keywordExport"
                    >
                        Export
                    </button>

                    <button
                        class="button button-primary"
                        id="keywordAdd"
                    >
                        Add Keyword
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
                        Total Keywords
                    </small>

                    <strong id="keywordTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Tracking
                    </small>

                    <strong id="keywordTracking">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Target Pages
                    </small>

                    <strong id="keywordPages">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Status
                    </small>

                    <strong id="keywordUpdated">
                        —
                    </strong>

                </div>

            </div>


            <div style="
                display:flex;
                gap:10px;
                margin-bottom:15px;
            ">

                <input
                    id="keywordSearch"
                    type="search"
                    placeholder="Search keywords..."
                    style="
                        flex:1;
                        min-width:0;
                        height:43px;
                        padding:0 14px;
                        border:1px solid var(--border);
                        border-radius:12px;
                        outline:none;
                        background:#0c1320;
                        color:white;
                    "
                >

            </div>


            <div style="
                overflow-x:auto;
            ">

                <div
                    id="keywordTable"
                    style="
                        min-width:650px;
                    "
                ></div>

            </div>

        `;


        const content =
            document.querySelector(
                ".content"
            );


        if (!content) {

            return;

        }


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "keywordAdd"
            )
            .addEventListener(
                "click",
                () => {

                    const keyword =
                        prompt(
                            "Keyword:"
                        );


                    if (keyword === null) {

                        return;

                    }


                    const page =
                        prompt(
                            "Target page or URL:"
                        );


                    if (page === null) {

                        return;

                    }


                    const notes =
                        prompt(
                            "Notes (optional):"
                        );


                    if (notes === null) {

                        return;

                    }


                    addKeyword(
                        keyword,
                        page,
                        notes
                    );

                }
            );


        document
            .getElementById(
                "keywordImport"
            )
            .addEventListener(
                "click",
                importKeywords
            );


        document
            .getElementById(
                "keywordExport"
            )
            .addEventListener(
                "click",
                exportKeywords
            );


        document
            .getElementById(
                "keywordSearch"
            )
            .addEventListener(
                "input",
                event =>
                    filterKeywords(
                        event.target.value
                    )
            );


        renderKeywordTable();

        updateKeywordStats();

    }


    /* =====================================================
       NAVIGATION INTEGRATION
    ===================================================== */

    function activateKeywordManager() {

        createKeywordManager();


        const panel =
            document.getElementById(
                "keywordManagerPanel"
            );


        if (panel) {

            panel.scrollIntoView({
                behavior:
                    "smooth",
                block:
                    "start"
            });

        }

    }


    function setupNavigation() {

        document
            .querySelectorAll(
                '.nav-item[data-page="keywords"]'
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        setTimeout(
                            activateKeywordManager,
                            50
                        );

                    }
                );

            });

    }


    /* =====================================================
       OPTIONAL API SYNC
    ===================================================== */

    async function syncKeywordsWithAPI() {

        const key =
            getAdminKey();


        if (!key) {

            return {
                success:
                    false,
                reason:
                    "No admin session"
            };

        }


        try {

            const response =
                await fetch(
                    `${API_URL}/api/keywords`,
                    {
                        method:
                            "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${key}`,

                            "Accept":
                                "application/json"
                        },

                        cache:
                            "no-store"
                    }
                );


            if (!response.ok) {

                return {
                    success:
                        false,
                    reason:
                        `HTTP ${response.status}`
                };

            }


            const data =
                await response.json();


            if (
                Array.isArray(
                    data.keywords
                )
            ) {

                keywords =
                    data.keywords.map(
                        item => ({
                            id:
                                item.id ||
                                `${Date.now()}_${Math.random()}`,

                            keyword:
                                item.keyword ||
                                "",

                            page:
                                item.page ||
                                item.url ||
                                "",

                            notes:
                                item.notes ||
                                "",

                            status:
                                item.status ||
                                "Tracking",

                            createdAt:
                                item.createdAt ||
                                new Date().toISOString(),

                            updatedAt:
                                item.updatedAt ||
                                new Date().toISOString()

                        })
                    );


                saveLocalKeywords();

                renderKeywordTable();

                updateKeywordStats();

            }


            return {
                success:
                    true
            };

        } catch {

            return {
                success:
                    false,
                reason:
                    "API unavailable"
            };

        }

    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initKeywordManager() {

        loadLocalKeywords();

        setupNavigation();

        createKeywordManager();

        /*
            API sync is intentionally non-blocking.
            Local keyword manager continues working even
            when the Worker does not yet expose /api/keywords.
        */

        syncKeywordsWithAPI();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initKeywordManager
        );

    } else {

        initKeywordManager();

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.CurioPressKeywordManager = {

        add:
            addKeyword,

        delete:
            deleteKeyword,

        edit:
            editKeyword,

        import:
            importKeywords,

        export:
            exportKeywords,

        refresh:
            syncKeywordsWithAPI,

        getKeywords:
            () =>
                [...keywords]

    };

})();
