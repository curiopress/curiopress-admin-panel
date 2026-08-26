/* =====================================================
   CURIOPRESS SITE HEALTH MANAGER
   js/health-manager.js
===================================================== */

(function () {

    "use strict";

    const STORAGE_KEY =
        "curiopress_health_manager";

    let checks = [];


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


    function notify(text, type = "success") {

        const old =
            document.getElementById(
                "healthManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement("div");

        box.id =
            "healthManagerMessage";

        box.textContent =
            text;


        box.style.cssText = `
            position:fixed;
            right:20px;
            bottom:80px;
            z-index:99999;
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
            box-shadow:0 15px 40px rgba(0,0,0,.45);
        `;


        document.body.appendChild(box);


        setTimeout(
            () => {
                if (box.parentNode) {
                    box.remove();
                }
            },
            3000
        );

    }


    function now() {

        return new Date().toISOString();

    }


    function loadChecks() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            checks =
                saved
                    ? JSON.parse(saved)
                    : [];


            if (!Array.isArray(checks)) {

                checks = [];

            }

        } catch {

            checks = [];

        }

    }


    function saveChecks() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(checks)
            );

        } catch {

            notify(
                "Unable to save health data.",
                "error"
            );

        }

    }


    /* =====================================================
       CHECK DEFINITIONS
    ===================================================== */

    function defaultChecks() {

        return [

            {
                id: "website",
                name: "Website",
                description:
                    "Main website availability",
                status: "Pending",
                detail:
                    "Run a health check to test the website.",
                checkedAt: null
            },

            {
                id: "https",
                name: "HTTPS",
                description:
                    "Secure HTTPS connection",
                status: "Pending",
                detail:
                    "HTTPS status will be checked from the browser.",
                checkedAt: null
            },

            {
                id: "sitemap",
                name: "Sitemap",
                description:
                    "sitemap.xml availability",
                status: "Pending",
                detail:
                    "Sitemap endpoint has not been checked yet.",
                checkedAt: null
            },

            {
                id: "robots",
                name: "Robots.txt",
                description:
                    "robots.txt availability",
                status: "Pending",
                detail:
                    "Robots.txt endpoint has not been checked yet.",
                checkedAt: null
            },

            {
                id: "api",
                name: "Admin API",
                description:
                    "CurioPress Admin Worker",
                status: "Pending",
                detail:
                    "Admin API has not been checked yet.",
                checkedAt: null
            },

            {
                id: "console",
                name: "Browser",
                description:
                    "Current browser environment",
                status: "Pending",
                detail:
                    "Browser environment has not been checked yet.",
                checkedAt: null
            }

        ];

    }


    function ensureChecks() {

        const defaults =
            defaultChecks();


        defaults.forEach(defaultItem => {

            const existing =
                checks.find(
                    item =>
                        item.id ===
                        defaultItem.id
                );


            if (!existing) {

                checks.push(
                    defaultItem
                );

            }

        });

    }


    /* =====================================================
       STATUS
    ===================================================== */

    function statusIcon(status) {

        if (status === "Good") {
            return "✓";
        }

        if (status === "Warning") {
            return "!";
        }

        if (status === "Error") {
            return "×";
        }

        return "•";

    }


    function statusColor(status) {

        if (status === "Good") {
            return "#34d399";
        }

        if (status === "Warning") {
            return "#fbbf24";
        }

        if (status === "Error") {
            return "#fb7185";
        }

        return "#8995a8";

    }


    /* =====================================================
       WEBSITE CHECK
    ===================================================== */

    async function checkWebsite() {

        const target =
            getWebsiteUrl();


        try {

            const response =
                await fetch(
                    target,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );


            if (response.ok) {

                return {
                    status: "Good",
                    detail:
                        `Website responded with HTTP ${response.status}.`
                };

            }


            return {
                status: "Warning",
                detail:
                    `Website responded with HTTP ${response.status}.`
            };

        } catch {

            return {
                status: "Error",
                detail:
                    "Website could not be reached from the browser."
            };

        }

    }


    /* =====================================================
       HTTPS CHECK
    ===================================================== */

    function checkHttps() {

        if (
            location.protocol ===
            "https:"
        ) {

            return {
                status: "Good",
                detail:
                    "Admin panel is running over HTTPS."
            };

        }


        return {
            status: "Warning",
            detail:
                "Admin panel is not currently using HTTPS."
        };

    }


    /* =====================================================
       SITEMAP CHECK
    ===================================================== */

    async function checkSitemap() {

        const base =
            getWebsiteBase();


        try {

            const response =
                await fetch(
                    `${base}/sitemap.xml`,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );


            if (response.ok) {

                const text =
                    await response.text();


                if (
                    text
                        .toLowerCase()
                        .includes("<urlset") ||
                    text
                        .toLowerCase()
                        .includes("<sitemapindex")
                ) {

                    return {
                        status: "Good",
                        detail:
                            "sitemap.xml is reachable and contains sitemap XML."
                    };

                }


                return {
                    status: "Warning",
                    detail:
                        "sitemap.xml is reachable but its XML structure should be reviewed."
                };

            }


            return {
                status: "Warning",
                detail:
                    `sitemap.xml returned HTTP ${response.status}.`
            };

        } catch {

            return {
                status: "Error",
                detail:
                    "Could not reach sitemap.xml."
            };

        }

    }


    /* =====================================================
       ROBOTS CHECK
    ===================================================== */

    async function checkRobots() {

        const base =
            getWebsiteBase();


        try {

            const response =
                await fetch(
                    `${base}/robots.txt`,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );


            if (response.ok) {

                const text =
                    await response.text();


                if (
                    text.trim().length
                ) {

                    return {
                        status: "Good",
                        detail:
                            "robots.txt is reachable and contains content."
                    };

                }


                return {
                    status: "Warning",
                    detail:
                        "robots.txt is reachable but appears empty."
                };

            }


            return {
                status: "Warning",
                detail:
                    `robots.txt returned HTTP ${response.status}.`
            };

        } catch {

            return {
                status: "Error",
                detail:
                    "Could not reach robots.txt."
            };

        }

    }


    /* =====================================================
       API CHECK
    ===================================================== */

    async function checkApi() {

        const apiUrl =
            window.CURIOPRESS_ADMIN_API_URL ||
            "https://curiopress-admin-api.curiopress31.workers.dev";


        const key =
            sessionStorage.getItem(
                "curiopress_admin_key"
            );


        if (!key) {

            return {
                status: "Warning",
                detail:
                    "Admin session key is not available."
            };

        }


        try {

            const response =
                await fetch(
                    `${apiUrl}/api/repository`,
                    {
                        method: "GET",

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


            if (response.ok) {

                return {
                    status: "Good",
                    detail:
                        "Admin API responded successfully."
                };

            }


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                return {
                    status: "Error",
                    detail:
                        "Admin API rejected the current session."
                };

            }


            return {
                status: "Warning",
                detail:
                    `Admin API returned HTTP ${response.status}.`
            };

        } catch {

            return {
                status: "Error",
                detail:
                    "Could not connect to the Admin API."
            };

        }

    }


    /* =====================================================
       BROWSER CHECK
    ===================================================== */

    function checkBrowser() {

        const issues = [];


        if (
            !window.fetch
        ) {

            issues.push(
                "Fetch API unavailable"
            );

        }


        if (
            !window.localStorage
        ) {

            issues.push(
                "LocalStorage unavailable"
            );

        }


        if (issues.length) {

            return {
                status: "Warning",
                detail:
                    issues.join(", ") + "."
            };

        }


        return {
            status: "Good",
            detail:
                "Required browser features are available."
        };

    }


    /* =====================================================
       URL HELPERS
    ===================================================== */

    function getWebsiteBase() {

        const configured =
            window.CURIOPRESS_WEBSITE_URL;


        if (configured) {

            return String(
                configured
            ).replace(
                /\/+$/,
                ""
            );

        }


        return location.origin;

    }


    function getWebsiteUrl() {

        const configured =
            window.CURIOPRESS_WEBSITE_URL;


        if (configured) {

            return configured;

        }


        return location.origin;

    }


    /* =====================================================
       RUN ALL CHECKS
    ===================================================== */

    async function runHealthCheck() {

        const button =
            document.getElementById(
                "runHealthCheck"
            );


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Checking...";

        }


        notify(
            "Running website health checks..."
        );


        const results =
            await Promise.all([
                checkWebsite(),
                Promise.resolve(
                    checkHttps()
                ),
                checkSitemap(),
                checkRobots(),
                checkApi(),
                Promise.resolve(
                    checkBrowser()
                )
            ]);


        const ids = [
            "website",
            "https",
            "sitemap",
            "robots",
            "api",
            "console"
        ];


        results.forEach(
            (result, index) => {

                const item =
                    checks.find(
                        check =>
                            check.id ===
                            ids[index]
                    );


                if (!item) return;


                item.status =
                    result.status;

                item.detail =
                    result.detail;

                item.checkedAt =
                    now();

            }
        );


        saveChecks();

        render();

        updateStats();


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Run Health Check";

        }


        const score =
            calculateScore();


        notify(
            `Health check complete. Score: ${score}/100`
        );

    }


    /* =====================================================
       SCORE
    ===================================================== */

    function calculateScore() {

        if (!checks.length) {

            return 0;

        }


        let points = 0;


        checks.forEach(
            item => {

                if (
                    item.status ===
                    "Good"
                ) {

                    points += 100;

                } else if (
                    item.status ===
                    "Warning"
                ) {

                    points += 60;

                }

            }
        );


        return Math.round(
            points /
            checks.length
        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function render() {

        const container =
            document.getElementById(
                "healthCheckList"
            );


        if (!container) return;


        container.innerHTML =
            checks
                .map(
                    item => `

                        <div
                            data-health-row
                            style="
                                display:flex;
                                align-items:center;
                                justify-content:space-between;
                                gap:15px;
                                padding:14px 8px;
                                border-bottom:
                                    1px solid rgba(255,255,255,.05);
                            "
                        >

                            <div style="
                                display:flex;
                                align-items:center;
                                gap:12px;
                                min-width:0;
                            ">

                                <div style="
                                    width:36px;
                                    height:36px;
                                    flex:0 0 auto;
                                    display:grid;
                                    place-items:center;
                                    border-radius:10px;
                                    background:${statusColor(item.status)}14;
                                    color:${statusColor(item.status)};
                                    font-weight:900;
                                ">
                                    ${statusIcon(item.status)}
                                </div>


                                <div style="
                                    min-width:0;
                                ">

                                    <strong style="
                                        display:block;
                                        color:#f5f7fb;
                                        font-size:12px;
                                    ">
                                        ${escapeHtml(item.name)}
                                    </strong>

                                    <span style="
                                        display:block;
                                        margin-top:4px;
                                        color:#8995a8;
                                        font-size:10px;
                                    ">
                                        ${escapeHtml(item.detail)}
                                    </span>

                                </div>

                            </div>


                            <div style="
                                flex:0 0 auto;
                                text-align:right;
                            ">

                                <strong style="
                                    display:block;
                                    color:${statusColor(item.status)};
                                    font-size:11px;
                                ">
                                    ${escapeHtml(item.status)}
                                </strong>

                                <span style="
                                    display:block;
                                    margin-top:4px;
                                    color:#596579;
                                    font-size:9px;
                                ">
                                    ${item.checkedAt
                                        ? escapeHtml(
                                            formatDate(
                                                item.checkedAt
                                            )
                                        )
                                        : "Not checked"}
                                </span>

                            </div>

                        </div>

                    `
                )
                .join("");


        updateScoreDisplay();

    }


    /* =====================================================
       SCORE DISPLAY
    ===================================================== */

    function updateScoreDisplay() {

        const score =
            calculateScore();


        const number =
            document.getElementById(
                "healthScoreNumber"
            );


        const circle =
            document.getElementById(
                "healthScoreCircle"
            );


        if (number) {

            number.textContent =
                score;

        }


        if (circle) {

            const degrees =
                Math.round(
                    score * 3.6
                );


            circle.style.background =
                `conic-gradient(
                    var(--accent)
                    0deg
                    ${degrees}deg,
                    #1a2535
                    ${degrees}deg
                    360deg
                )`;

        }

    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        const total =
            document.getElementById(
                "healthTotal"
            );


        const good =
            document.getElementById(
                "healthGood"
            );


        const warning =
            document.getElementById(
                "healthWarning"
            );


        const errors =
            document.getElementById(
                "healthErrors"
            );


        if (total) {

            total.textContent =
                checks.length;

        }


        if (good) {

            good.textContent =
                checks.filter(
                    item =>
                        item.status ===
                        "Good"
                ).length;

        }


        if (warning) {

            warning.textContent =
                checks.filter(
                    item =>
                        item.status ===
                        "Warning"
                ).length;

        }


        if (errors) {

            errors.textContent =
                checks.filter(
                    item =>
                        item.status ===
                        "Error"
                ).length;

        }


        updateScoreDisplay();

    }


    function formatDate(value) {

        try {

            return new Date(
                value
            ).toLocaleString();

        } catch {

            return value;

        }

    }


    /* =====================================================
       EXPORT REPORT
    ===================================================== */

    function exportReport() {

        const report = {

            generatedAt:
                now(),

            score:
                calculateScore(),

            checks:
                checks

        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        report,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;

        link.download =
            "curiopress-health-report.json";


        document.body.appendChild(
            link
        );

        link.click();

        link.remove();


        URL.revokeObjectURL(
            url
        );


        notify(
            "Health report exported."
        );

    }


    /* =====================================================
       RESET
    ===================================================== */

    function resetChecks() {

        if (
            !confirm(
                "Reset all health check results?"
            )
        ) {

            return;

        }


        checks =
            defaultChecks();


        saveChecks();

        render();

        updateStats();


        notify(
            "Health check results reset."
        );

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "healthManagerPanel"
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
            "healthManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Site Health
                    </h2>

                    <span>
                        Check important CurioPress website systems
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
                        id="healthReset"
                    >
                        Reset
                    </button>

                    <button
                        class="button"
                        id="healthExport"
                    >
                        Export Report
                    </button>

                    <button
                        class="button button-primary"
                        id="runHealthCheck"
                    >
                        Run Health Check
                    </button>

                </div>

            </div>


            <div style="
                display:grid;
                grid-template-columns:
                    repeat(4,minmax(0,1fr));
                gap:10px;
                margin-bottom:20px;
            ">

                <div class="stat-card">

                    <small>
                        Checks
                    </small>

                    <strong id="healthTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Healthy
                    </small>

                    <strong id="healthGood">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Warnings
                    </small>

                    <strong id="healthWarning">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Errors
                    </small>

                    <strong id="healthErrors">
                        0
                    </strong>

                </div>

            </div>


            <div style="
                display:flex;
                align-items:center;
                gap:25px;
                padding:20px;
                margin-bottom:18px;
                border:1px solid rgba(255,255,255,.07);
                border-radius:16px;
                background:#0b1320;
            ">

                <div
                    id="healthScoreCircle"
                    style="
                        width:105px;
                        height:105px;
                        flex:0 0 auto;
                        display:grid;
                        place-items:center;
                        border-radius:50%;
                        position:relative;
                        background:
                            conic-gradient(
                                var(--accent)
                                0deg 0deg,
                                #1a2535
                                0deg 360deg
                            );
                    "
                >

                    <div style="
                        position:absolute;
                        inset:8px;
                        display:grid;
                        place-items:center;
                        border-radius:50%;
                        background:#0b1320;
                    ">

                        <strong
                            id="healthScoreNumber"
                            style="
                                font-size:24px;
                            "
                        >
                            0
                        </strong>

                    </div>

                </div>


                <div>

                    <strong style="
                        display:block;
                        font-size:17px;
                    ">
                        Overall Health Score
                    </strong>

                    <span style="
                        display:block;
                        margin-top:6px;
                        color:#8995a8;
                        font-size:11px;
                        line-height:1.6;
                    ">
                        Run a health check to calculate
                        the current score.
                    </span>

                </div>

            </div>


            <div style="
                overflow-x:auto;
            ">

                <div
                    id="healthCheckList"
                    style="
                        min-width:600px;
                    "
                ></div>

            </div>


            <div style="
                margin-top:15px;
                padding:12px 14px;
                border-radius:12px;
                background:rgba(251,191,36,.06);
                border:1px solid rgba(251,191,36,.12);
                color:#fcd34d;
                font-size:10px;
                line-height:1.6;
            ">

                Note: browser based checks can be affected by
                CORS, caching and hosting configuration.
                A failed browser check does not automatically
                mean the website itself is down.

            </div>

        `;


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "runHealthCheck"
            )
            .addEventListener(
                "click",
                runHealthCheck
            );


        document
            .getElementById(
                "healthExport"
            )
            .addEventListener(
                "click",
                exportReport
            );


        document
            .getElementById(
                "healthReset"
            )
            .addEventListener(
                "click",
                resetChecks
            );


        render();

        updateStats();

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                '.nav-item[data-page="health"]'
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
                                        "healthManagerPanel"
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

        loadChecks();

        ensureChecks();

        saveChecks();

        createPanel();

        setupNavigation();

        render();

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

    window.CurioPressHealthManager = {

        run:
            runHealthCheck,

        reset:
            resetChecks,

        export:
            exportReport,

        getChecks:
            () => [...checks],

        getScore:
            calculateScore

    };

})();
