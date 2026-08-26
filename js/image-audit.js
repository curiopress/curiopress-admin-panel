/* =====================================================
   CURIOPRESS IMAGE / ALT AUDIT
   js/image-audit.js
===================================================== */

(function () {

    "use strict";


    let auditResults = [];


    const STORAGE_KEY =
        "curiopress_image_audit";


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


    function showMessage(
        message,
        type = "success"
    ) {

        const old =
            document.getElementById(
                "imageAuditMessage"
            );


        if (old) {

            old.remove();

        }


        const box =
            document.createElement("div");


        box.id =
            "imageAuditMessage";


        box.textContent =
            message;


        box.style.cssText = `
            position:fixed;
            right:20px;
            bottom:80px;
            z-index:9999;
            max-width:370px;
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

        }, 3200);

    }


    /* =====================================================
       LOAD SAVED RESULTS
    ===================================================== */

    function loadSavedResults() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            auditResults =
                saved
                    ? JSON.parse(saved)
                    : [];


            if (!Array.isArray(auditResults)) {

                auditResults = [];

            }

        } catch {

            auditResults = [];

        }

    }


    function saveResults() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(auditResults)
        );

    }


    /* =====================================================
       PARSE HTML
    ===================================================== */

    function auditHtml(
        filename,
        html
    ) {

        const parser =
            new DOMParser();


        const documentObject =
            parser.parseFromString(
                html,
                "text/html"
            );


        const images =
            Array.from(
                documentObject.querySelectorAll(
                    "img"
                )
            );


        return images.map(
            (image, index) => {

                const src =
                    image.getAttribute(
                        "src"
                    ) || "";


                const altAttribute =
                    image.getAttribute(
                        "alt"
                    );


                const alt =
                    altAttribute === null
                        ? ""
                        : altAttribute.trim();


                const width =
                    image.getAttribute(
                        "width"
                    ) || "";


                const height =
                    image.getAttribute(
                        "height"
                    ) || "";


                const loading =
                    image.getAttribute(
                        "loading"
                    ) || "";


                const title =
                    image.getAttribute(
                        "title"
                    ) || "";


                let status =
                    "Good";


                let issue =
                    "";


                if (!src) {

                    status =
                        "Error";

                    issue =
                        "Missing image source.";

                } else if (
                    altAttribute === null
                ) {

                    status =
                        "Error";

                    issue =
                        "Missing ALT attribute.";

                } else if (!alt) {

                    status =
                        "Warning";

                    issue =
                        "Empty ALT attribute.";

                } else if (
                    alt.length > 125
                ) {

                    status =
                        "Warning";

                    issue =
                        "ALT text is unusually long.";

                } else if (
                    !width ||
                    !height
                ) {

                    status =
                        "Warning";

                    issue =
                        "Width or height attribute is missing.";

                }


                return {

                    id:
                        `${Date.now()}_${index}_${Math.random()}`,

                    filename,

                    index:
                        index + 1,

                    src,

                    alt,

                    title,

                    width,

                    height,

                    loading,

                    status,

                    issue,

                    checkedAt:
                        new Date().toISOString()

                };

            }
        );

    }


    /* =====================================================
       AUDIT CURRENT FILE
    ===================================================== */

    async function auditFile(
        path
    ) {

        if (
            typeof window.apiRequest !==
            "function"
        ) {

            showMessage(
                "Admin API helper is not available.",
                "error"
            );

            return;

        }


        try {

            showMessage(
                "Reading HTML file..."
            );


            const data =
                await window.apiRequest(
                    `/api/file?path=${encodeURIComponent(path)}`
                );


            if (
                !data ||
                !data.file
            ) {

                throw new Error(
                    "File data was not returned by the Admin API."
                );

            }


            const filename =
                data.file.name ||
                path;


            const content =
                data.file.content ||
                "";


            const extension =
                filename
                    .split(".")
                    .pop()
                    .toLowerCase();


            if (
                extension !== "html" &&
                extension !== "htm"
            ) {

                showMessage(
                    "Image / ALT Audit currently supports HTML files.",
                    "error"
                );

                return;

            }


            const results =
                auditHtml(
                    filename,
                    content
                );


            auditResults =
                auditResults.filter(
                    item =>
                        item.filename !==
                        filename
                );


            auditResults =
                auditResults.concat(
                    results
                );


            saveResults();

            renderAudit();

            updateStats();


            showMessage(
                `${results.length} image(s) audited in ${filename}.`
            );

        } catch (error) {

            showMessage(
                error.message ||
                "Image audit failed.",
                "error"
            );

        }

    }


    /* =====================================================
       AUDIT RAW HTML
    ===================================================== */

    function auditRawHtml() {

        const filename =
            prompt(
                "HTML filename:",
                "index.html"
            );


        if (filename === null) {

            return;

        }


        const html =
            prompt(
                "Paste the HTML content to audit:"
            );


        if (html === null) {

            return;

        }


        const results =
            auditHtml(
                filename,
                html
            );


        auditResults =
            auditResults.filter(
                item =>
                    item.filename !==
                    filename
            );


        auditResults =
            auditResults.concat(
                results
            );


        saveResults();

        renderAudit();

        updateStats();


        showMessage(
            `${results.length} image(s) audited.`
        );

    }


    /* =====================================================
       CLEAR
    ===================================================== */

    function clearAudit() {

        if (!auditResults.length) {

            showMessage(
                "There are no audit results.",
                "error"
            );

            return;

        }


        if (
            !confirm(
                "Clear all Image / ALT Audit results?"
            )
        ) {

            return;

        }


        auditResults = [];

        saveResults();

        renderAudit();

        updateStats();


        showMessage(
            "Audit results cleared."
        );

    }


    /* =====================================================
       SEARCH / FILTER
    ===================================================== */

    function filterAudit(query) {

        const clean =
            String(query || "")
                .toLowerCase()
                .trim();


        document
            .querySelectorAll(
                "[data-image-audit-row]"
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


    function filterStatus(status) {

        document
            .querySelectorAll(
                "[data-image-audit-row]"
            )
            .forEach(row => {

                const rowStatus =
                    row.dataset.status;


                row.style.display =
                    status === "all" ||
                    rowStatus === status
                        ? ""
                        : "none";

            });

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderAudit() {

        const container =
            document.getElementById(
                "imageAuditTable"
            );


        if (!container) {

            return;

        }


        if (!auditResults.length) {

            container.innerHTML = `

                <div style="
                    padding:40px 15px;
                    text-align:center;
                    color:#8995a8;
                    font-size:13px;
                ">

                    No image audit results yet.

                    <div style="
                        margin-top:7px;
                        font-size:11px;
                    ">

                        Audit an HTML file to see
                        image ALT information here.

                    </div>

                </div>

            `;

            return;

        }


        container.innerHTML =
            auditResults
                .map(
                    item => {

                        const statusClass =
                            item.status === "Good"
                                ? "good"
                                : item.status === "Warning"
                                    ? "warning"
                                    : "error";


                        return `

                            <div
                                data-image-audit-row
                                data-status="${escapeHtml(item.status)}"
                                style="
                                    display:grid;
                                    grid-template-columns:
                                        minmax(140px,1fr)
                                        minmax(170px,1.2fr)
                                        minmax(180px,1.2fr)
                                        100px
                                        minmax(180px,1fr);
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
                                        font-size:12px;
                                    ">
                                        ${escapeHtml(item.filename)}
                                    </strong>

                                    <span style="
                                        display:block;
                                        margin-top:4px;
                                        color:#8995a8;
                                        font-size:10px;
                                    ">
                                        Image #${item.index}
                                    </span>

                                </div>


                                <div style="
                                    min-width:0;
                                ">

                                    <span style="
                                        display:block;
                                        overflow:hidden;
                                        text-overflow:ellipsis;
                                        white-space:nowrap;
                                        color:#38bdf8;
                                        font-size:11px;
                                    ">
                                        ${escapeHtml(item.src || "Missing")}
                                    </span>

                                </div>


                                <div style="
                                    min-width:0;
                                ">

                                    <span style="
                                        display:block;
                                        overflow:hidden;
                                        text-overflow:ellipsis;
                                        white-space:nowrap;
                                        color:#d5deea;
                                        font-size:11px;
                                    ">
                                        ${
                                            item.alt
                                                ? escapeHtml(item.alt)
                                                : "No ALT text"
                                        }
                                    </span>

                                </div>


                                <div>

                                    <span style="
                                        display:inline-flex;
                                        padding:6px 9px;
                                        border-radius:999px;
                                        background:${
                                            item.status === "Good"
                                                ? "rgba(52,211,153,.08)"
                                                : item.status === "Warning"
                                                    ? "rgba(251,191,36,.08)"
                                                    : "rgba(251,113,133,.08)"
                                        };
                                        border:1px solid ${
                                            item.status === "Good"
                                                ? "rgba(52,211,153,.15)"
                                                : item.status === "Warning"
                                                    ? "rgba(251,191,36,.15)"
                                                    : "rgba(251,113,133,.15)"
                                        };
                                        color:${
                                            item.status === "Good"
                                                ? "#86efac"
                                                : item.status === "Warning"
                                                    ? "#fcd34d"
                                                    : "#fda4af"
                                        };
                                        font-size:10px;
                                        font-weight:800;
                                    ">
                                        ${escapeHtml(item.status)}
                                    </span>

                                </div>


                                <div style="
                                    color:#8995a8;
                                    font-size:10px;
                                    line-height:1.5;
                                ">

                                    ${
                                        item.issue
                                            ? escapeHtml(item.issue)
                                            : `
                                                ${item.width || "?"}
                                                ×
                                                ${item.height || "?"}
                                                ${item.loading
                                                    ? ` · loading="${escapeHtml(item.loading)}"`
                                                    : ""
                                                }
                                            `
                                    }

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        const total =
            document.getElementById(
                "imageAuditTotal"
            );


        const good =
            document.getElementById(
                "imageAuditGood"
            );


        const warning =
            document.getElementById(
                "imageAuditWarning"
            );


        const error =
            document.getElementById(
                "imageAuditError"
            );


        if (total) {

            total.textContent =
                auditResults.length;

        }


        if (good) {

            good.textContent =
                auditResults.filter(
                    item =>
                        item.status === "Good"
                ).length;

        }


        if (warning) {

            warning.textContent =
                auditResults.filter(
                    item =>
                        item.status === "Warning"
                ).length;

        }


        if (error) {

            error.textContent =
                auditResults.filter(
                    item =>
                        item.status === "Error"
                ).length;

        }

    }


    /* =====================================================
       CREATE AUDIT PANEL
    ===================================================== */

    function createAuditPanel() {

        if (
            document.getElementById(
                "imageAuditPanel"
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
            "imageAuditPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Image / ALT Audit
                    </h2>

                    <span>
                        Check image ALT text, sources and dimensions
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
                        id="imageAuditRaw"
                    >
                        Audit HTML
                    </button>

                    <button
                        class="button"
                        id="imageAuditClear"
                    >
                        Clear
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
                        Total Images
                    </small>

                    <strong id="imageAuditTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Good
                    </small>

                    <strong
                        id="imageAuditGood"
                        class="good"
                    >
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Warnings
                    </small>

                    <strong
                        id="imageAuditWarning"
                        class="warning"
                    >
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Errors
                    </small>

                    <strong
                        id="imageAuditError"
                        class="error"
                    >
                        0
                    </strong>

                </div>

            </div>


            <div style="
                display:flex;
                gap:10px;
                margin-bottom:15px;
                flex-wrap:wrap;
            ">

                <input
                    id="imageAuditSearch"
                    type="search"
                    placeholder="Search images, files or ALT text..."
                    style="
                        flex:1;
                        min-width:220px;
                        height:43px;
                        padding:0 14px;
                        border:1px solid var(--border);
                        border-radius:12px;
                        outline:none;
                        background:#0c1320;
                        color:white;
                    "
                >


                <select
                    id="imageAuditStatus"
                    style="
                        height:43px;
                        padding:0 13px;
                        border:1px solid var(--border);
                        border-radius:12px;
                        outline:none;
                        background:#0c1320;
                        color:white;
                    "
                >

                    <option value="all">
                        All Status
                    </option>

                    <option value="Good">
                        Good
                    </option>

                    <option value="Warning">
                        Warning
                    </option>

                    <option value="Error">
                        Error
                    </option>

                </select>

            </div>


            <div style="
                overflow-x:auto;
            ">

                <div
                    id="imageAuditTable"
                    style="
                        min-width:850px;
                    "
                ></div>

            </div>

        `;


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "imageAuditRaw"
            )
            .addEventListener(
                "click",
                auditRawHtml
            );


        document
            .getElementById(
                "imageAuditClear"
            )
            .addEventListener(
                "click",
                clearAudit
            );


        document
            .getElementById(
                "imageAuditSearch"
            )
            .addEventListener(
                "input",
                event =>
                    filterAudit(
                        event.target.value
                    )
            );


        document
            .getElementById(
                "imageAuditStatus"
            )
            .addEventListener(
                "change",
                event =>
                    filterStatus(
                        event.target.value
                    )
            );


        renderAudit();

        updateStats();

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                '.nav-item[data-page="images"]'
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        setTimeout(
                            () => {

                                createAuditPanel();

                                const panel =
                                    document.getElementById(
                                        "imageAuditPanel"
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
       AUTO CONNECT WITH EXISTING ADMIN API
       ===================================================== */

    function connectApiHelper() {

        if (
            typeof apiRequest ===
            "function"
        ) {

            window.apiRequest =
                apiRequest;

        }

    }


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        loadSavedResults();

        connectApiHelper();

        createAuditPanel();

        setupNavigation();

        updateStats();

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

    window.CurioPressImageAudit = {

        auditFile,

        auditHtml,

        clear:
            clearAudit,

        getResults:
            () =>
                [...auditResults]

    };

})();
