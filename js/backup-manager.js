/* =====================================================
   CURIOPRESS BACKUP & RESTORE MANAGER
   js/backup-manager.js
===================================================== */

(function () {

    "use strict";

    const STORAGE_KEY =
        "curiopress_backup_manager";

    let backups = [];


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
                "backupManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement(
                "div"
            );


        box.id =
            "backupManagerMessage";


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

                if (
                    box.parentNode
                ) {

                    box.remove();

                }

            },
            3200
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

        if (!value) {

            return "—";

        }


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

    function loadBackups() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            backups =
                saved
                    ? JSON.parse(saved)
                    : [];


            if (
                !Array.isArray(
                    backups
                )
            ) {

                backups = [];

            }

        } catch {

            backups = [];

        }

    }


    function saveBackups() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    backups
                )
            );

            return true;

        } catch {

            notify(
                "Could not save backup information.",
                "error"
            );

            return false;

        }

    }


    /* =====================================================
       COLLECT ADMIN DATA
    ===================================================== */

    function collectData() {

        const data = {

            exportedAt:
                currentTime(),

            version:
                "1.0",

            source:
                "CurioPress Admin Panel",

            localStorage: {},

            sessionInfo: {

                hasAdminSession:
                    Boolean(
                        sessionStorage.getItem(
                            "curiopress_admin_key"
                        )
                    )

            }

        };


        /*
            We intentionally do NOT export
            the actual Admin Key.
        */

        try {

            for (
                let index = 0;
                index < localStorage.length;
                index++
            ) {

                const key =
                    localStorage.key(
                        index
                    );


                if (!key) continue;


                /*
                    Do not copy the actual
                    authentication secret.
                */

                if (
                    key ===
                    "curiopress_admin_key"
                ) {

                    continue;

                }


                try {

                    const value =
                        localStorage.getItem(
                            key
                        );


                    try {

                        data.localStorage[key] =
                            JSON.parse(
                                value
                            );

                    } catch {

                        data.localStorage[key] =
                            value;

                    }

                } catch {

                    data.localStorage[key] =
                        "[unavailable]";

                }

            }

        } catch {

            data.localStorage =
                {};

        }


        return data;

    }


    /* =====================================================
       CREATE BACKUP
    ===================================================== */

    function createBackup() {

        const data =
            collectData();


        const backup = {

            id:
                generateId(),

            name:
                `CurioPress Backup ${new Date().toLocaleString()}`,

            createdAt:
                currentTime(),

            size:
                0,

            data

        };


        const json =
            JSON.stringify(
                data,
                null,
                2
            );


        backup.size =
            new Blob(
                [json]
            ).size;


        backups.unshift(
            backup
        );


        /*
            Keep browser storage
            reasonably small.
        */

        if (
            backups.length >
            20
        ) {

            backups =
                backups.slice(
                    0,
                    20
                );

        }


        saveBackups();

        render();

        updateStats();


        notify(
            "Backup created successfully."
        );

    }


    /* =====================================================
       DOWNLOAD BACKUP
    ===================================================== */

    function downloadBackup(
        id
    ) {

        const backup =
            backups.find(
                item =>
                    item.id === id
            );


        if (!backup) {

            notify(
                "Backup not found.",
                "error"
            );

            return;

        }


        const json =
            JSON.stringify(
                backup.data,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
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
            `curiopress-backup-${safeFileName(
                backup.createdAt
            )}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        notify(
            "Backup downloaded."
        );

    }


    function safeFileName(
        value
    ) {

        return String(value)
            .replace(
                /[^a-z0-9]/gi,
                "-"
            )
            .replace(
                /-+/g,
                "-"
            );

    }


    /* =====================================================
       RESTORE BACKUP
    ===================================================== */

    function restoreBackup(
        id
    ) {

        const backup =
            backups.find(
                item =>
                    item.id === id
            );


        if (!backup) {

            notify(
                "Backup not found.",
                "error"
            );

            return;

        }


        if (
            !backup.data ||
            !backup.data.localStorage
        ) {

            notify(
                "This backup does not contain valid restore data.",
                "error"
            );

            return;

        }


        const confirmed =
            confirm(
                "Restore this backup?\n\nExisting CurioPress browser data may be overwritten."
            );


        if (!confirmed) {

            return;

        }


        let restored =
            0;


        try {

            Object.entries(
                backup.data.localStorage
            )
            .forEach(
                ([key, value]) => {

                    try {

                        const stored =
                            typeof value ===
                            "string"
                                ? value
                                : JSON.stringify(
                                    value
                                );


                        localStorage.setItem(
                            key,
                            stored
                        );


                        restored++;

                    } catch {

                        /*
                            Ignore individual
                            storage failures.
                        */

                    }

                }
            );


            loadBackups();

            render();

            updateStats();


            notify(
                `${restored} data item(s) restored.`
            );


        } catch {

            notify(
                "Restore operation failed.",
                "error"
            );

        }

    }


    /* =====================================================
       DELETE BACKUP
    ===================================================== */

    function deleteBackup(
        id
    ) {

        const backup =
            backups.find(
                item =>
                    item.id === id
            );


        if (!backup) return;


        if (
            !confirm(
                `Delete this backup?\n\n${backup.name}`
            )
        ) {

            return;

        }


        backups =
            backups.filter(
                item =>
                    item.id !== id
            );


        saveBackups();

        render();

        updateStats();


        notify(
            "Backup deleted."
        );

    }


    /* =====================================================
       EXPORT ALL BACKUPS
    ===================================================== */

    function exportAll() {

        if (
            !backups.length
        ) {

            notify(
                "No backups available.",
                "error"
            );

            return;

        }


        const exportData = {

            exportedAt:
                currentTime(),

            application:
                "CurioPress Admin",

            backups:
                backups.map(
                    item => ({
                        id:
                            item.id,

                        name:
                            item.name,

                        createdAt:
                            item.createdAt,

                        size:
                            item.size,

                        data:
                            item.data
                    })
                )

        };


        const json =
            JSON.stringify(
                exportData,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
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
            "curiopress-all-backups.json";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        notify(
            "All backups exported."
        );

    }


    /* =====================================================
       IMPORT BACKUP
    ===================================================== */

    function importBackup() {

        const input =
            document.createElement(
                "input"
            );


        input.type =
            "file";


        input.accept =
            "application/json,.json";


        input.addEventListener(
            "change",
            event => {

                const file =
                    event.target.files[0];


                if (!file) return;


                const reader =
                    new FileReader();


                reader.onload =
                    () => {

                        try {

                            const imported =
                                JSON.parse(
                                    reader.result
                                );


                            let data =
                                imported;


                            /*
                                Support both a single
                                backup and the exported
                                all-backups format.
                            */

                            if (
                                imported &&
                                Array.isArray(
                                    imported.backups
                                )
                            ) {

                                const first =
                                    imported.backups[0];


                                if (
                                    first &&
                                    first.data
                                ) {

                                    data =
                                        first.data;

                                }

                            }


                            if (
                                !data ||
                                typeof data !==
                                "object"
                            ) {

                                throw new Error(
                                    "Invalid backup."
                                );

                            }


                            if (
                                !data.localStorage
                            ) {

                                throw new Error(
                                    "Backup does not contain browser data."
                                );

                            }


                            const backup = {

                                id:
                                    generateId(),

                                name:
                                    `Imported Backup ${new Date().toLocaleString()}`,

                                createdAt:
                                    currentTime(),

                                size:
                                    file.size,

                                data

                            };


                            backups.unshift(
                                backup
                            );


                            if (
                                backups.length >
                                20
                            ) {

                                backups =
                                    backups.slice(
                                        0,
                                        20
                                    );

                            }


                            saveBackups();

                            render();

                            updateStats();


                            notify(
                                "Backup imported successfully."
                            );

                        } catch {

                            notify(
                                "Invalid or unsupported backup file.",
                                "error"
                            );

                        }

                    };


                reader.readAsText(
                    file
                );

            }
        );


        input.click();

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function searchBackups(
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
                "[data-backup-row]"
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
       RENDER
    ===================================================== */

    function render() {

        const container =
            document.getElementById(
                "backupTable"
            );


        if (!container) return;


        if (
            !backups.length
        ) {

            container.innerHTML = `

                <div style="
                    padding:45px 20px;
                    text-align:center;
                    color:#8995a8;
                    font-size:13px;
                ">

                    No backups created yet.

                </div>

            `;

            return;

        }


        container.innerHTML =
            backups
                .map(
                    backup => `

                        <div
                            data-backup-row
                            style="
                                display:grid;
                                grid-template-columns:
                                    minmax(200px,1.5fr)
                                    150px
                                    100px
                                    230px;
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
                                    color:#f5f7fb;
                                    font-size:12px;
                                ">
                                    ${escapeHtml(
                                        backup.name
                                    )}
                                </strong>

                                <span style="
                                    display:block;
                                    margin-top:4px;
                                    color:#8995a8;
                                    font-size:10px;
                                ">
                                    ${escapeHtml(
                                        backup.id
                                    )}
                                </span>

                            </div>


                            <span style="
                                color:#aeb9c9;
                                font-size:11px;
                            ">
                                ${escapeHtml(
                                    formatDate(
                                        backup.createdAt
                                    )
                                )}
                            </span>


                            <span style="
                                color:#5eead4;
                                font-size:11px;
                                font-weight:800;
                            ">
                                ${formatBytes(
                                    backup.size
                                )}
                            </span>


                            <div style="
                                display:flex;
                                gap:5px;
                                justify-content:flex-end;
                                flex-wrap:wrap;
                            ">

                                <button
                                    class="mini-button"
                                    data-download-backup="${escapeHtml(
                                        backup.id
                                    )}"
                                >
                                    Download
                                </button>

                                <button
                                    class="mini-button"
                                    data-restore-backup="${escapeHtml(
                                        backup.id
                                    )}"
                                >
                                    Restore
                                </button>

                                <button
                                    class="mini-button"
                                    data-delete-backup="${escapeHtml(
                                        backup.id
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
                "[data-download-backup]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () =>
                            downloadBackup(
                                button.dataset
                                    .downloadBackup
                            )
                    );

                }
            );


        container
            .querySelectorAll(
                "[data-restore-backup]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () =>
                            restoreBackup(
                                button.dataset
                                    .restoreBackup
                            )
                    );

                }
            );


        container
            .querySelectorAll(
                "[data-delete-backup]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () =>
                            deleteBackup(
                                button.dataset
                                    .deleteBackup
                            )
                    );

                }
            );

    }


    /* =====================================================
       SIZE
    ===================================================== */

    function formatBytes(
        bytes
    ) {

        const number =
            Number(
                bytes || 0
            );


        if (
            number < 1024
        ) {

            return `${number} B`;

        }


        if (
            number < 1024 * 1024
        ) {

            return `${(
                number / 1024
            ).toFixed(1)} KB`;

        }


        return `${(
            number /
            (1024 * 1024)
        ).toFixed(1)} MB`;

    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        const total =
            document.getElementById(
                "backupTotal"
            );


        const latest =
            document.getElementById(
                "backupLatest"
            );


        const size =
            document.getElementById(
                "backupSize"
            );


        const storage =
            document.getElementById(
                "backupStorage"
            );


        if (total) {

            total.textContent =
                backups.length;

        }


        if (latest) {

            latest.textContent =
                backups.length
                    ? formatDate(
                        backups[0]
                            .createdAt
                    )
                    : "Never";

        }


        if (size) {

            const totalSize =
                backups.reduce(
                    (
                        sum,
                        backup
                    ) =>
                        sum +
                        Number(
                            backup.size ||
                            0
                        ),
                    0
                );


            size.textContent =
                formatBytes(
                    totalSize
                );

        }


        if (storage) {

            try {

                let total =
                    0;


                for (
                    let i = 0;
                    i <
                    localStorage.length;
                    i++
                ) {

                    const key =
                        localStorage.key(
                            i
                        );


                    if (!key) continue;


                    total +=
                        (
                            localStorage
                                .getItem(
                                    key
                                ) ||
                            ""
                        ).length;

                }


                storage.textContent =
                    formatBytes(
                        total
                    );

            } catch {

                storage.textContent =
                    "—";

            }

        }

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "backupManagerPanel"
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
            "backupManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Backup & Restore
                    </h2>

                    <span>
                        Protect CurioPress Admin browser data
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
                        id="backupImport"
                    >
                        Import
                    </button>

                    <button
                        class="button"
                        id="backupExport"
                    >
                        Export All
                    </button>

                    <button
                        class="button button-primary"
                        id="backupCreate"
                    >
                        Create Backup
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
                        Backups
                    </small>

                    <strong id="backupTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Latest
                    </small>

                    <strong
                        id="backupLatest"
                        style="font-size:11px;"
                    >
                        Never
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Backup Size
                    </small>

                    <strong id="backupSize">
                        0 B
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Browser Storage
                    </small>

                    <strong id="backupStorage">
                        0 B
                    </strong>

                </div>

            </div>


            <div style="
                display:flex;
                gap:10px;
                margin-bottom:15px;
            ">

                <input
                    id="backupSearch"
                    type="search"
                    placeholder="Search backups..."
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

            </div>


            <div style="
                padding:13px 15px;
                margin-bottom:15px;
                border-radius:12px;
                background:rgba(56,189,248,.05);
                border:1px solid rgba(56,189,248,.12);
                color:#93c5fd;
                font-size:10px;
                line-height:1.6;
            ">

                Backups protect the Admin Panel's browser
                data. The actual Admin Key is never included
                in exported backups.

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
                            minmax(200px,1.5fr)
                            150px
                            100px
                            230px;
                        gap:12px;
                        padding:10px 8px;
                        color:#596579;
                        font-size:10px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.8px;
                    ">

                        <span>
                            Backup
                        </span>

                        <span>
                            Created
                        </span>

                        <span>
                            Size
                        </span>

                        <span>
                            Actions
                        </span>

                    </div>


                    <div
                        id="backupTable"
                    ></div>

                </div>

            </div>

        `;


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "backupCreate"
            )
            .addEventListener(
                "click",
                createBackup
            );


        document
            .getElementById(
                "backupImport"
            )
            .addEventListener(
                "click",
                importBackup
            );


        document
            .getElementById(
                "backupExport"
            )
            .addEventListener(
                "click",
                exportAll
            );


        document
            .getElementById(
                "backupSearch"
            )
            .addEventListener(
                "input",
                event =>
                    searchBackups(
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
                '.nav-item[data-page="backups"]'
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
                                            "backupManagerPanel"
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

        loadBackups();

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

    window.CurioPressBackupManager = {

        create:
            createBackup,

        download:
            downloadBackup,

        restore:
            restoreBackup,

        remove:
            deleteBackup,

        exportAll:
            exportAll,

        import:
            importBackup,

        getBackups:
            () => [...backups]

    };

})();
