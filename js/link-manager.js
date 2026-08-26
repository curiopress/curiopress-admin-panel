/* =====================================================
   CURIOPRESS LINK CENTER
   js/link-manager.js
===================================================== */

(function () {

    "use strict";


    const STORAGE_KEY =
        "curiopress_link_manager";


    let links = [];


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
                "linkManagerMessage"
            );


        if (old) {

            old.remove();

        }


        const box =
            document.createElement("div");


        box.id =
            "linkManagerMessage";


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


    function loadLinks() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            links =
                saved
                    ? JSON.parse(saved)
                    : [];


            if (!Array.isArray(links)) {

                links = [];

            }

        } catch {

            links = [];

        }

    }


    function saveLinks() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(links)
        );

    }


    function normalizeUrl(url) {

        return String(url || "")
            .trim();

    }


    function isValidUrl(url) {

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
       ADD LINK
    ===================================================== */

    function addLink(
        source,
        target,
        anchor,
        type = "Internal",
        notes = ""
    ) {

        source =
            normalizeUrl(source);

        target =
            normalizeUrl(target);

        anchor =
            String(anchor || "")
                .trim();

        notes =
            String(notes || "")
                .trim();


        if (!source || !target) {

            showMessage(
                "Source and target URLs are required.",
                "error"
            );

            return false;

        }


        if (
            !isValidUrl(source) ||
            !isValidUrl(target)
        ) {

            showMessage(
                "Enter valid HTTP or HTTPS URLs.",
                "error"
            );

            return false;

        }


        links.unshift({

            id:
                crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}_${Math.random()}`,

            source,

            target,

            anchor,

            type,

            status:
                "Active",

            notes,

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        });


        saveLinks();

        renderLinks();

        updateStats();


        showMessage(
            "Link added successfully."
        );


        return true;

    }


    /* =====================================================
       DELETE
    ===================================================== */

    function deleteLink(id) {

        const item =
            links.find(
                link =>
                    link.id === id
            );


        if (!item) {

            return;

        }


        if (
            !confirm(
                `Delete this link?\n\n${item.source}\n→ ${item.target}`
            )
        ) {

            return;

        }


        links =
            links.filter(
                link =>
                    link.id !== id
            );


        saveLinks();

        renderLinks();

        updateStats();


        showMessage(
            "Link deleted."
        );

    }


    /* =====================================================
       EDIT
    ===================================================== */

    function editLink(id) {

        const item =
            links.find(
                link =>
                    link.id === id
            );


        if (!item) {

            return;

        }


        const source =
            prompt(
                "Source URL:",
                item.source
            );


        if (source === null) {

            return;

        }


        const target =
            prompt(
                "Target URL:",
                item.target
            );


        if (target === null) {

            return;

        }


        const anchor =
            prompt(
                "Anchor text:",
                item.anchor
            );


        if (anchor === null) {

            return;

        }


        const notes =
            prompt(
                "Notes:",
                item.notes
            );


        if (notes === null) {

            return;

        }


        if (
            !isValidUrl(source.trim()) ||
            !isValidUrl(target.trim())
        ) {

            showMessage(
                "Enter valid HTTP or HTTPS URLs.",
                "error"
            );

            return;

        }


        item.source =
            source.trim();

        item.target =
            target.trim();

        item.anchor =
            anchor.trim();

        item.notes =
            notes.trim();

        item.updatedAt =
            new Date().toISOString();


        saveLinks();

        renderLinks();

        updateStats();


        showMessage(
            "Link updated successfully."
        );

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function filterLinks(query) {

        const clean =
            String(query || "")
                .toLowerCase()
                .trim();


        document
            .querySelectorAll(
                "[data-link-row]"
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
       IMPORT
    ===================================================== */

    function importLinks() {

        const input =
            prompt(
                "Paste links in this format:\nsource URL | target URL | anchor text\n\nOne link per line."
            );


        if (input === null) {

            return;

        }


        const lines =
            input
                .split("\n")
                .map(
                    line =>
                        line.trim()
                )
                .filter(Boolean);


        let added =
            0;


        lines.forEach(line => {

            const parts =
                line
                    .split("|")
                    .map(
                        value =>
                            value.trim()
                    );


            const source =
                parts[0] || "";

            const target =
                parts[1] || "";

            const anchor =
                parts[2] || "";


            if (
                source &&
                target &&
                isValidUrl(source) &&
                isValidUrl(target)
            ) {

                links.unshift({

                    id:
                        crypto.randomUUID
                        ? crypto.randomUUID()
                        : `${Date.now()}_${Math.random()}`,

                    source,

                    target,

                    anchor,

                    type:
                        "Internal",

                    status:
                        "Active",

                    notes: "",

                    createdAt:
                        new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString()

                });


                added++;

            }

        });


        saveLinks();

        renderLinks();

        updateStats();


        showMessage(
            `${added} link(s) imported.`
        );

    }


    /* =====================================================
       EXPORT
    ===================================================== */

    function exportLinks() {

        if (!links.length) {

            showMessage(
                "There are no links to export.",
                "error"
            );

            return;

        }


        const rows = [

            [
                "Source URL",
                "Target URL",
                "Anchor Text",
                "Type",
                "Status",
                "Notes"
            ],

            ...links.map(item => [

                item.source,

                item.target,

                item.anchor,

                item.type,

                item.status,

                item.notes

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
            "curiopress-links.csv";


        document.body.appendChild(link);

        link.click();

        link.remove();


        URL.revokeObjectURL(url);


        showMessage(
            "Link CSV exported."
        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderLinks() {

        const container =
            document.getElementById(
                "linkTable"
            );


        if (!container) {

            return;

        }


        if (!links.length) {

            container.innerHTML = `

                <div style="
                    padding:35px 15px;
                    text-align:center;
                    color:#8995a8;
                    font-size:13px;
                ">

                    No links added yet.

                </div>

            `;

            return;

        }


        container.innerHTML =
            links.map(
                item => `

                    <div
                        data-link-row
                        style="
                            display:grid;
                            grid-template-columns:
                                minmax(180px,1fr)
                                minmax(180px,1fr)
                                minmax(120px,.7fr)
                                90px
                                125px;
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
                                ${escapeHtml(item.source)}
                            </strong>

                        </div>


                        <div style="
                            min-width:0;
                        ">

                            <a
                                href="${escapeHtml(item.target)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                style="
                                    display:block;
                                    overflow:hidden;
                                    text-overflow:ellipsis;
                                    white-space:nowrap;
                                    color:#5eead4;
                                    font-size:12px;
                                "
                            >
                                ${escapeHtml(item.target)}
                            </a>

                        </div>


                        <div style="
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                            color:#aeb9c9;
                            font-size:11px;
                        ">

                            ${
                                item.anchor
                                    ? escapeHtml(item.anchor)
                                    : "No anchor"
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
                                data-link-edit="${escapeHtml(item.id)}"
                            >
                                Edit
                            </button>

                            <button
                                class="mini-button"
                                data-link-delete="${escapeHtml(item.id)}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                `
            ).join("");


        container
            .querySelectorAll(
                "[data-link-edit]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        editLink(
                            button.dataset.linkEdit
                        )
                );

            });


        container
            .querySelectorAll(
                "[data-link-delete]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        deleteLink(
                            button.dataset.linkDelete
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
                "linkTotal"
            );


        const active =
            document.getElementById(
                "linkActive"
            );


        const sources =
            document.getElementById(
                "linkSources"
            );


        const targets =
            document.getElementById(
                "linkTargets"
            );


        if (total) {

            total.textContent =
                links.length;

        }


        if (active) {

            active.textContent =
                links.filter(
                    item =>
                        item.status ===
                        "Active"
                ).length;

        }


        if (sources) {

            sources.textContent =
                new Set(
                    links.map(
                        item =>
                            item.source
                    )
                ).size;

        }


        if (targets) {

            targets.textContent =
                new Set(
                    links.map(
                        item =>
                            item.target
                    )
                ).size;

        }

    }


    /* =====================================================
       CREATE LINK CENTER
    ===================================================== */

    function createLinkCenter() {

        if (
            document.getElementById(
                "linkCenterPanel"
            )
        ) {

            return;

        }


        const panel =
            document.createElement("section");


        panel.id =
            "linkCenterPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Link Center
                    </h2>

                    <span>
                        Manage internal and external links
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
                        id="linkImport"
                    >
                        Import
                    </button>

                    <button
                        class="button"
                        id="linkExport"
                    >
                        Export
                    </button>

                    <button
                        class="button button-primary"
                        id="linkAdd"
                    >
                        Add Link
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
                        Total Links
                    </small>

                    <strong id="linkTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Active
                    </small>

                    <strong id="linkActive">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Source Pages
                    </small>

                    <strong id="linkSources">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Target URLs
                    </small>

                    <strong id="linkTargets">
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
                    id="linkSearch"
                    type="search"
                    placeholder="Search source, target or anchor..."
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
                    id="linkTable"
                    style="
                        min-width:760px;
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
                "linkAdd"
            )
            .addEventListener(
                "click",
                () => {

                    const source =
                        prompt(
                            "Source URL:"
                        );


                    if (source === null) {

                        return;

                    }


                    const target =
                        prompt(
                            "Target URL:"
                        );


                    if (target === null) {

                        return;

                    }


                    const anchor =
                        prompt(
                            "Anchor text:"
                        );


                    if (anchor === null) {

                        return;

                    }


                    const type =
                        prompt(
                            "Link type:",
                            "Internal"
                        );


                    if (type === null) {

                        return;

                    }


                    const notes =
                        prompt(
                            "Notes (optional):"
                        );


                    if (notes === null) {

                        return;

                    }


                    addLink(
                        source,
                        target,
                        anchor,
                        type,
                        notes
                    );

                }
            );


        document
            .getElementById(
                "linkImport"
            )
            .addEventListener(
                "click",
                importLinks
            );


        document
            .getElementById(
                "linkExport"
            )
            .addEventListener(
                "click",
                exportLinks
            );


        document
            .getElementById(
                "linkSearch"
            )
            .addEventListener(
                "input",
                event =>
                    filterLinks(
                        event.target.value
                    )
            );


        renderLinks();

        updateStats();

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                '.nav-item[data-page="links"]'
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        setTimeout(
                            () => {

                                createLinkCenter();

                                const panel =
                                    document.getElementById(
                                        "linkCenterPanel"
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

        loadLinks();

        setupNavigation();

        createLinkCenter();

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

    window.CurioPressLinkManager = {

        add:
            addLink,

        edit:
            editLink,

        delete:
            deleteLink,

        import:
            importLinks,

        export:
            exportLinks,

        getLinks:
            () =>
                [...links]

    };


})();
