/* =====================================================
   CurioPress Admin
   Draft Manager
   File: js/draft-manager.js
===================================================== */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const DRAFT_STORAGE_KEY =
        "curiopress_admin_drafts";


    /* =====================================================
       HELPERS
    ===================================================== */

    function getDrafts() {

        try {

            const saved =
                localStorage.getItem(
                    DRAFT_STORAGE_KEY
                );

            if (!saved) {
                return [];
            }

            const drafts =
                JSON.parse(saved);

            return Array.isArray(drafts)
                ? drafts
                : [];

        } catch {

            return [];

        }

    }


    function saveDrafts(drafts) {

        localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify(drafts)
        );

    }


    function createId() {

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2, 9)
        );

    }


    function escapeHtml(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function formatDate(date) {

        if (!date) {
            return "Unknown";
        }

        try {

            return new Date(date)
                .toLocaleString(
                    undefined,
                    {
                        dateStyle: "medium",
                        timeStyle: "short"
                    }
                );

        } catch {

            return date;

        }

    }


    function getStatusClass(status) {

        if (status === "Published") {
            return "good";
        }

        if (status === "Scheduled") {
            return "warning";
        }

        return "";

    }


    /* =====================================================
       GLOBAL DRAFT MANAGER
    ===================================================== */

    window.CurioPressDraftManager = {

        getAll() {

            return getDrafts();

        },


        get(id) {

            return getDrafts()
                .find(
                    draft =>
                        draft.id === id
                );

        },


        create(data = {}) {

            const drafts =
                getDrafts();

            const now =
                new Date().toISOString();

            const draft = {

                id:
                    createId(),

                title:
                    String(
                        data.title || "Untitled Draft"
                    ).trim(),

                slug:
                    String(
                        data.slug || ""
                    ).trim(),

                excerpt:
                    String(
                        data.excerpt || ""
                    ),

                content:
                    String(
                        data.content || ""
                    ),

                category:
                    String(
                        data.category || ""
                    ),

                tags:
                    Array.isArray(data.tags)
                        ? data.tags
                        : [],

                featuredImage:
                    String(
                        data.featuredImage || ""
                    ),

                author:
                    String(
                        data.author || "Admin"
                    ),

                status:
                    data.status ||
                    "Draft",

                createdAt:
                    now,

                updatedAt:
                    now

            };


            drafts.unshift(
                draft
            );

            saveDrafts(
                drafts
            );

            return draft;

        },


        update(id, changes = {}) {

            const drafts =
                getDrafts();

            const index =
                drafts.findIndex(
                    draft =>
                        draft.id === id
                );


            if (index === -1) {

                return null;

            }


            drafts[index] = {

                ...drafts[index],

                ...changes,

                updatedAt:
                    new Date()
                        .toISOString()

            };


            saveDrafts(
                drafts
            );


            return drafts[index];

        },


        remove(id) {

            const drafts =
                getDrafts();

            const filtered =
                drafts.filter(
                    draft =>
                        draft.id !== id
                );


            saveDrafts(
                filtered
            );


            return filtered.length !==
                drafts.length;

        },


        duplicate(id) {

            const original =
                this.get(id);

            if (!original) {
                return null;
            }


            return this.create({

                title:
                    `${original.title} Copy`,

                slug:
                    `${original.slug}-copy`,

                excerpt:
                    original.excerpt,

                content:
                    original.content,

                category:
                    original.category,

                tags:
                    [
                        ...original.tags
                    ],

                featuredImage:
                    original.featuredImage,

                author:
                    original.author,

                status:
                    "Draft"

            });

        }

    };


    /* =====================================================
       UI
    ===================================================== */

    function showMessage(message) {

        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                message
            );

            return;

        }

        const toast =
            document.getElementById(
                "toast"
            );

        if (!toast) {
            return;
        }

        toast.textContent =
            message;

        toast.classList.add(
            "show"
        );

        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2800
        );

    }


    /* =====================================================
       DRAFT EDITOR
    ===================================================== */

    function openEditor(
        draft = null
    ) {

        const existing =
            document.getElementById(
                "draftManagerModal"
            );


        if (existing) {
            existing.remove();
        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "draftManagerModal";


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:1000;
            background:rgba(0,0,0,.82);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:18px;
        `;


        const isEdit =
            Boolean(draft);


        modal.innerHTML = `

            <div style="
                width:min(1100px,100%);
                max-height:92vh;
                display:flex;
                flex-direction:column;
                background:#0d1522;
                border:1px solid rgba(255,255,255,.1);
                border-radius:20px;
                overflow:hidden;
                box-shadow:0 30px 100px rgba(0,0,0,.65);
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;
                    padding:16px 18px;
                    border-bottom:1px solid rgba(255,255,255,.08);
                ">

                    <div>

                        <strong style="
                            font-size:16px;
                        ">
                            ${isEdit
                                ? "Edit Draft"
                                : "Create New Draft"
                            }
                        </strong>

                        <div style="
                            margin-top:4px;
                            color:#8995a8;
                            font-size:11px;
                        ">
                            CurioPress Draft Manager
                        </div>

                    </div>

                    <button
                        class="mini-button"
                        id="draftClose"
                    >
                        Close
                    </button>

                </div>


                <div style="
                    overflow:auto;
                    padding:20px;
                ">

                    <div style="
                        display:grid;
                        grid-template-columns:
                            repeat(2,minmax(0,1fr));
                        gap:15px;
                    ">

                        <div style="
                            grid-column:1/-1;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Title
                            </label>

                            <input
                                id="draftTitle"
                                value="${escapeHtml(
                                    draft?.title || ""
                                )}"
                                placeholder="Enter blog title"
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div>

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Slug
                            </label>

                            <input
                                id="draftSlug"
                                value="${escapeHtml(
                                    draft?.slug || ""
                                )}"
                                placeholder="example-blog-post"
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div>

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Category
                            </label>

                            <input
                                id="draftCategory"
                                value="${escapeHtml(
                                    draft?.category || ""
                                )}"
                                placeholder="Technology"
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div>

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Author
                            </label>

                            <input
                                id="draftAuthor"
                                value="${escapeHtml(
                                    draft?.author || "Admin"
                                )}"
                                placeholder="Author name"
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div>

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Status
                            </label>

                            <select
                                id="draftStatus"
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                                <option
                                    value="Draft"
                                    ${draft?.status === "Draft"
                                        ? "selected"
                                        : ""
                                    }
                                >
                                    Draft
                                </option>

                                <option
                                    value="Scheduled"
                                    ${draft?.status === "Scheduled"
                                        ? "selected"
                                        : ""
                                    }
                                >
                                    Scheduled
                                </option>

                                <option
                                    value="Published"
                                    ${draft?.status === "Published"
                                        ? "selected"
                                        : ""
                                    }
                                >
                                    Published
                                </option>

                            </select>

                        </div>


                        <div style="
                            grid-column:1/-1;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Featured Image URL
                            </label>

                            <input
                                id="draftImage"
                                value="${escapeHtml(
                                    draft?.featuredImage || ""
                                )}"
                                placeholder="https://..."
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div style="
                            grid-column:1/-1;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Excerpt
                            </label>

                            <textarea
                                id="draftExcerpt"
                                placeholder="Short description..."
                                style="
                                    width:100%;
                                    min-height:85px;
                                    padding:13px;
                                    resize:vertical;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                    font:inherit;
                                "
                            >${escapeHtml(
                                draft?.excerpt || ""
                            )}</textarea>

                        </div>


                        <div style="
                            grid-column:1/-1;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Content
                            </label>

                            <textarea
                                id="draftContent"
                                spellcheck="false"
                                placeholder="Write your article here..."
                                style="
                                    width:100%;
                                    min-height:360px;
                                    padding:15px;
                                    resize:vertical;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:#d9e3f0;
                                    outline:none;
                                    font-family:
                                        ui-monospace,
                                        SFMono-Regular,
                                        Menlo,
                                        Consolas,
                                        monospace;
                                    font-size:13px;
                                    line-height:1.65;
                                "
                            >${escapeHtml(
                                draft?.content || ""
                            )}</textarea>

                        </div>

                    </div>

                </div>


                <div style="
                    display:flex;
                    justify-content:flex-end;
                    gap:8px;
                    padding:13px 18px;
                    border-top:1px solid rgba(255,255,255,.08);
                ">

                    <button
                        class="button"
                        id="draftCancel"
                    >
                        Cancel
                    </button>

                    <button
                        class="button button-primary"
                        id="draftSave"
                    >
                        ${isEdit
                            ? "Save Draft"
                            : "Create Draft"
                        }
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        const title =
            modal.querySelector(
                "#draftTitle"
            );

        const slug =
            modal.querySelector(
                "#draftSlug"
            );


        title.addEventListener(
            "input",
            () => {

                if (
                    !slug.value.trim()
                ) {

                    slug.value =
                        title.value
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

            }
        );


        function close() {
            modal.remove();
        }


        modal.querySelector(
            "#draftClose"
        ).addEventListener(
            "click",
            close
        );


        modal.querySelector(
            "#draftCancel"
        ).addEventListener(
            "click",
            close
        );


        modal.querySelector(
            "#draftSave"
        ).addEventListener(
            "click",
            () => {

                const values = {

                    title:
                        title.value.trim(),

                    slug:
                        slug.value.trim(),

                    category:
                        modal.querySelector(
                            "#draftCategory"
                        ).value.trim(),

                    author:
                        modal.querySelector(
                            "#draftAuthor"
                        ).value.trim() ||
                        "Admin",

                    status:
                        modal.querySelector(
                            "#draftStatus"
                        ).value,

                    featuredImage:
                        modal.querySelector(
                            "#draftImage"
                        ).value.trim(),

                    excerpt:
                        modal.querySelector(
                            "#draftExcerpt"
                        ).value.trim(),

                    content:
                        modal.querySelector(
                            "#draftContent"
                        ).value

                };


                if (!values.title) {

                    showMessage(
                        "Draft title is required."
                    );

                    title.focus();

                    return;

                }


                if (isEdit) {

                    window.CurioPressDraftManager
                        .update(
                            draft.id,
                            values
                        );

                    showMessage(
                        "Draft updated successfully."
                    );

                } else {

                    window.CurioPressDraftManager
                        .create(
                            values
                        );

                    showMessage(
                        "Draft created successfully."
                    );

                }


                close();

                renderDrafts();

            }

        );

    }


    /* =====================================================
       DRAFT LIST
    ===================================================== */

    function renderDrafts() {

        const container =
            document.getElementById(
                "draftManagerContainer"
            );


        if (!container) {
            return;
        }


        const drafts =
            getDrafts();


        if (!drafts.length) {

            container.innerHTML = `

                <div style="
                    padding:35px 15px;
                    text-align:center;
                    color:#8995a8;
                ">

                    <div style="
                        font-size:30px;
                        margin-bottom:10px;
                    ">
                        ◇
                    </div>

                    <strong style="
                        color:#d9e3f0;
                        display:block;
                        margin-bottom:6px;
                    ">
                        No drafts yet
                    </strong>

                    <span style="
                        font-size:12px;
                    ">
                        Create your first CurioPress draft.
                    </span>

                </div>

            `;

            return;

        }


        container.innerHTML =
            drafts.map(
                draft => `

                    <div
                        class="change"
                        style="
                            align-items:center;
                        "
                    >

                        <div class="change-icon">
                            ◇
                        </div>


                        <div style="
                            flex:1;
                            min-width:0;
                        ">

                            <strong>
                                ${escapeHtml(
                                    draft.title
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    draft.category ||
                                    "Uncategorized"
                                )}
                                ·
                                ${escapeHtml(
                                    draft.status
                                )}
                                ·
                                Updated
                                ${escapeHtml(
                                    formatDate(
                                        draft.updatedAt
                                    )
                                )}
                            </span>

                        </div>


                        <div style="
                            display:flex;
                            gap:6px;
                            flex-wrap:wrap;
                        ">

                            <button
                                class="mini-button"
                                data-draft-edit="${escapeHtml(draft.id)}"
                            >
                                Edit
                            </button>

                            <button
                                class="mini-button"
                                data-draft-copy="${escapeHtml(draft.id)}"
                            >
                                Duplicate
                            </button>

                            <button
                                class="mini-button"
                                data-draft-delete="${escapeHtml(draft.id)}"
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
                "[data-draft-edit]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const draft =
                                window
                                    .CurioPressDraftManager
                                    .get(
                                        button.dataset
                                            .draftEdit
                                    );

                            if (draft) {
                                openEditor(
                                    draft
                                );
                            }

                        }
                    );

                }
            );


        container
            .querySelectorAll(
                "[data-draft-copy]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            window
                                .CurioPressDraftManager
                                .duplicate(
                                    button.dataset
                                        .draftCopy
                                );

                            showMessage(
                                "Draft duplicated."
                            );

                            renderDrafts();

                        }
                    );

                }
            );


        container
            .querySelectorAll(
                "[data-draft-delete]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const draft =
                                window
                                    .CurioPressDraftManager
                                    .get(
                                        button.dataset
                                            .draftDelete
                                    );


                            if (!draft) {
                                return;
                            }


                            const confirmed =
                                confirm(
                                    `Delete draft "${draft.title}"?`
                                );


                            if (!confirmed) {
                                return;
                            }


                            window
                                .CurioPressDraftManager
                                .remove(
                                    draft.id
                                );


                            showMessage(
                                "Draft deleted."
                            );

                            renderDrafts();

                        }
                    );

                }
            );

    }


    /* =====================================================
       CREATE BUTTON
    ===================================================== */

    function createButton() {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "button button-primary";


        button.type =
            "button";


        button.textContent =
            "New Draft";


        button.addEventListener(
            "click",
            () =>
                openEditor()
        );


        return button;

    }


    /* =====================================================
       CONNECT TO EXISTING PAGE
    ===================================================== */

    function initialize() {

        let container =
            document.getElementById(
                "draftManagerContainer"
            );


        if (!container) {

            container =
                document.createElement(
                    "div"
                );

            container.id =
                "draftManagerContainer";

            container.className =
                "panel";

            container.style.marginTop =
                "20px";


            container.innerHTML = `

                <div class="panel-header">

                    <div>

                        <h2>
                            Draft Manager
                        </h2>

                        <span>
                            Create and manage CurioPress drafts
                        </span>

                    </div>

                </div>

            `;


            const header =
                container.querySelector(
                    ".panel-header"
                );


            header.appendChild(
                createButton()
            );


            const anchor =
                document.querySelector(
                    ".content"
                );


            if (anchor) {

                anchor.appendChild(
                    container
                );

            }

        }


        renderDrafts();

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.CurioPressDraftUI = {

        open:
            openEditor,

        refresh:
            renderDrafts,

        initialize

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})(); 
