/* =====================================================
   CURIOPRESS GOOGLE SEARCH CONSOLE MANAGER
   js/gsc-manager.js
===================================================== */

(function () {

    "use strict";

    const STORAGE_KEY =
        "curiopress_gsc_settings";

    const DEFAULT_SETTINGS = {
        property: "",
        connected: false,
        lastSync: null
    };

    let settings = {
        ...DEFAULT_SETTINGS
    };


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


    function notify(
        text,
        type = "success"
    ) {

        const old =
            document.getElementById(
                "gscManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement(
                "div"
            );


        box.id =
            "gscManagerMessage";


        box.textContent =
            text;


        box.style.cssText = `
            position:fixed;
            right:20px;
            bottom:80px;
            z-index:99999;
            max-width:390px;
            padding:14px 17px;
            border-radius:13px;
            background:${type === "error"
                ? "#2a1118"
                : "#10231f"};
            border:1px solid:${type === "error"
                ? "rgba(251,113,133,.3)"
                : "rgba(52,211,153,.25)"};
            color:${type === "error"
                ? "#fda4af"
                : "#a7f3d0"};
            font-size:12px;
            font-weight:700;
            box-shadow:
                0 15px 40px rgba(0,0,0,.45);
        `;


        document.body.appendChild(
            box
        );


        setTimeout(
            () => {

                if (box.parentNode) {
                    box.remove();
                }

            },
            3000
        );

    }


    /* =====================================================
       STORAGE
    ===================================================== */

    function loadSettings() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (saved) {

                const parsed =
                    JSON.parse(saved);


                if (
                    parsed &&
                    typeof parsed === "object"
                ) {

                    settings = {
                        ...DEFAULT_SETTINGS,
                        ...parsed
                    };

                }

            }

        } catch {

            settings = {
                ...DEFAULT_SETTINGS
            };

        }

    }


    function saveSettings() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    settings
                )
            );

            return true;

        } catch {

            notify(
                "Unable to save Search Console settings.",
                "error"
            );

            return false;

        }

    }


    /* =====================================================
       CONNECTION STATE
    ===================================================== */

    function setProperty() {

        const input =
            document.getElementById(
                "gscPropertyInput"
            );


        if (!input) return;


        const property =
            input.value.trim();


        if (!property) {

            notify(
                "Enter a Search Console property first.",
                "error"
            );

            return;

        }


        settings.property =
            property;

        settings.connected =
            false;

        settings.lastSync =
            null;


        saveSettings();

        render();


        notify(
            "Property saved. Real API connection is still required."
        );

    }


    function disconnect() {

        if (
            !confirm(
                "Remove the saved Search Console property?"
            )
        ) {

            return;

        }


        settings = {
            ...DEFAULT_SETTINGS
        };


        saveSettings();

        render();


        notify(
            "Search Console property removed."
        );

    }


    /* =====================================================
       API STATUS
    ===================================================== */

    function showApiStatus() {

        notify(
            "Google Search Console API is not connected yet.",
            "error"
        );

    }


    /* =====================================================
       URL INSPECTION
    ===================================================== */

    function inspectUrl() {

        const input =
            document.getElementById(
                "gscInspectUrl"
            );


        if (!input) return;


        const url =
            input.value.trim();


        if (!url) {

            notify(
                "Enter a URL to inspect.",
                "error"
            );

            return;

        }


        try {

            const parsed =
                new URL(url);


            if (
                parsed.protocol !==
                    "http:" &&
                parsed.protocol !==
                    "https:"
            ) {

                throw new Error();

            }

        } catch {

            notify(
                "Enter a valid HTTP or HTTPS URL.",
                "error"
            );

            return;

        }


        /*
            Real URL Inspection requires
            Google Search Console API
            authentication.

            We deliberately do not
            display fake indexing data.
        */

        showInspectionResult(
            url
        );

    }


    function showInspectionResult(
        url
    ) {

        const result =
            document.getElementById(
                "gscInspectionResult"
            );


        if (!result) return;


        result.innerHTML = `

            <div style="
                padding:18px;
                border-radius:14px;
                background:rgba(251,191,36,.06);
                border:1px solid rgba(251,191,36,.16);
            ">

                <strong style="
                    display:block;
                    color:#fbbf24;
                    font-size:12px;
                ">
                    API Connection Required
                </strong>


                <span style="
                    display:block;
                    margin-top:7px;
                    color:#aeb9c9;
                    font-size:11px;
                    line-height:1.6;
                ">
                    URL inspection is ready in the Admin Panel,
                    but live Google indexing information will
                    appear only after Google Search Console API
                    authentication is connected.
                </span>


                <span style="
                    display:block;
                    margin-top:10px;
                    overflow:hidden;
                    text-overflow:ellipsis;
                    white-space:nowrap;
                    color:#38bdf8;
                    font-size:10px;
                ">
                    ${escapeHtml(url)}
                </span>

            </div>

        `;

    }


    /* =====================================================
       REFRESH
    ===================================================== */

    function refreshData() {

        if (!settings.property) {

            notify(
                "Save a Search Console property first.",
                "error"
            );

            return;

        }


        notify(
            "Live data refresh requires the Search Console API connection.",
            "error"
        );

    }


    /* =====================================================
       SITEMAP
    ===================================================== */

    function openSitemapStatus() {

        if (!settings.property) {

            notify(
                "Set a Search Console property first.",
                "error"
            );

            return;

        }


        notify(
            "Sitemap data will be loaded after API authentication."
        );

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "gscManagerPanel"
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
            "gscManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Google Search Console
                    </h2>

                    <span>
                        Search performance, indexing and URL inspection
                    </span>

                </div>


                <div style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                ">

                    <span
                        id="gscConnectionBadge"
                        style="
                            display:inline-flex;
                            align-items:center;
                            padding:7px 10px;
                            border-radius:999px;
                            font-size:10px;
                            font-weight:900;
                        "
                    >
                        Not Connected
                    </span>

                </div>

            </div>


            <!-- PROPERTY -->

            <div style="
                padding:18px;
                margin-bottom:20px;
                border:1px solid var(--border);
                border-radius:16px;
                background:#0d1522;
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;
                    flex-wrap:wrap;
                    margin-bottom:13px;
                ">

                    <div>

                        <strong style="
                            display:block;
                            font-size:13px;
                        ">
                            Search Console Property
                        </strong>

                        <span style="
                            display:block;
                            margin-top:4px;
                            color:#8995a8;
                            font-size:10px;
                        ">
                            Enter the verified property you want to manage.
                        </span>

                    </div>

                </div>


                <div style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                ">

                    <input
                        id="gscPropertyInput"
                        type="text"
                        placeholder="https://example.com/ or sc-domain:example.com"
                        style="
                            flex:1;
                            min-width:220px;
                            height:43px;
                            padding:0 13px;
                            border:1px solid var(--border);
                            border-radius:11px;
                            outline:none;
                            background:#080e18;
                            color:white;
                        "
                    >


                    <button
                        class="button button-primary"
                        id="gscSaveProperty"
                    >
                        Save Property
                    </button>


                    <button
                        class="button"
                        id="gscDisconnect"
                    >
                        Remove
                    </button>

                </div>

            </div>


            <!-- STATS -->

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(4,minmax(0,1fr));
                gap:10px;
                margin-bottom:20px;
            ">


                <div class="stat-card">

                    <small>
                        Clicks
                    </small>

                    <strong>
                        —
                    </strong>

                    <span style="
                        display:block;
                        margin-top:4px;
                        color:#596579;
                        font-size:9px;
                    ">
                        API required
                    </span>

                </div>


                <div class="stat-card">

                    <small>
                        Impressions
                    </small>

                    <strong>
                        —
                    </strong>

                    <span style="
                        display:block;
                        margin-top:4px;
                        color:#596579;
                        font-size:9px;
                    ">
                        API required
                    </span>

                </div>


                <div class="stat-card">

                    <small>
                        Average CTR
                    </small>

                    <strong>
                        —
                    </strong>

                    <span style="
                        display:block;
                        margin-top:4px;
                        color:#596579;
                        font-size:9px;
                    ">
                        API required
                    </span>

                </div>


                <div class="stat-card">

                    <small>
                        Average Position
                    </small>

                    <strong>
                        —
                    </strong>

                    <span style="
                        display:block;
                        margin-top:4px;
                        color:#596579;
                        font-size:9px;
                    ">
                        API required
                    </span>

                </div>


            </div>


            <!-- PERFORMANCE -->

            <div style="
                display:grid;
                grid-template-columns:
                    1.5fr 1fr;
                gap:20px;
                margin-bottom:20px;
            ">


                <div style="
                    padding:20px;
                    border:1px solid var(--border);
                    border-radius:16px;
                    background:#0d1522;
                ">

                    <div style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:10px;
                        margin-bottom:18px;
                    ">

                        <div>

                            <h3 style="
                                margin:0;
                                font-size:15px;
                            ">
                                Search Performance
                            </h3>

                            <span style="
                                display:block;
                                margin-top:4px;
                                color:#8995a8;
                                font-size:10px;
                            ">
                                Google Search traffic overview
                            </span>

                        </div>


                        <button
                            class="button"
                            id="gscRefresh"
                        >
                            Refresh
                        </button>

                    </div>


                    <div style="
                        min-height:180px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        text-align:center;
                        border:1px dashed rgba(255,255,255,.08);
                        border-radius:13px;
                        color:#8995a8;
                        font-size:11px;
                        line-height:1.6;
                        padding:25px;
                    ">

                        Live Search Console performance
                        data will appear here after
                        Google API authentication.

                    </div>

                </div>


                <!-- TOP QUERIES -->

                <div style="
                    padding:20px;
                    border:1px solid var(--border);
                    border-radius:16px;
                    background:#0d1522;
                ">

                    <h3 style="
                        margin:0;
                        font-size:15px;
                    ">
                        Top Queries
                    </h3>

                    <span style="
                        display:block;
                        margin-top:4px;
                        color:#8995a8;
                        font-size:10px;
                    ">
                        Search keywords from Google
                    </span>


                    <div style="
                        margin-top:18px;
                        padding:30px 15px;
                        text-align:center;
                        border:1px dashed rgba(255,255,255,.08);
                        border-radius:13px;
                        color:#8995a8;
                        font-size:11px;
                    ">

                        No live query data yet.

                    </div>

                </div>


            </div>


            <!-- URL INSPECTION -->

            <div style="
                padding:20px;
                margin-bottom:20px;
                border:1px solid var(--border);
                border-radius:16px;
                background:#0d1522;
            ">

                <h3 style="
                    margin:0;
                    font-size:15px;
                ">
                    URL Inspection
                </h3>


                <span style="
                    display:block;
                    margin-top:4px;
                    color:#8995a8;
                    font-size:10px;
                ">
                    Check indexing status for a specific URL.
                </span>


                <div style="
                    display:flex;
                    gap:8px;
                    margin-top:15px;
                    flex-wrap:wrap;
                ">

                    <input
                        id="gscInspectUrl"
                        type="url"
                        placeholder="https://curiopress.github.io/page.html"
                        style="
                            flex:1;
                            min-width:220px;
                            height:43px;
                            padding:0 13px;
                            border:1px solid var(--border);
                            border-radius:11px;
                            outline:none;
                            background:#080e18;
                            color:white;
                        "
                    >


                    <button
                        class="button button-primary"
                        id="gscInspectButton"
                    >
                        Inspect URL
                    </button>

                </div>


                <div
                    id="gscInspectionResult"
                    style="
                        margin-top:15px;
                    "
                ></div>

            </div>


            <!-- INDEXING / SITEMAP -->

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(2,minmax(0,1fr));
                gap:20px;
            ">


                <div style="
                    padding:20px;
                    border:1px solid var(--border);
                    border-radius:16px;
                    background:#0d1522;
                ">

                    <h3 style="
                        margin:0;
                        font-size:15px;
                    ">
                        Indexing
                    </h3>


                    <span style="
                        display:block;
                        margin-top:4px;
                        color:#8995a8;
                        font-size:10px;
                    ">
                        Google indexing coverage
                    </span>


                    <div style="
                        margin-top:18px;
                        display:grid;
                        grid-template-columns:
                            repeat(2,1fr);
                        gap:10px;
                    ">


                        <div style="
                            padding:15px;
                            border-radius:12px;
                            background:#101927;
                        ">

                            <small style="
                                color:#8995a8;
                            ">
                                Indexed
                            </small>

                            <strong style="
                                display:block;
                                margin-top:7px;
                                font-size:21px;
                            ">
                                —
                            </strong>

                        </div>


                        <div style="
                            padding:15px;
                            border-radius:12px;
                            background:#101927;
                        ">

                            <small style="
                                color:#8995a8;
                            ">
                                Not Indexed
                            </small>

                            <strong style="
                                display:block;
                                margin-top:7px;
                                font-size:21px;
                            ">
                                —
                            </strong>

                        </div>

                    </div>

                </div>


                <div style="
                    padding:20px;
                    border:1px solid var(--border);
                    border-radius:16px;
                    background:#0d1522;
                ">

                    <h3 style="
                        margin:0;
                        font-size:15px;
                    ">
                        Sitemap
                    </h3>


                    <span style="
                        display:block;
                        margin-top:4px;
                        color:#8995a8;
                        font-size:10px;
                    ">
                        Google Search Console sitemap status
                    </span>


                    <div style="
                        margin-top:18px;
                        padding:18px;
                        border-radius:13px;
                        background:#101927;
                    ">

                        <div style="
                            color:#8995a8;
                            font-size:10px;
                        ">
                            Property
                        </div>


                        <strong
                            id="gscSitemapProperty"
                            style="
                                display:block;
                                margin-top:5px;
                                overflow:hidden;
                                text-overflow:ellipsis;
                                white-space:nowrap;
                                font-size:11px;
                            "
                        >
                            Not configured
                        </strong>


                        <button
                            class="button"
                            id="gscSitemapButton"
                            style="
                                margin-top:13px;
                            "
                        >
                            Check Sitemap
                        </button>

                    </div>

                </div>


            </div>


            <!-- API NOTICE -->

            <div style="
                margin-top:20px;
                padding:15px 17px;
                border-radius:13px;
                background:rgba(251,191,36,.06);
                border:1px solid rgba(251,191,36,.15);
                color:#fcd34d;
                font-size:11px;
                line-height:1.6;
            ">

                <strong>
                    Google API status:
                </strong>

                This module does not create fake Search Console
                statistics. Live clicks, impressions, indexing,
                queries and URL inspection require an authenticated
                Google Search Console API connection through the
                Admin Worker.

            </div>

        `;


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "gscSaveProperty"
            )
            .addEventListener(
                "click",
                setProperty
            );


        document
            .getElementById(
                "gscDisconnect"
            )
            .addEventListener(
                "click",
                disconnect
            );


        document
            .getElementById(
                "gscRefresh"
            )
            .addEventListener(
                "click",
                refreshData
            );


        document
            .getElementById(
                "gscInspectButton"
            )
            .addEventListener(
                "click",
                inspectUrl
            );


        document
            .getElementById(
                "gscSitemapButton"
            )
            .addEventListener(
                "click",
                openSitemapStatus
            );


        render();

    }


    /* =====================================================
       RENDER STATE
    ===================================================== */

    function render() {

        const propertyInput =
            document.getElementById(
                "gscPropertyInput"
            );


        const badge =
            document.getElementById(
                "gscConnectionBadge"
            );


        const sitemapProperty =
            document.getElementById(
                "gscSitemapProperty"
            );


        if (propertyInput) {

            propertyInput.value =
                settings.property || "";

        }


        if (sitemapProperty) {

            sitemapProperty.textContent =
                settings.property ||
                "Not configured";

        }


        if (badge) {

            if (
                settings.connected
            ) {

                badge.textContent =
                    "Connected";

                badge.style.background =
                    "rgba(52,211,153,.08)";

                badge.style.border =
                    "1px solid rgba(52,211,153,.18)";

                badge.style.color =
                    "#86efac";

            } else {

                badge.textContent =
                    "API Not Connected";

                badge.style.background =
                    "rgba(251,191,36,.08)";

                badge.style.border =
                    "1px solid rgba(251,191,36,.18)";

                badge.style.color =
                    "#fbbf24";

            }

        }

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                '.nav-item[data-page="gsc"]'
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
                                        document.getElementById(
                                            "gscManagerPanel"
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

                }
            );

    }


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        loadSettings();

        createPanel();

        setupNavigation();

        render();

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

    window.CurioPressGSC = {

        getSettings:
            () => ({
                ...settings
            }),

        setProperty:
            setProperty,

        disconnect:
            disconnect,

        refresh:
            refreshData,

        inspect:
            inspectUrl

    };

})();
