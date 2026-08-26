/* =====================================================
   CURIOPRESS ROBOTS.TXT MANAGER
   js/robots-manager.js
===================================================== */

(function () {

    "use strict";

    const STORAGE_KEY =
        "curiopress_robots_manager";

    const DEFAULT_ROBOTS = `User-agent: *
Allow: /

Sitemap: https://curiopress.github.io/sitemap.xml`;

    let robotsContent = "";


    /* =====================================================
       HELPERS
    ===================================================== */

    function showMessage(
        text,
        type = "success"
    ) {

        const old =
            document.getElementById(
                "robotsManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement("div");


        box.id =
            "robotsManagerMessage";


        box.textContent =
            text;


        box.style.cssText = `
            position:fixed;
            right:20px;
            bottom:80px;
            z-index:9999;
            max-width:380px;
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
            box-shadow:
                0 15px 40px rgba(0,0,0,.4);
        `;


        document.body.appendChild(box);


        setTimeout(
            () => box.remove(),
            3000
        );

    }


    function loadRobots() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            robotsContent =
                saved !== null
                    ? saved
                    : DEFAULT_ROBOTS;


        } catch {

            robotsContent =
                DEFAULT_ROBOTS;

        }

    }


    function saveRobots() {

        localStorage.setItem(
            STORAGE_KEY,
            robotsContent
        );

    }


    /* =====================================================
       VALIDATION
    ===================================================== */

    function validateRobots(content) {

        const lines =
            String(content || "")
                .split("\n");


        const warnings = [];


        const hasUserAgent =
            lines.some(
                line =>
                    /^\s*User-agent\s*:/i
                        .test(line)
            );


        if (!hasUserAgent) {

            warnings.push(
                "No User-agent directive found."
            );

        }


        const hasSitemap =
            lines.some(
                line =>
                    /^\s*Sitemap\s*:/i
                        .test(line)
            );


        if (!hasSitemap) {

            warnings.push(
                "No Sitemap directive found."
            );

        }


        const invalidLines =
            lines.filter(
                line => {

                    const clean =
                        line.trim();


                    if (!clean) return false;

                    if (clean.startsWith("#")) {
                        return false;
                    }


                    return (
                        !/^(User-agent|Disallow|Allow|Sitemap|Host|Crawl-delay)\s*:/i
                            .test(clean)
                    );

                }
            );


        if (invalidLines.length) {

            warnings.push(
                `${invalidLines.length} unrecognized directive(s) found.`
            );

        }


        return {

            valid:
                warnings.length === 0,

            warnings

        };

    }


    /* =====================================================
       SAVE
    ===================================================== */

    function saveChanges() {

        const editor =
            document.getElementById(
                "robotsEditor"
            );


        if (!editor) return;


        const content =
            editor.value;


        const result =
            validateRobots(
                content
            );


        if (
            !result.valid
        ) {

            const proceed =
                confirm(
                    "Robots.txt has warnings:\n\n" +
                    result.warnings.join("\n") +
                    "\n\nSave anyway?"
                );


            if (!proceed) {

                return;

            }

        }


        robotsContent =
            content;


        saveRobots();

        updateStatus();

        showMessage(
            "Robots.txt saved locally."
        );

    }


    /* =====================================================
       RESET
    ===================================================== */

    function resetRobots() {

        if (
            !confirm(
                "Reset Robots.txt to the default CurioPress configuration?"
            )
        ) {

            return;

        }


        robotsContent =
            DEFAULT_ROBOTS;


        saveRobots();


        const editor =
            document.getElementById(
                "robotsEditor"
            );


        if (editor) {

            editor.value =
                robotsContent;

        }


        updateStatus();


        showMessage(
            "Robots.txt reset."
        );

    }


    /* =====================================================
       DOWNLOAD
    ===================================================== */

    function downloadRobots() {

        const editor =
            document.getElementById(
                "robotsEditor"
            );


        const content =
            editor
                ? editor.value
                : robotsContent;


        const blob =
            new Blob(
                [content],
                {
                    type:
                        "text/plain;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement("a");


        link.href =
            url;


        link.download =
            "robots.txt";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        showMessage(
            "robots.txt generated."
        );

    }


    /* =====================================================
       PRESETS
    ===================================================== */

    function applyPreset(type) {

        const editor =
            document.getElementById(
                "robotsEditor"
            );


        if (!editor) return;


        if (
            type ===
            "allow-all"
        ) {

            editor.value =
`User-agent: *
Allow: /

Sitemap: https://curiopress.github.io/sitemap.xml`;

        }


        if (
            type ===
            "block-all"
        ) {

            editor.value =
`User-agent: *
Disallow: /`;

        }


        if (
            type ===
            "block-admin"
        ) {

            editor.value =
`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin-panel/

Sitemap: https://curiopress.github.io/sitemap.xml`;

        }


        updateStatus();


        showMessage(
            "Robots.txt preset applied."
        );

    }


    /* =====================================================
       VALIDATE
    ===================================================== */

    function runValidation() {

        const editor =
            document.getElementById(
                "robotsEditor"
            );


        if (!editor) return;


        const result =
            validateRobots(
                editor.value
            );


        const status =
            document.getElementById(
                "robotsValidation"
            );


        if (!status) return;


        if (result.valid) {

            status.innerHTML = `
                <span style="
                    color:#86efac;
                    font-weight:800;
                ">
                    ✓ Robots.txt looks valid
                </span>
            `;


            showMessage(
                "Robots.txt validation passed."
            );


        } else {

            status.innerHTML = `

                <div style="
                    color:#fcd34d;
                    font-weight:800;
                ">
                    ⚠ Review required
                </div>

                <div style="
                    margin-top:6px;
                    color:#8995a8;
                    line-height:1.6;
                ">
                    ${result.warnings
                        .map(
                            warning =>
                                `• ${escapeHtml(warning)}`
                        )
                        .join("<br>")}
                </div>

            `;


            showMessage(
                "Robots.txt contains warnings.",
                "error"
            );

        }

    }


    /* =====================================================
       STATUS
    ===================================================== */

    function updateStatus() {

        const editor =
            document.getElementById(
                "robotsEditor"
            );


        const status =
            document.getElementById(
                "robotsValidation"
            );


        if (
            !editor ||
            !status
        ) {

            return;

        }


        const result =
            validateRobots(
                editor.value
            );


        if (result.valid) {

            status.innerHTML = `
                <span style="
                    color:#86efac;
                    font-weight:800;
                ">
                    ✓ Valid structure
                </span>
            `;

        } else {

            status.innerHTML = `
                <span style="
                    color:#fcd34d;
                    font-weight:800;
                ">
                    ⚠ ${result.warnings.length} warning(s)
                </span>
            `;

        }

    }


    /* =====================================================
       ESCAPE HTML
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
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "robotsManagerPanel"
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
            document.createElement(
                "section"
            );


        panel.id =
            "robotsManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Robots.txt Manager
                    </h2>

                    <span>
                        Control search engine crawler access
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
                        id="robotsValidate"
                    >
                        Validate
                    </button>

                    <button
                        class="button"
                        id="robotsReset"
                    >
                        Reset
                    </button>

                    <button
                        class="button button-primary"
                        id="robotsDownload"
                    >
                        Download robots.txt
                    </button>

                </div>

            </div>


            <div style="
                display:grid;
                grid-template-columns:
                    repeat(3,minmax(0,1fr));
                gap:10px;
                margin-bottom:18px;
            ">

                <button
                    class="quick"
                    id="robotsAllowAll"
                    type="button"
                >

                    <div class="quick-icon">
                        ✓
                    </div>

                    <strong>
                        Allow All
                    </strong>

                    <span>
                        Allow normal crawling across the website.
                    </span>

                </button>


                <button
                    class="quick"
                    id="robotsBlockAdmin"
                    type="button"
                >

                    <div class="quick-icon">
                        #
                    </div>

                    <strong>
                        Protect Admin
                    </strong>

                    <span>
                        Block common admin paths from crawlers.
                    </span>

                </button>


                <button
                    class="quick"
                    id="robotsBlockAll"
                    type="button"
                >

                    <div class="quick-icon">
                        !
                    </div>

                    <strong>
                        Block All
                    </strong>

                    <span>
                        Block crawler access to the site.
                    </span>

                </button>

            </div>


            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:15px;
                margin-bottom:10px;
            ">

                <strong style="
                    font-size:13px;
                ">
                    robots.txt
                </strong>


                <div
                    id="robotsValidation"
                    style="
                        font-size:11px;
                    "
                ></div>

            </div>


            <textarea
                id="robotsEditor"
                spellcheck="false"
                style="
                    width:100%;
                    min-height:360px;
                    resize:vertical;
                    padding:18px;
                    border:1px solid var(--border);
                    border-radius:14px;
                    outline:none;
                    background:#080e18;
                    color:#d9e3f0;
                    font-family:
                        ui-monospace,
                        SFMono-Regular,
                        Menlo,
                        Consolas,
                        monospace;
                    font-size:13px;
                    line-height:1.7;
                "
            ></textarea>


            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
                margin-top:12px;
                flex-wrap:wrap;
            ">

                <span style="
                    color:#8995a8;
                    font-size:10px;
                ">
                    Changes are stored locally until connected
                    to the repository deployment workflow.
                </span>


                <button
                    class="button button-primary"
                    id="robotsSave"
                >
                    Save Changes
                </button>

            </div>

        `;


        content.appendChild(
            panel
        );


        const editor =
            document.getElementById(
                "robotsEditor"
            );


        editor.value =
            robotsContent;


        document
            .getElementById(
                "robotsSave"
            )
            .addEventListener(
                "click",
                saveChanges
            );


        document
            .getElementById(
                "robotsValidate"
            )
            .addEventListener(
                "click",
                runValidation
            );


        document
            .getElementById(
                "robotsReset"
            )
            .addEventListener(
                "click",
                resetRobots
            );


        document
            .getElementById(
                "robotsDownload"
            )
            .addEventListener(
                "click",
                downloadRobots
            );


        document
            .getElementById(
                "robotsAllowAll"
            )
            .addEventListener(
                "click",
                () =>
                    applyPreset(
                        "allow-all"
                    )
            );


        document
            .getElementById(
                "robotsBlockAdmin"
            )
            .addEventListener(
                "click",
                () =>
                    applyPreset(
                        "block-admin"
                    )
            );


        document
            .getElementById(
                "robotsBlockAll"
            )
            .addEventListener(
                "click",
                () =>
                    applyPreset(
                        "block-all"
                    )
            );


        editor.addEventListener(
            "input",
            updateStatus
        );


        updateStatus();

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                '.nav-item[data-page="robots"]'
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
                                        "robotsManagerPanel"
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

        loadRobots();

        createPanel();

        setupNavigation();

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

    window.CurioPressRobotsManager = {

        get:
            () => robotsContent,

        save:
            saveChanges,

        validate:
            validateRobots,

        download:
            downloadRobots,

        reset:
            resetRobots

    };

})();
