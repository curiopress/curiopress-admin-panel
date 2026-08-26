/* =====================================================
   CURIOPRESS DRAFT MANAGER
   js/draft-manager.js
===================================================== */

(function () {

    "use strict";

    const STORAGE_KEY =
        "curiopress_draft_manager";

    let drafts = [];


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
                "draftManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement("div");

        box.id =
            "draftManagerMessage";

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


    function generateId() {

        if (
            window.crypto &&
            typeof crypto.randomUUID === "function"
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


    function nowDate() {

        return new Date()
            .toISOString();

    }


    /* =====================================================
       STORAGE
    ===================================================== */

    function loadDrafts() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            drafts =
                saved
                    ? JSON.parse(saved)
                    : [];


            if (!Array.isArray(drafts)) {

                drafts = [];

            }

        } catch {

            drafts = [];

        }

    }


    function saveDrafts() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(drafts)
            );

            return true;

        } catch {

            notify(
                "Unable to save drafts in browser storage.",
                "error"
            );

            return false;

        }

    }


    /* =====================================================
       CREATE DRAFT
    ===================================================== */

    function createDraft() {

        const title =
            prompt(
                "Enter draft title:"
            );


        if (title === null) return;


        const cleanTitle =
            title.trim();


        if (!cleanTitle) {

            notify(
                "Draft title is required.",
                "error"
            );

            return;

        }


        const category =
            prompt(
                "Category:",
                "General"
            );


        if (category === null) return;


        const description =
            prompt(
                "Short description:"
            );


        if (description === null) return;


        const draft = {

            id:
                generateId(),

            title:
                cleanTitle,

            slug:
                createSlug(cleanTitle),

            category:
                category.trim() ||
                "General",

            description:
                description.trim(),

            content:
                "",

            status:
                "Draft",

            createdAt:
                nowDate(),

            updatedAt:
                nowDate()

        };


        drafts.unshift(
            draft
        );


        saveDrafts();

        render();

        updateStats();


        notify(
            "Draft created successfully."
        );

    }


    /* =====================================================
       SLUG
    ===================================================== */

    function createSlug(title) {

        return String(title)
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );

    }


    /* =====================================================
       EDIT DRAFT
    ===================================================== */

    function editDraft(id) {

        const draft =
            drafts.find(
                item =>
                    item.id === id
            );


        if (!draft) return;


        openEditor(
            draft
        );

    }


    /* =====================================================
       EDITOR MODAL
    ===================================================== */

    function openEditor(draft) {

        const existing =
            document.getElementById(
                "draftEditorModal"
            );


        if (existing) {

            existing.remove();

        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "draftEditorModal";


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:99998;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            background:rgba(0,0,0,.8);
        `;


        modal.innerHTML = `

            <div style="
                width:min(1050px,100%);
                height:min(88vh,850px);
                display:flex;
                flex-direction:column;
                background:#0d1522;
                border:1px solid rgba(255,255,255,.1);
                border-radius:20px;
                overflow:hidden;
                box-shadow:
                    0 30px 100px rgba(0,0,0,.65);
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;
                    padding:15px 18px;
                    border-bottom:
                        1px solid rgba(255,255,255,.08);
                ">

                    <div style="
                        min-width:0;
                    ">

                        <strong>
                            Edit Draft
                        </strong>

                        <div style="
                            margin-top:4px;
                            color:#8995a8;
                            font-size:10px;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                        ">
                            ${escapeHtml(draft.title)}
                        </div>

                    </div>


                    <button
                        class="mini-button"
                        id="draftEditorClose"
                    >
                        Close
                    </button>

                </div>


                <div style="
                    display:grid;
                    grid-template-columns:
                        1fr 1fr;
                    gap:12px;
                    padding:15px 18px;
                    border-bottom:
                        1px solid rgba(255,255,255,.06);
                ">

                    <div>

                        <label style="
                            display:block;
                            margin-bottom:7px;
                            color:#8995a8;
                            font-size:10px;
                            font-weight:800;
                        ">
                            TITLE
                        </label>

                        <input
                            id="draftEditorTitle"
                            value="${escapeHtml(draft.title)}"
                            style="
                                width:100%;
                                height:42px;
                                padding:0 12px;
                                border:1px solid rgba(255,255,255,.08);
                                border-radius:10px;
                                outline:none;
                                background:#080e18;
                                color:#fff;
                            "
                        >

                    </div>


                    <div>

                        <label style="
                            display:block;
                            margin-bottom:7px;
                            color:#8995a8;
                            font-size:10px;
                            font-weight:800;
                        ">
                            CATEGORY
                        </label>

                        <input
                            id="draftEditorCategory"
                            value="${escapeHtml(draft.category)}"
                            style="
                                width:100%;
                                height:42px;
                                padding:0 12px;
                                border:1px solid rgba(255,255,255,.08);
                                border-radius:10px;
                                outline:none;
                                background:#080e18;
                                color:#fff;
                            "
                        >

                    </div>

                </div>


                <div style="
                    padding:0 18px 15px;
                ">

                    <label style="
                        display:block;
                        margin-bottom:7px;
                        color:#8995a8;
                        font-size:10px;
                        font-weight:800;
                    ">
                        DESCRIPTION
                    </label>

                    <input
                        id="draftEditorDescription"
                        value="${escapeHtml(draft.description)}"
                        style="
                            width:100%;
                            height:42px;
                            padding:0 12px;
                            border:1px solid rgba(255,255,255,.08);
                            border-radius:10px;
                            outline:none;
                            background:#080e18;
                            color:#fff;
                        "
                    >

                </div>


                <div style="
                    flex:1;
                    min-height:0;
                    padding:0 18px 15px;
                    display:flex;
                    flex-direction:column;
                ">

                    <label style="
                        display:block;
                        margin-bottom:7px;
                        color:#8995a8;
                        font-size:10px;
                        font-weight:800;
                    ">
                        CONTENT
                    </label>

                    <textarea
                        id="draftEditorContent"
                        spellcheck="false"
                        style="
                            flex:1;
                            width:100%;
                            min-height:250px;
                            resize:none;
                            padding:15px;
                            border:1px solid rgba(255,255,255,.08);
                            border-radius:12px;
                            outline:none;
                            background:#080e18;
                            color:#d9e3f0;
                            font-family:
                                ui-monospace,
                                SFMono-Regular,
                                Menlo,
                                Consolas,
                                monospace;
                            font-size:12px;
                            line-height:1.65;
                        "
                    ></textarea>

                </div>


                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                    padding:12px 18px;
                    border-top:
                        1px solid rgba(255,255,255,.08);
                ">

                    <span style="
                        color:#596579;
                        font-size:10px;
                    ">
                        Draft ID:
                        ${escapeHtml(draft.id)}
                    </span>


                    <div style="
                        display:flex;
                        gap:7px;
                    ">

                        <button
                            class="button"
                            id="draftSaveButton"
                        >
                            Save Draft
                        </button>

                        <button
                            class="button button-primary"
                            id="draftPublishButton"
                        >
                            Mark Ready
                        </button>

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        modal.querySelector(
            "#draftEditorContent"
        ).value =
            draft.content || "";


        modal.querySelector(
            "#draftEditorClose"
        ).addEventListener(
            "click",
            () =>
                modal.remove()
        );


        modal.querySelector(
            "#draftSaveButton"
        ).addEventListener(
            "click",
            () => {

                saveEditor(
                    draft,
                    modal
                );

            }
        );


        modal.querySelector(
            "#draftPublishButton"
        ).addEventListener(
            "click",
            () => {

                saveEditor(
                    draft,
                    modal,
                    "Ready"
                );

            }
        );

    }


    /* =====================================================
       SAVE EDITOR
    ===================================================== */

    function saveEditor(
        draft,
        modal,
        newStatus = "Draft"
    ) {

        const title =
            modal.querySelector(
                "#draftEditorTitle"
            ).value.trim();


        const category =
            modal.querySelector(
                "#draftEditorCategory"
            ).value.trim();


        const description =
            modal.querySelector(
                "#draftEditorDescription"
            ).value.trim();


        const content =
            modal.querySelector(
                "#draftEditorContent"
            ).value;


        if (!title) {

            notify(
                "Title cannot be empty.",
                "error"
            );

            return;

        }


        draft.title =
            title;

        draft.slug =
            createSlug(title);

        draft.category =
            category ||
            "General";

        draft.description =
            description;

        draft.content =
            content;

        draft.status =
            newStatus;

        draft.updatedAt =
            nowDate();


        saveDrafts();

        render();

        updateStats();


        modal.remove();


        notify(
            newStatus === "Ready"
                ? "Draft marked as ready."
                : "Draft saved."
        );

    }


    /* =====================================================
       DELETE
    ===================================================== */

    function deleteDraft(id) {

        const draft =
            drafts.find(
                item =>
                    item.id === id
            );


        if (!draft) return;


        if (
            !confirm(
                `Delete this draft?\n\n${draft.title}`
            )
        ) {

            return;

        }


        drafts =
            drafts.filter(
                item =>
                    item.id !== id
            );


        saveDrafts();

        render();

        updateStats();


        notify(
            "Draft deleted."
        );

    }


    /* =====================================================
       DUPLICATE
    ===================================================== */

    function duplicateDraft(id) {

        const original =
            drafts.find(
                item =>
                    item.id === id
            );


        if (!original) return;


        const copy = {

            ...original,

            id:
                generateId(),

            title:
                `${original.title} Copy`,

            slug:
                createSlug(
                    `${original.title} Copy`
                ),

            status:
                "Draft",

            createdAt:
                nowDate(),

            updatedAt:
                nowDate()

        };


        drafts.unshift(
            copy
        );


        saveDrafts();

        render();

        updateStats();


        notify(
            "Draft duplicated."
        );

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function searchDrafts(query) {

        const clean =
            String(query || "")
                .toLowerCase()
                .trim();


        document
            .querySelectorAll(
                "[data-draft-row]"
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
       FILTER
    ===================================================== */

    function filterDrafts(status) {

        document
            .querySelectorAll(
                "[data-draft-row]"
            )
            .forEach(row => {

                const rowStatus =
                    row.dataset.status;


                row.style.display =
                    !status ||
                    status === "All" ||
                    rowStatus === status
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
                "draftTable"
            );


        if (!container) return;


        if (!drafts.length) {

            container.innerHTML = `

                <div style="
                    padding:45px 20px;
                    text-align:center;
                    color:#8995a8;
                    font-size:13px;
                ">

                    No drafts created yet.

                </div>

            `;

            return;

        }


        container.innerHTML =
            drafts
                .map(
                    draft => `

                        <div
                            data-draft-row
                            data-status="${escapeHtml(draft.status)}"
                            style="
                                display:grid;
                                grid-template-columns:
                                    minmax(200px,1.5fr)
                                    120px
                                    100px
                                    130px
                                    190px;
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
                                    ${escapeHtml(draft.title)}
                                </strong>

                                <span style="
                                    display:block;
                                    margin-top:4px;
                                    overflow:hidden;
                                    text-overflow:ellipsis;
                                    white-space:nowrap;
                                    color:#8995a8;
                                    font-size:10px;
                                ">
                                    ${escapeHtml(
                                        draft.description ||
                                        draft.slug
                                    )}
                                </span>

                            </div>


                            <span style="
                                color:#aeb9c9;
                                font-size:11px;
                            ">
                                ${escapeHtml(draft.category)}
                            </span>


                            <span style="
                                color:${draft.status === "Ready"
                                    ? "#34d399"
                                    : "#fbbf24"};
                                font-size:11px;
                                font-weight:800;
                            ">
                                ${escapeHtml(draft.status)}
                            </span>


                            <span style="
                                color:#8995a8;
                                font-size:10px;
                            ">
                                ${formatDate(
                                    draft.updatedAt
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
                                    data-edit-draft="${escapeHtml(draft.id)}"
                                >
                                    Edit
                                </button>

                                <button
                                    class="mini-button"
                                    data-copy-draft="${escapeHtml(draft.id)}"
                                >
                                    Copy
                                </button>

                                <button
                                    class="mini-button"
                                    data-delete-draft="${escapeHtml(draft.id)}"
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
                "[data-edit-draft]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        editDraft(
                            button.dataset
                                .editDraft
                        )
                );

            });


        container
            .querySelectorAll(
                "[data-copy-draft]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        duplicateDraft(
                            button.dataset
                                .copyDraft
                        )
                );

            });


        container
            .querySelectorAll(
                "[data-delete-draft]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        deleteDraft(
                            button.dataset
                                .deleteDraft
                        )
                );

            });

    }


    function formatDate(value) {

        if (!value) return "—";


        try {

            return new Date(
                value
            ).toLocaleString();

        } catch {

            return value;

        }

    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        const total =
            document.getElementById(
                "draftTotal"
            );


        const draftsCount =
            document.getElementById(
                "draftCount"
            );


        const ready =
            document.getElementById(
                "draftReady"
            );


        const categories =
            document.getElementById(
                "draftCategories"
            );


        if (total) {

            total.textContent =
                drafts.length;

        }


        if (draftsCount) {

            draftsCount.textContent =
                drafts.filter(
                    item =>
                        item.status ===
                        "Draft"
                ).length;

        }


        if (ready) {

            ready.textContent =
                drafts.filter(
                    item =>
                        item.status ===
                        "Ready"
                ).length;

        }


        if (categories) {

            categories.textContent =
                new Set(
                    drafts.map(
                        item =>
                            item.category
                    )
                ).size;

        }

    }


    /* =====================================================
       EXPORT
    ===================================================== */

    function exportDrafts() {

        if (!drafts.length) {

            notify(
                "There are no drafts to export.",
                "error"
            );

            return;

        }


        const data =
            JSON.stringify(
                drafts,
                null,
                2
            );


        const blob =
            new Blob(
                [data],
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
            "curiopress-drafts.json";


        document.body.appendChild(
            link
        );

        link.click();

        link.remove();


        URL.revokeObjectURL(
            url
        );


        notify(
            "Drafts exported successfully."
        );

    }


    /* =====================================================
       IMPORT
    ===================================================== */

    function importDrafts() {

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


                            if (
                                !Array.isArray(
                                    imported
                                )
                            ) {

                                throw new Error(
                                    "Invalid draft file."
                                );

                            }


                            let added =
                                0;


                            imported.forEach(
                                item => {

                                    if (
                                        !item ||
                                        !item.title
                                    ) {

                                        return;

                                    }


                                    drafts.push({

                                        id:
                                            generateId(),

                                        title:
                                            String(
                                                item.title
                                            ),

                                        slug:
                                            String(
                                                item.slug ||
                                                createSlug(
                                                    item.title
                                                )
                                            ),

                                        category:
                                            String(
                                                item.category ||
                                                "General"
                                            ),

                                        description:
                                            String(
                                                item.description ||
                                                ""
                                            ),

                                        content:
                                            String(
                                                item.content ||
                                                ""
                                            ),

                                        status:
                                            item.status ===
                                            "Ready"
                                                ? "Ready"
                                                : "Draft",

                                        createdAt:
                                            item.createdAt ||
                                            nowDate(),

                                        updatedAt:
                                            nowDate()

                                    });


                                    added++;

                                }
                            );


                            saveDrafts();

                            render();

                            updateStats();


                            notify(
                                `${added} draft(s) imported.`
                            );

                        } catch {

                            notify(
                                "Invalid JSON draft file.",
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
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "draftManagerPanel"
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
            "draftManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Draft Manager
                    </h2>

                    <span>
                        Create, edit and organize unpublished content
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
                        id="draftImport"
                    >
                        Import
                    </button>

                    <button
                        class="button"
                        id="draftExport"
                    >
                        Export
                    </button>

                    <button
                        class="button button-primary"
                        id="draftCreate"
                    >
                        New Draft
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
                        Total
                    </small>

                    <strong id="draftTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Drafts
                    </small>

                    <strong
                        id="draftCount"
                    >
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Ready
                    </small>

                    <strong
                        id="draftReady"
                    >
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Categories
                    </small>

                    <strong
                        id="draftCategories"
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
                    id="draftSearch"
                    type="search"
                    placeholder="Search drafts..."
                    style="
                        flex:1;
                        min-width:180px;
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
                    id="draftFilter"
                    style="
                        height:43px;
                        padding:0 12px;
                        border:1px solid var(--border);
                        border-radius:12px;
                        outline:none;
                        background:#0c1320;
                        color:white;
                    "
                >

                    <option value="All">
                        All
                    </option>

                    <option value="Draft">
                        Draft
                    </option>

                    <option value="Ready">
                        Ready
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
                            minmax(200px,1.5fr)
                            120px
                            100px
                            130px
                            190px;
                        gap:12px;
                        padding:10px 8px;
                        color:#596579;
                        font-size:10px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.8px;
                    ">

                        <span>
                            Draft
                        </span>

                        <span>
                            Category
                        </span>

                        <span>
                            Status
                        </span>

                        <span>
                            Updated
                        </span>

                        <span>
                            Actions
                        </span>

                    </div>


                    <div
                        id="draftTable"
                    ></div>

                </div>

            </div>

        `;


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "draftCreate"
            )
            .addEventListener(
                "click",
                createDraft
            );


        document
            .getElementById(
                "draftImport"
            )
            .addEventListener(
                "click",
                importDrafts
            );


        document
            .getElementById(
                "draftExport"
            )
            .addEventListener(
                "click",
                exportDrafts
            );


        document
            .getElementById(
                "draftSearch"
            )
            .addEventListener(
                "input",
                event =>
                    searchDrafts(
                        event.target.value
                    )
            );


        document
            .getElementById(
                "draftFilter"
            )
            .addEventListener(
                "change",
                event =>
                    filterDrafts(
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
                '.nav-item[data-page="drafts"]'
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
                                        "draftManagerPanel"
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

        loadDrafts();

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

    window.CurioPressDraftManager = {

        create:
            createDraft,

        edit:
            editDraft,

        remove:
            deleteDraft,

        duplicate:
            duplicateDraft,

        export:
            exportDrafts,

        import:
            importDrafts,

        getDrafts:
            () => [...drafts]

    };

})();
