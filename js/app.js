(() => {

    "use strict";


    /* =====================================================
       CURIOPRESS ADMIN APP
    ===================================================== */


    let currentPath = "";
    let currentFile = null;


    /* =====================================================
       HELPERS
    ===================================================== */

    function $id(id) {

        return document.getElementById(id);

    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function showToast(message) {

        const toast = $id("toast");

        if (!toast) {

            return;

        }


        toast.textContent = message;

        toast.classList.add("show");


        clearTimeout(
            window.__curioPressToastTimer
        );


        window.__curioPressToastTimer =
            setTimeout(() => {

                toast.classList.remove("show");

            }, 2800);

    }


    /* =====================================================
       LOAD REPOSITORY
    ===================================================== */

    async function loadRepository() {

        try {

            const data =
                await CurioPressAPI.getRepository();


            if (
                data.success &&
                data.repository
            ) {

                showToast(
                    `Connected to ${data.repository.full_name}`
                );

            }


            await loadFiles("");

            await loadCommits();


        } catch (error) {

            showToast(
                error.message ||
                "Unable to connect to repository."
            );

        }

    }


    /* =====================================================
       LOAD FILES
    ===================================================== */

    async function loadFiles(path = "") {

        const fileList =
            $id("fileList");


        if (!fileList) {

            return;

        }


        fileList.innerHTML = `
            <div style="
                padding:30px;
                text-align:center;
                color:#8995a8;
            ">
                Loading repository...
            </div>
        `;


        try {

            const data =
                await CurioPressAPI.getFiles(path);


            currentPath = path;


            if (
                !data.files ||
                !data.files.length
            ) {

                fileList.innerHTML = `
                    <div style="
                        padding:30px;
                        text-align:center;
                        color:#8995a8;
                    ">
                        No files found.
                    </div>
                `;

                updateFileCount(0);

                return;

            }


            fileList.innerHTML = "";


            if (path) {

                const parent =
                    path
                        .split("/")
                        .slice(0, -1)
                        .join("/");


                const back =
                    document.createElement("div");


                back.className = "file";

                back.style.cursor = "pointer";


                back.innerHTML = `
                    <div class="file-info">

                        <div class="file-icon">
                            ↑
                        </div>

                        <div class="file-name">

                            <strong>..</strong>

                            <span>
                                Parent folder
                            </span>

                        </div>

                    </div>
                `;


                back.addEventListener(
                    "click",
                    () => loadFiles(parent)
                );


                fileList.appendChild(back);

            }


            let filesCount = 0;


            data.files.forEach(item => {

                filesCount++;


                const row =
                    document.createElement("div");


                row.className = "file";


                const isDirectory =
                    item.type === "dir";


                const icon =
                    isDirectory
                        ? "▱"
                        : "◇";


                row.innerHTML = `

                    <div class="file-info">

                        <div class="file-icon">
                            ${icon}
                        </div>

                        <div class="file-name">

                            <strong>
                                ${escapeHtml(item.name)}
                            </strong>

                            <span>
                                ${
                                    isDirectory
                                        ? "Folder"
                                        : `${item.size || 0} bytes`
                                }
                            </span>

                        </div>

                    </div>


                    <div class="file-actions">

                        <button
                            class="mini-button"
                            data-open
                        >
                            Open
                        </button>

                        <button
                            class="mini-button"
                            data-edit
                        >
                            Edit
                        </button>

                        <button
                            class="mini-button"
                            data-preview
                        >
                            Preview
                        </button>

                        <button
                            class="mini-button"
                            data-commit
                        >
                            Commit
                        </button>

                    </div>

                `;


                const open =
                    row.querySelector(
                        "[data-open]"
                    );


                const edit =
                    row.querySelector(
                        "[data-edit]"
                    );


                const preview =
                    row.querySelector(
                        "[data-preview]"
                    );


                const commit =
                    row.querySelector(
                        "[data-commit]"
                    );


                if (isDirectory) {

                    edit.disabled = true;

                    preview.disabled = true;

                    commit.disabled = true;


                    open.addEventListener(
                        "click",
                        () => loadFiles(item.path)
                    );


                } else {

                    open.addEventListener(
                        "click",
                        () =>
                            openFile(
                                item.path,
                                "open"
                            )
                    );


                    edit.addEventListener(
                        "click",
                        () =>
                            openFile(
                                item.path,
                                "edit"
                            )
                    );


                    preview.addEventListener(
                        "click",
                        () =>
                            previewFile(item.path)
                    );


                    commit.addEventListener(
                        "click",
                        () =>
                            openFile(
                                item.path,
                                "edit"
                            )
                    );

                }


                fileList.appendChild(row);

            });


            updateFileCount(filesCount);


        } catch (error) {

            fileList.innerHTML = `
                <div style="
                    padding:30px;
                    text-align:center;
                    color:#fb7185;
                ">
                    ${escapeHtml(error.message)}
                </div>
            `;

        }

    }


    function updateFileCount(count) {

        const element =
            $id("totalFiles");


        if (element) {

            element.textContent = count;

        }

    }


    /* =====================================================
       OPEN FILE
    ===================================================== */

    async function openFile(
        path,
        mode = "open"
    ) {

        try {

            const data =
                await CurioPressAPI.getFile(path);


            if (
                !data.success ||
                !data.file
            ) {

                throw new Error(
                    "File could not be loaded."
                );

            }


            currentFile =
                data.file;


            showFileEditor(
                data.file,
                mode
            );


        } catch (error) {

            showToast(
                error.message
            );

        }

    }


    /* =====================================================
       FILE EDITOR
    ===================================================== */

    function showFileEditor(
        file,
        mode
    ) {

        const old =
            $id("fileModal");


        if (old) {

            old.remove();

        }


        const modal =
            document.createElement("div");


        modal.id = "fileModal";


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:500;
            background:rgba(0,0,0,.78);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        `;


        const editable =
            mode === "edit";


        modal.innerHTML = `

            <div style="
                width:min(1100px,100%);
                height:min(85vh,850px);
                display:flex;
                flex-direction:column;
                background:#0d1522;
                border:1px solid rgba(255,255,255,.1);
                border-radius:20px;
                overflow:hidden;
                box-shadow:0 30px 100px rgba(0,0,0,.6);
            ">


                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;
                    padding:15px 18px;
                    border-bottom:1px solid rgba(255,255,255,.08);
                ">

                    <div>

                        <strong>
                            ${escapeHtml(file.name)}
                        </strong>

                        <div style="
                            margin-top:4px;
                            color:#8995a8;
                            font-size:11px;
                        ">
                            ${escapeHtml(file.path)}
                        </div>

                    </div>


                    <div style="
                        display:flex;
                        gap:7px;
                        flex-wrap:wrap;
                        justify-content:flex-end;
                    ">

                        <button
                            class="mini-button"
                            data-modal-edit
                        >
                            Edit
                        </button>

                        <button
                            class="mini-button"
                            data-modal-preview
                        >
                            Preview
                        </button>

                        <button
                            class="mini-button"
                            data-modal-save
                        >
                            Commit
                        </button>

                        <button
                            class="mini-button"
                            data-modal-close
                        >
                            Close
                        </button>

                    </div>

                </div>


                <textarea
                    data-file-editor
                    spellcheck="false"
                    style="
                        flex:1;
                        width:100%;
                        resize:none;
                        border:0;
                        outline:0;
                        padding:20px;
                        background:#080e18;
                        color:#d9e3f0;
                        font-family:
                            ui-monospace,
                            SFMono-Regular,
                            Menlo,
                            Consolas,
                            monospace;
                        font-size:13px;
                        line-height:1.65;
                    "
                    ${editable ? "" : "readonly"}
                ></textarea>


                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:10px;
                    padding:12px 18px;
                    border-top:1px solid rgba(255,255,255,.08);
                    color:#8995a8;
                    font-size:11px;
                ">

                    <span>
                        SHA:
                        ${escapeHtml(file.sha || "—")}
                    </span>

                    <button
                        class="button button-primary"
                        data-save-file
                    >
                        Save Changes
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(modal);


        const editor =
            modal.querySelector(
                "[data-file-editor]"
            );


        editor.value =
            file.content || "";


        modal
            .querySelector("[data-modal-close]")
            .addEventListener(
                "click",
                () => modal.remove()
            );


        modal
            .querySelector("[data-modal-edit]")
            .addEventListener(
                "click",
                () => {

                    editor.removeAttribute(
                        "readonly"
                    );

                    editor.focus();

                    showToast(
                        "Edit mode enabled."
                    );

                }
            );


        modal
            .querySelector("[data-modal-preview]")
            .addEventListener(
                "click",
                () => {

                    previewContent(
                        file.name,
                        editor.value
                    );

                }
            );


        modal
            .querySelector("[data-modal-save]")
            .addEventListener(
                "click",
                () =>
                    saveFile(
                        file,
                        editor.value,
                        modal
                    )
            );


        modal
            .querySelector("[data-save-file]")
            .addEventListener(
                "click",
                () =>
                    saveFile(
                        file,
                        editor.value,
                        modal
                    )
            );

    }


    /* =====================================================
       SAVE FILE
    ===================================================== */

    async function saveFile(
        file,
        content,
        modal
    ) {

        const confirmed =
            window.confirm(
                `Commit changes to ${file.path}?`
            );


        if (!confirmed) {

            return;

        }


        try {

            showToast(
                "Committing changes..."
            );


            const data =
                await CurioPressAPI.updateFile(
                    file.path,
                    content,
                    file.sha,
                    `Update ${file.path}`
                );


            if (data.success) {

                showToast(
                    "Changes committed successfully."
                );


                modal.remove();


                currentFile = null;


                await loadFiles(
                    currentPath
                );


                await loadCommits();

            }


        } catch (error) {

            showToast(
                `Commit failed: ${error.message}`
            );

        }

    }


    /* =====================================================
       PREVIEW
    ===================================================== */

    async function previewFile(path) {

        try {

            const data =
                await CurioPressAPI.getFile(path);


            previewContent(
                data.file.name,
                data.file.content
            );


        } catch (error) {

            showToast(
                error.message
            );

        }

    }


    function previewContent(
        filename,
        content
    ) {

        const extension =
            filename
                .split(".")
                .pop()
                .toLowerCase();


        if (
            extension === "html" ||
            extension === "htm"
        ) {

            const preview =
                window.open(
                    "",
                    "_blank"
                );


            if (!preview) {

                showToast(
                    "Allow pop-ups to preview this file."
                );

                return;

            }


            preview.document.open();

            preview.document.write(content);

            preview.document.close();


            return;

        }


        showToast(
            "Visual preview is currently available for HTML files."
        );

    }


    /* =====================================================
       COMMITS
    ===================================================== */

    async function loadCommits() {

        try {

            const data =
                await CurioPressAPI.getCommits();


            const container =
                $id("recentChanges");


            if (
                !container ||
                !data.commits
            ) {

                return;

            }


            container.innerHTML = "";


            data.commits
                .slice(0, 8)
                .forEach(commit => {

                    const item =
                        document.createElement("div");


                    item.className =
                        "change";


                    item.innerHTML = `

                        <div class="change-icon">
                            ✓
                        </div>

                        <div>

                            <strong>
                                ${escapeHtml(
                                    commit.message
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    commit.author
                                )}
                                ·
                                ${formatDate(
                                    commit.date
                                )}
                            </span>

                        </div>

                    `;


                    container.appendChild(item);

                });


        } catch (error) {

            console.error(
                "Commit history error:",
                error
            );

        }

    }


    function formatDate(value) {

        if (!value) {

            return "Unknown date";

        }


        try {

            return new Date(value)
                .toLocaleString();

        } catch {

            return value;

        }

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    async function searchRepository(
        query
    ) {

        if (!query) {

            return;

        }


        try {

            const data =
                await CurioPressAPI
                    .searchRepository(query);


            showToast(
                `${data.total_count || 0} result(s) found for "${query}".`
            );


        } catch (error) {

            showToast(
                error.message
            );

        }

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                ".nav-item[data-page]"
            )
            .forEach(item => {

                item.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".nav-item"
                            )
                            .forEach(nav =>
                                nav.classList.remove(
                                    "active"
                                )
                            );


                        item.classList.add(
                            "active"
                        );


                        const page =
                            item.dataset.page;


                        if (
                            page ===
                            "repository"
                        ) {

                            loadFiles(
                                currentPath
                            );

                        }

                        else if (
                            page ===
                            "commits"
                        ) {

                            loadCommits();

                        }

                        else {

                            showToast(
                                `${item.textContent.trim()} module will be connected in the next phase.`
                            );

                        }


                        const sidebar =
                            $id("sidebar");


                        if (sidebar) {

                            sidebar.classList.remove(
                                "open"
                            );

                        }

                    }
                );

            });

    }


    /* =====================================================
       QUICK ACTIONS
    ===================================================== */

    function setupQuickActions() {

        document
            .querySelectorAll(
                ".quick[data-action]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.action;


                        if (
                            action ===
                            "repository"
                        ) {

                            loadFiles(
                                currentPath
                            );

                        }

                        else if (
                            action ===
                            "health"
                        ) {

                            showToast(
                                "Health scan is ready for the next module."
                            );

                        }

                        else {

                            showToast(
                                `${action} module is ready for the next development phase.`
                            );

                        }

                    }
                );

            });

    }


    /* =====================================================
       GLOBAL SEARCH
    ===================================================== */

    function setupSearch() {

        const search =
            $id("globalSearch");


        if (!search) {

            return;

        }


        search.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !==
                    "Enter"
                ) {

                    return;

                }


                searchRepository(
                    search.value.trim()
                );

            }
        );

    }


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function setupMobileMenu() {

        const button =
            $id("mobileMenu");


        const sidebar =
            $id("sidebar");


        if (
            !button ||
            !sidebar
        ) {

            return;

        }


        button.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "open"
                );

            }
        );

    }


    /* =====================================================
       BUTTONS
    ===================================================== */

    function setupButtons() {

        const loadRepositoryButton =
            $id("loadRepository");


        if (loadRepositoryButton) {

            loadRepositoryButton.addEventListener(
                "click",
                loadRepository
            );

        }


        const loadFilesButton =
            $id("loadFiles");


        if (loadFilesButton) {

            loadFilesButton.addEventListener(
                "click",
                () =>
                    loadFiles(
                        currentPath
                    )
            );

        }


        const refreshButton =
            $id("refreshButton");


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                async () => {

                    await loadRepository();

                    showToast(
                        "Repository refreshed."
                    );

                }
            );

        }


        const healthButton =
            $id("healthButton");


        if (healthButton) {

            healthButton.addEventListener(
                "click",
                () => {

                    showToast(
                        "Health scan will be connected in the next module."
                    );

                }
            );

        }


        const editButton =
            $id("editButton");


        if (editButton) {

            editButton.addEventListener(
                "click",
                () => {

                    if (currentFile) {

                        openFile(
                            currentFile.path,
                            "edit"
                        );

                    } else {

                        showToast(
                            "Open a file first."
                        );

                    }

                }
            );

        }


        const previewButton =
            $id("previewButton");


        if (previewButton) {

            previewButton.addEventListener(
                "click",
                () => {

                    if (currentFile) {

                        previewFile(
                            currentFile.path
                        );

                    } else {

                        showToast(
                            "Open a file first."
                        );

                    }

                }
            );

        }


        const commitButton =
            $id("commitButton");


        if (commitButton) {

            commitButton.addEventListener(
                "click",
                () => {

                    if (currentFile) {

                        openFile(
                            currentFile.path,
                            "edit"
                        );

                    } else {

                        showToast(
                            "Open a file first."
                        );

                    }

                }
            );

        }


        const deployButton =
            $id("deployButton");


        if (deployButton) {

            deployButton.addEventListener(
                "click",
                () => {

                    showToast(
                        "Deployment workflow will be connected in the next module."
                    );

                }
            );

        }

    }


    /* =====================================================
       DASHBOARD INITIALIZATION
    ===================================================== */

    async function initializeApp() {

        setupNavigation();

        setupQuickActions();

        setupSearch();

        setupMobileMenu();

        setupButtons();


        const key =
            CurioPressAPI.getAdminKey();


        if (!key) {

            return;

        }


        try {

            const valid =
                await CurioPressAPI
                    .verifyAdminKey(key);


            if (!valid) {

                return;

            }


            await loadRepository();

        } catch (error) {

            console.error(
                "Admin initialization error:",
                error
            );

        }

    }


    /* =====================================================
       PUBLIC APP API
    ===================================================== */

    window.CurioPressApp = {

        loadRepository,

        loadFiles,

        openFile,

        previewFile,

        loadCommits,

        searchRepository,

        showToast

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
            initializeApp
        );

    } else {

        initializeApp();

    }

})();
