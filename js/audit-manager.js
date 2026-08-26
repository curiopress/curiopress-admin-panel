/* =====================================================
   CURIOPRESS AUDIT HISTORY MANAGER
   js/audit-manager.js
===================================================== */

(function () {

    "use strict";

    const STORAGE_KEY =
        "curiopress_audit_history";

    let auditLogs = [];


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
                "auditManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement(
                "div"
            );


        box.id =
            "auditManagerMessage";


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

                if (
                    box.parentNode
                ) {

                    box.remove();

                }

            },
            3000
        );

    }


    function generateId() {

        if (
            window.crypto &&
            typeof crypto.randomUUID ===
            "function"
        ) {

            return crypto.randomUUID();

        }


        return (
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2)
        );

    }


    function currentTime() {

        return new Date()
            .toISOString();

    }


    function formatDate(value) {

        if (!value) return "—";


        try {

            return new Date(
                value
            ).toLocaleString();

        } catch {

            return String(value);

        }

    }


    /* =====================================================
       STORAGE
    ===================================================== */

    function loadLogs() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            auditLogs =
                saved
                    ? JSON.parse(saved)
                    : [];


            if (
                !Array.isArray(
                    auditLogs
                )
            ) {

                auditLogs = [];

            }

        } catch {

            auditLogs = [];

        }

    }


    function saveLogs() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    auditLogs
                )
            );

        } catch {

            notify(
                "Unable to save audit history.",
                "error"
            );

        }

    }


    /* =====================================================
       ADD LOG
    ===================================================== */

    function addLog(
        action,
        target = "",
        details = "",
        status = "Success"
    ) {

        const item = {

            id:
                generateId(),

            action:
                String(
                    action || "Unknown Action"
                ),

            target:
                String(
                    target || ""
                ),

            details:
                String(
                    details || ""
                ),

            status:
                String(
                    status || "Success"
                ),

            timestamp:
                currentTime()

        };


        auditLogs.unshift(
            item
        );


        /*
            Keep the browser history
            manageable.
        */

        if (
            auditLogs.length >
            500
        ) {

            auditLogs =
                auditLogs.slice(
                    0,
                    500
                );

        }


        saveLogs();

        render();

        updateStats();


        return item;

    }


    /* =====================================================
       DEFAULT HISTORY
    ===================================================== */

    function ensureInitialLogs() {

        if (
            auditLogs.length
        ) {

            return;

        }


        auditLogs = [

            {
                id:
                    generateId(),

                action:
                    "Admin Panel Initialized",

                target:
                    "CurioPress Admin",

                details:
                    "Audit history module initialized.",

                status:
                    "Success",

                timestamp:
                    currentTime()

            }

        ];


        saveLogs();

    }


    /* =====================================================
       DELETE LOG
    ===================================================== */

    function deleteLog(
        id
    ) {

        const item =
            auditLogs.find(
                log =>
                    log.id === id
            );


        if (!item) return;


        if (
            !confirm(
                "Delete this audit record?"
            )
        ) {

            return;

        }


        auditLogs =
            auditLogs.filter(
                log =>
                    log.id !== id
            );


        saveLogs();

        render();

        updateStats();


        notify(
            "Audit record deleted."
        );

    }


    /* =====================================================
       CLEAR HISTORY
    ===================================================== */

    function clearHistory() {

        if (
            !auditLogs.length
        ) {

            notify(
                "Audit history is already empty."
            );

            return;

        }


        if (
            !confirm(
                "Clear the complete audit history?"
            )
        ) {

            return;

        }


        auditLogs = [];


        saveLogs();

        render();

        updateStats();


        notify(
            "Audit history cleared."
        );

    }


    /* =====================================================
       EXPORT
    ===================================================== */

    function exportHistory() {

        if (
            !auditLogs.length
        ) {

            notify(
                "No audit records available.",
                "error"
            );

            return;

        }


        const data = {

            application:
                "CurioPress Admin",

            exportedAt:
                currentTime(),

            total:
                auditLogs.length,

            records:
                auditLogs

        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        data,
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
            "curiopress-audit-history.json";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        notify(
            "Audit history exported."
        );

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function searchLogs(
        query
    ) {

        const clean =
            String(
                query || ""
            )
            .toLowerCase()
            .trim();


        document
            .querySelectorAll(
                "[data-audit-row]"
            )
            .forEach(
                row => {

                    row.style.display =
                        !clean ||
                        row.textContent
                            .toLowerCase()
                            .includes(
                                clean
                            )
                            ? ""
                            : "none";

                }
            );

    }


    /* =====================================================
       FILTER
    ===================================================== */

    function filterLogs(
        status
    ) {

        const clean =
            String(
                status || "all"
            )
            .toLowerCase();


        document
            .querySelectorAll(
                "[data-audit-row]"
            )
            .forEach(
                row => {

                    const rowStatus =
                        String(
                            row.dataset.status ||
                            ""
                        )
                        .toLowerCase();


                    row.style.display =
                        clean === "all" ||
                        rowStatus === clean
                            ? ""
                            : "none";

                }
            );

    }


    /* =====================================================
       STATUS
    ===================================================== */

    function statusColor(
        status
    ) {

        const value =
            String(
                status || ""
            ).toLowerCase();


        if (
            value === "success" ||
            value === "completed" ||
            value === "good"
        ) {

            return "#34d399";

        }


        if (
            value === "warning"
        ) {

            return "#fbbf24";

        }


        if (
            value === "error" ||
            value === "failed"
        ) {

            return "#fb7185";

        }


        return "#8995a8";

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function render() {

        const container =
            document.getElementById(
                "auditTable"
            );


        if (!container) return;


        if (
            !auditLogs.length
        ) {

            container.innerHTML = `

                <div style="
                    padding:45px 20px;
                    text-align:center;
                    color:#8995a8;
                    font-size:13px;
                ">

                    No audit records yet.

                </div>

            `;

            return;

        }


        container.innerHTML =
            auditLogs
                .map(
                    log => `

                        <div
                            data-audit-row
                            data-status="${escapeHtml(
                                log.status
                            )}"
                            style="
                                display:grid;
                                grid-template-columns:
                                    160px
                                    minmax(180px,1fr)
                                    minmax(180px,1fr)
                                    145px
                                    70px;
                                gap:12px;
                                align-items:center;
                                padding:14px 8px;
                                border-bottom:
                                    1px solid rgba(255,255,255,.05);
                            "
                        >

                            <div>

                                <strong style="
                                    display:block;
                                    color:#f5f7fb;
                                    font-size:11px;
                                ">
                                    ${escapeHtml(
                                        log.action
                                    )}
                                </strong>

                                <span style="
                                    display:block;
                                    margin-top:4px;
                                    color:#8995a8;
                                    font-size:9px;
                                ">
                                    ${escapeHtml(
                                        log.id
                                    )}
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
                                    ${escapeHtml(
                                        log.target ||
                                        "—"
                                    )}
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
                                    color:#aeb9c9;
                                    font-size:10px;
                                ">
                                    ${escapeHtml(
                                        log.details ||
                                        "—"
                                    )}
                                </span>

                            </div>


                            <div>

                                <span style="
                                    display:inline-flex;
                                    align-items:center;
                                    padding:5px 8px;
                                    border-radius:999px;
                                    background:${statusColor(
                                        log.status
                                    )}14;
                                    color:${statusColor(
                                        log.status
                                    )};
                                    font-size:9px;
                                    font-weight:900;
                                ">
                                    ${escapeHtml(
                                        log.status
                                    )}
                                </span>

                                <span style="
                                    display:block;
                                    margin-top:5px;
                                    color:#596579;
                                    font-size:9px;
                                ">
                                    ${escapeHtml(
                                        formatDate(
                                            log.timestamp
                                        )
                                    )}
                                </span>

                            </div>


                            <div>

                                <button
                                    class="mini-button"
                                    data-delete-audit="${escapeHtml(
                                        log.id
                                    )}"
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
                "[data-delete-audit]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () =>
                            deleteLog(
                                button.dataset
                                    .deleteAudit
                            )
                    );

                }
            );

    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        const total =
            document.getElementById(
                "auditTotal"
            );


        const successful =
            document.getElementById(
                "auditSuccess"
            );


        const warnings =
            document.getElementById(
                "auditWarning"
            );


        const errors =
            document.getElementById(
                "auditErrors"
            );


        if (total) {

            total.textContent =
                auditLogs.length;

        }


        if (successful) {

            successful.textContent =
                auditLogs.filter(
                    log =>
                        String(
                            log.status
                        ).toLowerCase() ===
                        "success"
                ).length;

        }


        if (warnings) {

            warnings.textContent =
                auditLogs.filter(
                    log =>
                        String(
                            log.status
                        ).toLowerCase() ===
                        "warning"
                ).length;

        }


        if (errors) {

            errors.textContent =
                auditLogs.filter(
                    log =>
                        String(
                            log.status
                        ).toLowerCase() ===
                        "error"
                ).length;

        }

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "auditManagerPanel"
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
            "auditManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Audit History
                    </h2>

                    <span>
                        Track important Admin Panel actions
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
                        id="auditExport"
                    >
                        Export
                    </button>

                    <button
                        class="button"
                        id="auditClear"
                    >
                        Clear History
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
                        Total Events
                    </small>

                    <strong id="auditTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Successful
                    </small>

                    <strong id="auditSuccess">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Warnings
                    </small>

                    <strong id="auditWarning">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Errors
                    </small>

                    <strong id="auditErrors">
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
                    id="auditSearch"
                    type="search"
                    placeholder="Search audit history..."
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


                <select
                    id="auditFilter"
                    style="
                        width:150px;
                        height:43px;
                        padding:0 12px;
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

                    <option value="success">
                        Success
                    </option>

                    <option value="warning">
                        Warning
                    </option>

                    <option value="error">
                        Error
                    </option>

                </select>

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
                            160px
                            minmax(180px,1fr)
                            minmax(180px,1fr)
                            145px
                            70px;
                        gap:12px;
                        padding:10px 8px;
                        color:#596579;
                        font-size:10px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.8px;
                    ">

                        <span>
                            Action
                        </span>

                        <span>
                            Target
                        </span>

                        <span>
                            Details
                        </span>

                        <span>
                            Status / Time
                        </span>

                        <span>
                            Action
                        </span>

                    </div>


                    <div
                        id="auditTable"
                    ></div>

                </div>

            </div>

        `;


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "auditExport"
            )
            .addEventListener(
                "click",
                exportHistory
            );


        document
            .getElementById(
                "auditClear"
            )
            .addEventListener(
                "click",
                clearHistory
            );


        document
            .getElementById(
                "auditSearch"
            )
            .addEventListener(
                "input",
                event =>
                    searchLogs(
                        event.target.value
                    )
            );


        document
            .getElementById(
                "auditFilter"
            )
            .addEventListener(
                "change",
                event =>
                    filterLogs(
                        event.target.value
                    )
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
                '.nav-item[data-page="audit"]'
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
                                            "auditManagerPanel"
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

        loadLogs();

        ensureInitialLogs();

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

    window.CurioPressAuditManager = {

        add:
            addLog,

        remove:
            deleteLog,

        clear:
            clearHistory,

        export:
            exportHistory,

        getLogs:
            () => [...auditLogs]

    };

})();
