/* =====================================================
   CURIOPRESS DEPLOY MANAGER
   js/deploy-manager.js
===================================================== */

(function () {

    "use strict";

    const API_URL =
        "https://curiopress-admin-api.curiopress31.workers.dev";

    let deployments = [];
    let deploying = false;


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
        text,
        type = "success"
    ) {

        const old =
            document.getElementById(
                "deployManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement("div");


        box.id =
            "deployManagerMessage";


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
            box-shadow:0 15px 40px rgba(0,0,0,.45);
        `;


        document.body.appendChild(box);


        setTimeout(
            () => {

                if (box.parentNode) {
                    box.remove();
                }

            },
            3200
        );

    }


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


        let response;


        try {

            response =
                await fetch(
                    `${API_URL}${endpoint}`,
                    {
                        ...options,

                        headers: {
                            "Authorization":
                                `Bearer ${key}`,

                            "Accept":
                                "application/json",

                            "Content-Type":
                                "application/json",

                            ...(options.headers || {})
                        },

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


        let data = {};


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
       STATUS
    ===================================================== */

    function setStatus(
        text,
        type = "idle"
    ) {

        const status =
            document.getElementById(
                "deployStatus"
            );


        if (!status) return;


        const styles = {

            idle: {
                background:
                    "rgba(148,163,184,.08)",

                border:
                    "rgba(148,163,184,.15)",

                color:
                    "#cbd5e1"
            },

            success: {
                background:
                    "rgba(52,211,153,.08)",

                border:
                    "rgba(52,211,153,.2)",

                color:
                    "#86efac"
            },

            warning: {
                background:
                    "rgba(251,191,36,.08)",

                border:
                    "rgba(251,191,36,.2)",

                color:
                    "#fcd34d"
            },

            error: {
                background:
                    "rgba(251,113,133,.08)",

                border:
                    "rgba(251,113,133,.2)",

                color:
                    "#fda4af"
            },

            running: {
                background:
                    "rgba(56,189,248,.08)",

                border:
                    "rgba(56,189,248,.2)",

                color:
                    "#7dd3fc"
            }

        };


        const style =
            styles[type] ||
            styles.idle;


        status.textContent =
            text;


        status.style.background =
            style.background;

        status.style.border =
            `1px solid ${style.border}`;

        status.style.color =
            style.color;

    }


    /* =====================================================
       DEPLOY
    ===================================================== */

    async function deploy() {

        if (deploying) {

            return;

        }


        const branchInput =
            document.getElementById(
                "deployBranch"
            );


        const messageInput =
            document.getElementById(
                "deployMessage"
            );


        const branch =
            (
                branchInput?.value ||
                "main"
            ).trim();


        const message =
            (
                messageInput?.value ||
                "Deploy CurioPress website"
            ).trim();


        if (!branch) {

            showMessage(
                "Enter a branch name.",
                "error"
            );

            return;

        }


        const confirmed =
            confirm(
                `Deploy the ${branch} branch?\n\nThis will start the deployment workflow.`
            );


        if (!confirmed) {

            return;

        }


        deploying =
            true;


        setStatus(
            "Deployment running...",
            "running"
        );


        updateDeployButton(
            true
        );


        try {

            /*
                Preferred endpoint:

                POST /api/deploy

                The Worker is responsible for
                the actual GitHub / deployment
                workflow.
            */

            const data =
                await apiRequest(
                    "/api/deploy",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                branch,
                                message
                            })
                    }
                );


            const deployment =
                data.deployment ||
                data;


            deployments.unshift({

                id:
                    deployment.id ||
                    deployment.deployment_id ||
                    `local_${Date.now()}`,

                status:
                    deployment.status ||
                    "success",

                branch,

                message,

                created_at:
                    deployment.created_at ||
                    new Date().toISOString(),

                url:
                    deployment.url ||
                    deployment.html_url ||
                    ""

            });


            renderDeployments();


            setStatus(
                deployment.status ||
                "Deployment started",
                deployment.status === "failure"
                    ? "error"
                    : "success"
            );


            showMessage(
                data.message ||
                "Deployment workflow started successfully."
            );


        } catch (error) {

            setStatus(
                "Deployment failed",
                "error"
            );


            showMessage(
                `Deployment failed: ${error.message}`,
                "error"
            );

        } finally {

            deploying =
                false;


            updateDeployButton(
                false
            );

        }

    }


    function updateDeployButton(
        busy
    ) {

        const button =
            document.getElementById(
                "deployManagerButton"
            );


        if (!button) return;


        button.disabled =
            busy;


        button.textContent =
            busy
                ? "Deploying..."
                : "Deploy Website";

    }


    /* =====================================================
       CHECK DEPLOYMENT STATUS
    ===================================================== */

    async function checkStatus() {

        setStatus(
            "Checking deployment...",
            "running"
        );


        try {

            const data =
                await apiRequest(
                    "/api/deploy/status"
                );


            const deployment =
                data.deployment ||
                data;


            if (
                deployment &&
                (
                    deployment.status ||
                    deployment.state
                )
            ) {

                const status =
                    deployment.status ||
                    deployment.state;


                setStatus(
                    formatStatus(status),
                    getStatusType(status)
                );


                if (
                    deployment.url ||
                    deployment.html_url
                ) {

                    updateDeploymentUrl(
                        deployment.url ||
                        deployment.html_url
                    );

                }

            } else {

                setStatus(
                    "No deployment status",
                    "warning"
                );

            }


            showMessage(
                "Deployment status refreshed."
            );


        } catch (error) {

            setStatus(
                "Status unavailable",
                "error"
            );


            showMessage(
                error.message,
                "error"
            );

        }

    }


    function formatStatus(
        status
    ) {

        const clean =
            String(
                status || ""
            )
                .replace(/[_-]/g, " ")
                .trim();


        if (!clean) {
            return "Unknown";
        }


        return clean
            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            );

    }


    function getStatusType(
        status
    ) {

        const value =
            String(
                status || ""
            ).toLowerCase();


        if (
            value.includes("fail") ||
            value.includes("error") ||
            value.includes("cancel")
        ) {

            return "error";

        }


        if (
            value.includes("success") ||
            value.includes("complete") ||
            value.includes("deploy")
        ) {

            return "success";

        }


        if (
            value.includes("progress") ||
            value.includes("pending") ||
            value.includes("queued") ||
            value.includes("running")
        ) {

            return "running";

        }


        return "warning";

    }


    /* =====================================================
       DEPLOYMENT URL
    ===================================================== */

    function updateDeploymentUrl(
        url
    ) {

        const container =
            document.getElementById(
                "deploymentUrl"
            );


        if (!container) return;


        if (!url) {

            container.innerHTML =
                "—";

            return;

        }


        container.innerHTML = `

            <a
                href="${escapeHtml(url)}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                    color:#38bdf8;
                    font-size:11px;
                    overflow:hidden;
                    text-overflow:ellipsis;
                    white-space:nowrap;
                    display:block;
                "
            >
                ${escapeHtml(url)}
            </a>

        `;

    }


    /* =====================================================
       DEPLOYMENT HISTORY
    ===================================================== */

    function renderDeployments() {

        const container =
            document.getElementById(
                "deploymentHistory"
            );


        if (!container) return;


        if (!deployments.length) {

            container.innerHTML = `

                <div style="
                    padding:35px;
                    text-align:center;
                    color:#8995a8;
                    font-size:12px;
                ">

                    No deployments recorded in this session.

                </div>

            `;

            return;

        }


        container.innerHTML =
            deployments
                .map(
                    deployment => {

                        const status =
                            deployment.status ||
                            "unknown";


                        return `

                            <div style="
                                display:flex;
                                align-items:flex-start;
                                justify-content:space-between;
                                gap:15px;
                                padding:14px 8px;
                                border-bottom:
                                    1px solid rgba(255,255,255,.05);
                            ">

                                <div style="
                                    min-width:0;
                                ">

                                    <strong style="
                                        display:block;
                                        font-size:12px;
                                    ">
                                        ${escapeHtml(
                                            deployment.message ||
                                            "Deployment"
                                        )}
                                    </strong>


                                    <span style="
                                        display:block;
                                        margin-top:5px;
                                        color:#8995a8;
                                        font-size:10px;
                                    ">
                                        Branch:
                                        ${escapeHtml(
                                            deployment.branch ||
                                            "main"
                                        )}
                                    </span>


                                    <span style="
                                        display:block;
                                        margin-top:3px;
                                        color:#8995a8;
                                        font-size:10px;
                                    ">
                                        ${escapeHtml(
                                            formatDate(
                                                deployment.created_at
                                            )
                                        )}
                                    </span>

                                </div>


                                <span style="
                                    flex:0 0 auto;
                                    padding:6px 9px;
                                    border-radius:999px;
                                    background:
                                        ${getStatusBackground(
                                            status
                                        )};
                                    color:
                                        ${getStatusColor(
                                            status
                                        )};
                                    font-size:9px;
                                    font-weight:900;
                                    text-transform:uppercase;
                                ">
                                    ${escapeHtml(
                                        status
                                    )}
                                </span>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    function getStatusBackground(
        status
    ) {

        const type =
            getStatusType(status);


        if (type === "success") {

            return "rgba(52,211,153,.08)";

        }


        if (type === "error") {

            return "rgba(251,113,133,.08)";

        }


        if (type === "running") {

            return "rgba(56,189,248,.08)";

        }


        return "rgba(251,191,36,.08)";

    }


    function getStatusColor(
        status
    ) {

        const type =
            getStatusType(status);


        if (type === "success") {

            return "#86efac";

        }


        if (type === "error") {

            return "#fda4af";

        }


        if (type === "running") {

            return "#7dd3fc";

        }


        return "#fcd34d";

    }


    function formatDate(
        value
    ) {

        if (!value) {

            return "Unknown date";

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);

        }


        return date.toLocaleString();

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "deployManagerPanel"
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
            "deployManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Deployment Manager
                    </h2>

                    <span>
                        Control and monitor CurioPress deployments
                    </span>

                </div>


                <span
                    id="deployStatus"
                    style="
                        padding:7px 10px;
                        border-radius:999px;
                        background:rgba(148,163,184,.08);
                        border:1px solid rgba(148,163,184,.15);
                        color:#cbd5e1;
                        font-size:10px;
                        font-weight:800;
                    "
                >
                    Ready
                </span>

            </div>


            <!-- DEPLOY FORM -->

            <div style="
                display:grid;
                grid-template-columns:
                    180px
                    minmax(200px,1fr);
                gap:12px;
                margin-bottom:15px;
            ">

                <div>

                    <label style="
                        display:block;
                        margin-bottom:7px;
                        color:#b8c2d1;
                        font-size:11px;
                        font-weight:700;
                    ">
                        Branch
                    </label>


                    <input
                        id="deployBranch"
                        value="main"
                        type="text"
                        style="
                            width:100%;
                            height:43px;
                            padding:0 13px;
                            border:1px solid var(--border);
                            border-radius:11px;
                            outline:none;
                            background:#0c1320;
                            color:white;
                        "
                    >

                </div>


                <div>

                    <label style="
                        display:block;
                        margin-bottom:7px;
                        color:#b8c2d1;
                        font-size:11px;
                        font-weight:700;
                    ">
                        Deployment Message
                    </label>


                    <input
                        id="deployMessage"
                        value="Deploy CurioPress website"
                        type="text"
                        style="
                            width:100%;
                            height:43px;
                            padding:0 13px;
                            border:1px solid var(--border);
                            border-radius:11px;
                            outline:none;
                            background:#0c1320;
                            color:white;
                        "
                    >

                </div>

            </div>


            <div style="
                display:flex;
                gap:8px;
                flex-wrap:wrap;
                margin-bottom:20px;
            ">

                <button
                    class="button button-primary"
                    id="deployManagerButton"
                >
                    Deploy Website
                </button>


                <button
                    class="button"
                    id="deployStatusButton"
                >
                    Check Status
                </button>

            </div>


            <!-- DEPLOYMENT INFO -->

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(2,minmax(0,1fr));
                gap:10px;
                margin-bottom:20px;
            ">


                <div class="stat-card">

                    <small>
                        Deployment URL
                    </small>

                    <div
                        id="deploymentUrl"
                        style="
                            margin-top:12px;
                        "
                    >
                        —
                    </div>

                </div>


                <div class="stat-card">

                    <small>
                        Current State
                    </small>

                    <strong
                        id="deploymentState"
                        style="
                            font-size:15px;
                        "
                    >
                        Ready
                    </strong>

                </div>

            </div>


            <!-- HISTORY -->

            <div class="panel-header"
                style="
                    margin-bottom:8px;
                "
            >

                <div>

                    <h2>
                        Recent Deployments
                    </h2>

                    <span>
                        Deployment activity from this session
                    </span>

                </div>

            </div>


            <div style="
                border:1px solid var(--border);
                border-radius:14px;
                overflow:hidden;
                background:#0d1522;
            ">

                <div
                    id="deploymentHistory"
                >

                    <div style="
                        padding:35px;
                        text-align:center;
                        color:#8995a8;
                        font-size:12px;
                    ">
                        No deployments recorded in this session.
                    </div>

                </div>

            </div>


            <!-- NOTICE -->

            <div style="
                margin-top:15px;
                padding:14px 16px;
                border-radius:13px;
                background:rgba(251,191,36,.05);
                border:1px solid rgba(251,191,36,.12);
                color:#fcd34d;
                font-size:10px;
                line-height:1.6;
            ">

                Deployment requests are sent to the authenticated
                CurioPress Admin Worker. The Worker must expose
                the deployment endpoint for an actual deployment
                to occur.

            </div>

        `;


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "deployManagerButton"
            )
            .addEventListener(
                "click",
                deploy
            );


        document
            .getElementById(
                "deployStatusButton"
            )
            .addEventListener(
                "click",
                checkStatus
            );


        updateDeploymentState(
            "Ready"
        );

    }


    function updateDeploymentState(
        text
    ) {

        const state =
            document.getElementById(
                "deploymentState"
            );


        if (state) {

            state.textContent =
                text;

        }

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        /*
            Deploy does not have its own sidebar item
            in the current HTML.

            It is therefore also connected to the
            existing global Deploy button.
        */

        const globalButton =
            document.getElementById(
                "deployButton"
            );


        if (globalButton) {

            globalButton.addEventListener(
                "click",
                () => {

                    createPanel();


                    const panel =
                        document.getElementById(
                            "deployManagerPanel"
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
            );

        }

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.CurioPressDeployManager = {

        deploy,

        checkStatus,

        getDeployments:
            () => [...deployments]

    };


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

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

})();
