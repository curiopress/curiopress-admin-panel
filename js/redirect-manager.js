/* =====================================================
   CURIOPRESS REDIRECT MANAGER
   js/redirect-manager.js
===================================================== */

(function () {

    "use strict";

    const STORAGE_KEY =
        "curiopress_redirect_manager";

    let redirects = [];


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
                "redirectManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement("div");


        box.id =
            "redirectManagerMessage";


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


    function loadRedirects() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            redirects =
                saved
                    ? JSON.parse(saved)
                    : [];


            if (!Array.isArray(redirects)) {

                redirects = [];

            }

        } catch {

            redirects = [];

        }

    }


    function saveRedirects() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(redirects)
        );

    }


    function normalizePath(path) {

        let value =
            String(path || "")
                .trim();


        if (!value) {

            return "";

        }


        if (
            !value.startsWith("/")
        ) {

            value =
                "/" + value;

        }


        return value;

    }


    function validStatus(status) {

        return (
            status === "301" ||
            status === "302" ||
            status === "307" ||
            status === "308"
        );

    }


    /* =====================================================
       ADD REDIRECT
    ===================================================== */

    function addRedirect() {

        const from =
            prompt(
                "Old URL / path:",
                "/old-page"
            );


        if (from === null) return;


        const to =
            prompt(
                "New URL / path:",
                "/new-page"
            );


        if (to === null) return;


        const status =
            prompt(
                "Redirect status: 301, 302, 307 or 308",
                "301"
            );


        if (status === null) return;


        const source =
            normalizePath(from);


        const target =
            String(to || "")
                .trim();


        const code =
            String(status || "")
                .trim();


        if (!source || !target) {

            showMessage(
                "Source and destination are required.",
                "error"
            );

            return;

        }


        if (!validStatus(code)) {

            showMessage(
                "Redirect status must be 301, 302, 307 or 308.",
                "error"
            );

            return;

        }


        if (source === target) {

            showMessage(
                "Source and destination cannot be identical.",
                "error"
            );

            return;

        }


        if (
            redirects.some(
                item =>
                    item.from === source
            )
        ) {

            showMessage(
                "A redirect already exists for this source.",
                "error"
            );

            return;

        }


        redirects.unshift({

            id:
                crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}_${Math.random()}`,

            from:
                source,

            to:
                target,

            status:
                code,

            active:
                true,

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        });


        saveRedirects();

        render();

        updateStats();


        showMessage(
            "Redirect added successfully."
        );

    }


    /* =====================================================
       EDIT REDIRECT
    ===================================================== */

    function editRedirect(id) {

        const item =
            redirects.find(
                redirect =>
                    redirect.id === id
            );


        if (!item) return;


        const from =
            prompt(
                "Old URL / path:",
                item.from
            );


        if (from === null) return;


        const to =
            prompt(
                "New URL / path:",
                item.to
            );


        if (to === null) return;


        const status =
            prompt(
                "Redirect status:",
                item.status
            );


        if (status === null) return;


        const source =
            normalizePath(from);


        const target =
            String(to || "")
                .trim();


        const code =
            String(status || "")
                .trim();


        if (!source || !target) {

            showMessage(
                "Source and destination are required.",
                "error"
            );

            return;

        }


        if (!validStatus(code)) {

            showMessage(
                "Invalid redirect status.",
                "error"
            );

            return;

        }


        const duplicate =
            redirects.some(
                redirect =>
                    redirect.id !== id &&
                    redirect.from === source
            );


        if (duplicate) {

            showMessage(
                "Another redirect already uses this source.",
                "error"
            );

            return;

        }


        item.from =
            source;

        item.to =
            target;

        item.status =
            code;

        item.updatedAt =
            new Date().toISOString();


        saveRedirects();

        render();

        updateStats();


        showMessage(
            "Redirect updated."
        );

    }


    /* =====================================================
       TOGGLE
    ===================================================== */

    function toggleRedirect(id) {

        const item =
            redirects.find(
                redirect =>
                    redirect.id === id
            );


        if (!item) return;


        item.active =
            !item.active;


        item.updatedAt =
            new Date().toISOString();


        saveRedirects();

        render();

        updateStats();


        showMessage(
            item.active
                ? "Redirect enabled."
                : "Redirect disabled."
        );

    }


    /* =====================================================
       DELETE
    ===================================================== */

    function deleteRedirect(id) {

        const item =
            redirects.find(
                redirect =>
                    redirect.id === id
            );


        if (!item) return;


        if (
            !confirm(
                `Delete redirect?\n\n${item.from} → ${item.to}`
            )
        ) {

            return;

        }


        redirects =
            redirects.filter(
                redirect =>
                    redirect.id !== id
            );


        saveRedirects();

        render();

        updateStats();


        showMessage(
            "Redirect deleted."
        );

    }


    /* =====================================================
       IMPORT
    ===================================================== */

    function importRedirects() {

        const input =
            prompt(
                "Paste redirects, one per line:\n\n/source | /destination | 301"
            );


        if (input === null) return;


        const lines =
            input
                .split("\n")
                .map(
                    line =>
                        line.trim()
                )
                .filter(Boolean);


        let added = 0;


        lines.forEach(line => {

            const parts =
                line
                    .split("|")
                    .map(
                        value =>
                            value.trim()
                    );


            const from =
                normalizePath(
                    parts[0]
                );


            const to =
                parts[1] || "";


            const status =
                parts[2] || "301";


            if (
                !from ||
                !to ||
                !validStatus(status)
            ) {

                return;

            }


            if (
                redirects.some(
                    item =>
                        item.from === from
                )
            ) {

                return;

            }


            redirects.push({

                id:
                    crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}_${Math.random()}`,

                from,

                to,

                status,

                active:
                    true,

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()

            });


            added++;

        });


        saveRedirects();

        render();

        updateStats();


        showMessage(
            `${added} redirect(s) imported.`
        );

    }


    /* =====================================================
       EXPORT
    ===================================================== */

    function exportRedirects() {

        if (!redirects.length) {

            showMessage(
                "There are no redirects to export.",
                "error"
            );

            return;

        }


        const rows = [

            [
                "From",
                "To",
                "Status",
                "Active"
            ],

            ...redirects.map(
                item => [

                    item.from,

                    item.to,

                    item.status,

                    item.active
                        ? "Yes"
                        : "No"

                ]
            )

        ];


        const csv =
            rows
                .map(
                    row =>
                        row
                            .map(
                                value =>
                                    `"${String(value ?? "")
                                        .replace(
                                            /"/g,
                                            '""'
                                        )}"`
                            )
                            .join(",")
                )
                .join("\n");


        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8"
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
            "curiopress-redirects.csv";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        showMessage(
            "Redirect CSV exported."
        );

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function searchRedirects(query) {

        const clean =
            String(query || "")
                .toLowerCase()
                .trim();


        document
            .querySelectorAll(
                "[data-redirect-row]"
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
                "redirectTable"
            );


        if (!container) return;


        if (!redirects.length) {

            container.innerHTML = `

                <div style="
                    padding:40px 15px;
                    text-align:center;
                    color:#8995a8;
                    font-size:13px;
                ">

                    No redirects configured yet.

                </div>

            `;

            return;

        }


        container.innerHTML =
            redirects
                .map(
                    item => `

                        <div
                            data-redirect-row
                            style="
                                display:grid;
                                grid-template-columns:
                                    minmax(160px,1fr)
                                    minmax(160px,1fr)
                                    80px
                                    90px
                                    150px;
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

                                <span style="
                                    display:block;
                                    overflow:hidden;
                                    text-overflow:ellipsis;
                                    white-space:nowrap;
                                    color:#d9e3f0;
                                    font-size:12px;
                                ">
                                    ${escapeHtml(item.from)}
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
                                    font-size:12px;
                                ">
                                    ${escapeHtml(item.to)}
                                </span>

                            </div>


                            <div>

                                <span style="
                                    display:inline-flex;
                                    padding:6px 8px;
                                    border-radius:8px;
                                    background:rgba(94,234,212,.08);
                                    color:#5eead4;
                                    font-size:10px;
                                    font-weight:900;
                                ">
                                    ${escapeHtml(item.status)}
                                </span>

                            </div>


                            <div>

                                <button
                                    class="mini-button"
                                    data-toggle-redirect="${escapeHtml(item.id)}"
                                >
                                    ${item.active
                                        ? "Active"
                                        : "Disabled"}
                                </button>

                            </div>


                            <div style="
                                display:flex;
                                gap:6px;
                                justify-content:flex-end;
                            ">

                                <button
                                    class="mini-button"
                                    data-edit-redirect="${escapeHtml(item.id)}"
                                >
                                    Edit
                                </button>

                                <button
                                    class="mini-button"
                                    data-delete-redirect="${escapeHtml(item.id)}"
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
                "[data-toggle-redirect]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        toggleRedirect(
                            button.dataset
                                .toggleRedirect
                        )
                );

            });


        container
            .querySelectorAll(
                "[data-edit-redirect]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        editRedirect(
                            button.dataset
                                .editRedirect
                        )
                );

            });


        container
            .querySelectorAll(
                "[data-delete-redirect]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        deleteRedirect(
                            button.dataset
                                .deleteRedirect
                        )
                );

            });

    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        const total =
            document.getElementById(
                "redirectTotal"
            );


        const active =
            document.getElementById(
                "redirectActive"
            );


        const disabled =
            document.getElementById(
                "redirectDisabled"
            );


        const permanent =
            document.getElementById(
                "redirectPermanent"
            );


        if (total) {

            total.textContent =
                redirects.length;

        }


        if (active) {

            active.textContent =
                redirects.filter(
                    item =>
                        item.active
                ).length;

        }


        if (disabled) {

            disabled.textContent =
                redirects.filter(
                    item =>
                        !item.active
                ).length;

        }


        if (permanent) {

            permanent.textContent =
                redirects.filter(
                    item =>
                        item.status === "301" ||
                        item.status === "308"
                ).length;

        }

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "redirectManagerPanel"
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
            "redirectManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Redirect Manager
                    </h2>

                    <span>
                        Manage URL redirects and prevent broken links
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
                        id="redirectImport"
                    >
                        Import
                    </button>

                    <button
                        class="button"
                        id="redirectExport"
                    >
                        Export
                    </button>

                    <button
                        class="button button-primary"
                        id="redirectAdd"
                    >
                        Add Redirect
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
                        Total Redirects
                    </small>

                    <strong id="redirectTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Active
                    </small>

                    <strong
                        id="redirectActive"
                        class="good"
                    >
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Disabled
                    </small>

                    <strong
                        id="redirectDisabled"
                        class="warning"
                    >
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Permanent
                    </small>

                    <strong id="redirectPermanent">
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
                    id="redirectSearch"
                    type="search"
                    placeholder="Search old or new URL..."
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

                <div style="
                    min-width:720px;
                ">

                    <div style="
                        display:grid;
                        grid-template-columns:
                            minmax(160px,1fr)
                            minmax(160px,1fr)
                            80px
                            90px
                            150px;
                        gap:12px;
                        padding:10px 8px;
                        color:#596579;
                        font-size:10px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.8px;
                    ">

                        <span>
                            From
                        </span>

                        <span>
                            To
                        </span>

                        <span>
                            Code
                        </span>

                        <span>
                            Status
                        </span>

                        <span>
                            Actions
                        </span>

                    </div>


                    <div
                        id="redirectTable"
                    ></div>

                </div>

            </div>

        `;


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "redirectAdd"
            )
            .addEventListener(
                "click",
                addRedirect
            );


        document
            .getElementById(
                "redirectImport"
            )
            .addEventListener(
                "click",
                importRedirects
            );


        document
            .getElementById(
                "redirectExport"
            )
            .addEventListener(
                "click",
                exportRedirects
            );


        document
            .getElementById(
                "redirectSearch"
            )
            .addEventListener(
                "input",
                event =>
                    searchRedirects(
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
                '.nav-item[data-page="redirects"]'
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
                                        "redirectManagerPanel"
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

        loadRedirects();

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

    window.CurioPressRedirectManager = {

        add:
            addRedirect,

        edit:
            editRedirect,

        remove:
            deleteRedirect,

        toggle:
            toggleRedirect,

        import:
            importRedirects,

        export:
            exportRedirects,

        getRedirects:
            () => [...redirects]

    };

})();
