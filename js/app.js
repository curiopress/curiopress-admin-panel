/* =====================================================
   CURIOPRESS ADMIN APP CONTROLLER
   Main controller for the admin panel
===================================================== */

(function () {

    "use strict";


    /* =================================================
       STATE
    ================================================= */

    let currentPath = "";

    let currentFile = null;


    /* =================================================
       ELEMENTS
    ================================================= */

    const fileList =
        document.getElementById("fileList");

    const globalSearch =
        document.getElementById("globalSearch");


    /* =================================================
       LOAD REPOSITORY
    ================================================= */

    async function loadRepository() {

        try {

            const data =
                await CurioPressAPI.getRepository();


            if (
                data.success &&
                data.repository
            ) {

                CurioPressUI.showToast(
                    `Connected to ${data.repository.full_name}`
                );

            }


            await loadFiles(
                currentPath
            );


            updateRepositoryStats();


        } catch (error) {

            CurioPressUI.showToast(
                CurioPressAPI.getApiErrorMessage(
                    error
                )
            );

        }

    }


    /* =================================================
       LOAD FILES
    ================================================= */

    async function loadFiles(
        path = ""
    ) {

        if (!fileList) {

            return;

        }


        fileList.innerHTML =
            CurioPressUI.loading(
                "Loading repository..."
            );


        try {

            const data =
                await CurioPressAPI.getFiles(
                    path
                );


            currentPath =
                path;


            if (
                !data.files ||
                !data.files.length
            ) {

                fileList.innerHTML =
                    CurioPressUI.emptyState(
                        "No files found."
                    );

                return;

            }


            fileList.innerHTML =
                "";


            /* =========================================
               PARENT DIRECTORY
            ========================================= */

            if (path) {

                const parent =
                    path
                        .split("/")
                        .slice(
                            0,
                            -1
                        )
                        .join("/");


                const back =
                    document.createElement(
                        "div"
                    );


                back.className =
                    "file";


                back.style.cursor =
                    "pointer";


                back.innerHTML = `

                    <div class="file-info">

                        <div class="file-icon">
                            ↑
                        </div>

                        <div class="file-name">

                            <strong>
                                ..
                            </strong>

                            <span>
                                Parent folder
                            </span>

                        </div>

                    </div>

                `;


                back.addEventListener(
                    "click",
                    function () {

                        loadFiles(
                            parent
                        );

                    }
                );


                fileList.appendChild(
                    back
                );

            }


            /* =========================================
               FILES
            ========================================= */

            data.files.forEach(
                function (item) {

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "file";


                    const isDirectory =
                        item.type ===
                        "dir";


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
                                    ${CurioPressUI.escapeHtml(
                                        item.name
                                    )}
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

                            <button
                                class="mini-button"
                                data-deploy
                            >
                                Deploy
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

                    const deploy =
                        row.querySelector(
                            "[data-deploy]"
                        );


                    /* =====================================
                       DIRECTORY
                    ===================================== */

                    if (isDirectory) {

                        edit.disabled =
                            true;

                        preview.disabled =
                            true;

                        commit.disabled =
                            true;

                        deploy.disabled =
                            true;


                        open.addEventListener(
                            "click",
                            function () {

                                loadFiles(
                                    item.path
                                );

                            }
                        );


                    } else {


                        /* =================================
                           OPEN
                        ================================= */

                        open.addEventListener(
                            "click",
                            function () {

                                openFile(
                                    item.path,
                                    "open"
                                );

                            }
                        );


                        /* =================================
                           EDIT
                        ================================= */

                        edit.addEventListener(
                            "click",
                            function () {

                                openFile(
                                    item.path,
                                    "edit"
                                );

                            }
                        );


                        /* =================================
                           PREVIEW
                        ================================= */

                        preview.addEventListener(
                            "click",
                            function () {

                                previewFile(
                                    item.path
                                );

                            }
                        );


                        /* =================================
                           COMMIT
                        ================================= */

                        commit.addEventListener(
                            "click",
                            function () {

                                openFile(
                                    item.path,
                                    "edit"
                                );

                            }
                        );


                        /* =================================
                           DEPLOY
                        ================================= */

                        deploy.addEventListener(
                            "click",
                            function () {

                                CurioPressUI.showToast(
                                    "Deploy will use the approved GitHub workflow."
                                );

                            }
                        );

                    }


                    fileList.appendChild(
                        row
                    );

                }
            );


        } catch (error) {

            fileList.innerHTML =
                CurioPressUI.errorState(
                    CurioPressAPI.getApiErrorMessage(
                        error
                    )
                );

        }

    }


    /* =================================================
       OPEN FILE
    ================================================= */

    async function openFile(
        path,
        mode = "open"
    ) {

        try {

            const data =
                await CurioPressAPI.getFile(
                    path
                );


            currentFile =
                data.file;


            showFileModal(
                data.file,
                mode
            );


        } catch (error) {

            CurioPressUI.showToast(
                CurioPressAPI.getApiErrorMessage(
                    error
                )
            );

        }

    }


    /* =================================================
       FILE MODAL
    ================================================= */

    function showFileModal(
        file,
        mode
    ) {

        const existing =
            document.getElementById(
                "fileModal"
            );


        if (existing) {

            existing.remove();

        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "fileModal";


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


        const editorMode =
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
                            ${CurioPressUI.escapeHtml(
                                file.name
                            )}
                        </strong>

                        <div style="
                            margin-top:4px;
                            color:#8995a8;
                            font-size:11px;
                        ">
                            ${CurioPressUI.escapeHtml(
                                file.path
                            )}
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
                            id="modalEdit"
                        >
                            Edit
                        </button>

                        <button
                            class="mini-button"
                            id="modalPreview"
                        >
                            Preview
                        </button>

                        <button
                            class="mini-button"
                            id="modalCommit"
                        >
                            Commit
                        </button>

                        <button
                            class="mini-button"
                            id="modalDeploy"
                        >
                            Deploy
                        </button>

                        <button
                            class="mini-button"
                            id="modalClose"
                        >
                            Close
                        </button>

                    </div>

                </div>


                <textarea
                    id="fileEditor"
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
                    ${editorMode ? "" : "readonly"}
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
                        ${CurioPressUI.escapeHtml(
                            file.sha || "—"
                        )}
                    </span>

                    <button
                        class="button button-primary"
                        id="saveFileButton"
                    >
                        Save Changes
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        const editor =
            modal.querySelector(
                "#fileEditor"
            );


        editor.value =
            file.content || "";


        /* =============================================
           CLOSE
        ============================================= */

        modal.querySelector(
            "#modalClose"
        ).addEventListener(
            "click",
            function () {

                modal.remove();

            }
        );


        /* =============================================
           EDIT
        ============================================= */

        modal.querySelector(
            "#modalEdit"
        ).addEventListener(
            "click",
            function () {

                editor.removeAttribute(
                    "readonly"
                );

                editor.focus();

                CurioPressUI.showToast(
                    "Edit mode enabled."
                );

            }
        );


        /* =============================================
           PREVIEW
        ============================================= */

        modal.querySelector(
            "#modalPreview"
        ).addEventListener(
            "click",
            function () {

                previewContent(
                    file.name,
                    editor.value
                );

            }
        );


        /* =============================================
           COMMIT
        ============================================= */

        modal.querySelector(
            "#modalCommit"
        ).addEventListener(
            "click",
            async function () {

                await saveFile(
                    file,
                    editor.value,
                    modal
                );

            }
        );


        /* =============================================
           DEPLOY
        ============================================= */

        modal.querySelector(
            "#modalDeploy"
        ).addEventListener(
            "click",
            function () {

                CurioPressUI.showToast(
                    "Deploy will use the approved GitHub workflow."
                );

            }
        );


        /* =============================================
           SAVE
        ============================================= */

        modal.querySelector(
            "#saveFileButton"
        ).addEventListener(
            "click",
            async function () {

                await saveFile(
                    file,
                    editor.value,
                    modal
                );

            }
        );

    }


    /* =================================================
       SAVE FILE
    ================================================= */

    async function saveFile(
        file,
        content,
        modal
    ) {

        const confirmed =
            CurioPressUI.confirmAction(
                `Commit changes to ${file.path}?`
            );


        if (!confirmed) {

            return;

        }


        try {

            CurioPressUI.showToast(
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

                CurioPressUI.showToast(
                    "Changes committed successfully."
                );


                modal.remove();


                await loadFiles(
                    currentPath
                );

            }


        } catch (error) {

            CurioPressUI.showToast(
                `Commit failed: ${
                    CurioPressAPI.getApiErrorMessage(
                        error
                    )
                }`
            );

        }

    }


    /* =================================================
       PREVIEW FILE
    ================================================= */

    async function previewFile(
        path
    ) {

        try {

            const data =
                await CurioPressAPI.getFile(
                    path
                );


            previewContent(
                data.file.name,
                data.file.content
            );


        } catch (error) {

            CurioPressUI.showToast(
                CurioPressAPI.getApiErrorMessage(
                    error
                )
            );

        }

    }


    /* =================================================
       HTML PREVIEW
    ================================================= */

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

                CurioPressUI.showToast(
                    "Allow pop-ups to preview this file."
                );

                return;

            }


            preview.document.open();

            preview.document.write(
                content
            );

            preview.document.close();

            return;

        }


        CurioPressUI.showToast(
            "Visual preview is currently available for HTML files."
        );

    }


    /* =================================================
       SEARCH
    ================================================= */

    async function searchRepository(
        query
    ) {

        if (!query) {

            return;

        }


        try {

            const data =
                await CurioPressAPI.searchRepository(
                    query
                );


            CurioPressUI.showToast(
                `${data.total_count || 0} result(s) found for "${query}".`
            );


        } catch (error) {

            CurioPressUI.showToast(
                CurioPressAPI.getApiErrorMessage(
                    error
                )
            );

        }

    }


    /* =================================================
       REPOSITORY STATS
    ================================================= */

    async function updateRepositoryStats() {

        try {

            const data =
                await CurioPressAPI.getFiles(
                    ""
                );


            const files =
                data.files || [];


            const totalFiles =
                document.getElementById(
                    "totalFiles"
                );


            if (totalFiles) {

                totalFiles.textContent =
                    files.length;

            }


        } catch {

            /* Stats are optional. */

        }

    }


    /* =================================================
       NAVIGATION
    ================================================= */

    function handleNavigation(
        page,
        label
    ) {

        CurioPressUI.setActiveNav(
            page
        );


        if (page === "repository") {

            loadFiles();

            return;

        }


        CurioPressUI.showToast(
            `${label} module will be connected in the next phase.`
        );

    }


    document
        .querySelectorAll(
            ".nav-item[data-page]"
        )
        .forEach(
            function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        handleNavigation(
                            item.dataset.page,
                            item.textContent.trim()
                        );

                    }
                );

            }
        );


    /* =================================================
       QUICK ACTIONS
    ================================================= */

    document
        .querySelectorAll(
            ".quick[data-action]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const action =
                            button.dataset.action;


                        if (
                            action ===
                            "repository"
                        ) {

                            loadFiles();

                            return;

                        }


                        CurioPressUI.showToast(
                            `${action} module will be connected in the next phase.`
                        );

                    }
                );

            }
        );


    /* =================================================
       LOAD REPOSITORY BUTTON
    ================================================= */

    const loadRepositoryButton =
        document.getElementById(
            "loadRepository"
        );


    if (loadRepositoryButton) {

        loadRepositoryButton.addEventListener(
            "click",
            loadRepository
        );

    }


    /* =================================================
       LOAD FILES BUTTON
    ================================================= */

    const loadFilesButton =
        document.getElementById(
            "loadFiles"
        );


    if (loadFilesButton) {

        loadFilesButton.addEventListener(
            "click",
            function () {

                loadFiles(
                    currentPath
                );

            }
        );

    }


    /* =================================================
       GLOBAL SEARCH
    ================================================= */

    if (globalSearch) {

        globalSearch.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Enter"
                ) {

                    return;

                }


                const query =
                    globalSearch.value.trim();


                searchRepository(
                    query
                );

            }
        );

    }


    /* =================================================
       EDIT BUTTON
    ================================================= */

    const editButton =
        document.getElementById(
            "editButton"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            function () {

                if (currentFile) {

                    openFile(
                        currentFile.path,
                        "edit"
                    );

                } else {

                    CurioPressUI.showToast(
                        "Open a file first."
                    );

                }

            }
        );

    }


    /* =================================================
       PREVIEW BUTTON
    ================================================= */

    const previewButton =
        document.getElementById(
            "previewButton"
        );


    if (previewButton) {

        previewButton.addEventListener(
            "click",
            function () {

                if (currentFile) {

                    previewFile(
                        currentFile.path
                    );

                } else {

                    CurioPressUI.showToast(
                        "Open a file first."
                    );

                }

            }
        );

    }


    /* =================================================
       COMMIT BUTTON
    ================================================= */

    const commitButton =
        document.getElementById(
            "commitButton"
        );


    if (commitButton) {

        commitButton.addEventListener(
            "click",
            function () {

                if (currentFile) {

                    openFile(
                        currentFile.path,
                        "edit"
                    );

                } else {

                    CurioPressUI.showToast(
                        "Open a file first."
                    );

                }

            }
        );

    }


    /* =================================================
       DEPLOY BUTTON
    ================================================= */

    const deployButton =
        document.getElementById(
            "deployButton"
        );


    if (deployButton) {

        deployButton.addEventListener(
            "click",
            function () {

                CurioPressUI.showToast(
                    "Deploy will use the approved GitHub workflow."
                );

            }
        );

    }


    /* =================================================
       HEALTH BUTTON
    ================================================= */

    const healthButton =
        document.getElementById(
            "healthButton"
        );


    if (healthButton) {

        healthButton.addEventListener(
            "click",
            async function () {

                const button =
                    healthButton;


                CurioPressUI.setButtonLoading(
                    button,
                    true,
                    "Checking..."
                );


                try {

                    const result =
                        await CurioPressAPI.checkApiStatus();


                    if (result.online) {

                        CurioPressUI.showToast(
                            "Admin API is online."
                        );

                    } else {

                        CurioPressUI.showToast(
                            "Admin API is offline."
                        );

                    }

                } finally {

                    CurioPressUI.setButtonLoading(
                        button,
                        false
                    );

                }

            }
        );

    }


    /* =================================================
       REFRESH BUTTON
    ================================================= */

    const refreshButton =
        document.getElementById(
            "refreshButton"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async function () {

                await loadRepository();

                CurioPressUI.showToast(
                    "Repository refreshed."
                );

            }
        );

    }


    /* =================================================
       PUBLIC FUNCTIONS
    ================================================= */

    window.loadRepository =
        loadRepository;


    window.loadFiles =
        loadFiles;


    window.openFile =
        openFile;


    window.previewFile =
        previewFile;


    window.saveFile =
        saveFile;


    window.CurioPressApp = {

        loadRepository,

        loadFiles,

        openFile,

        previewFile,

        searchRepository,

        getCurrentPath:
            function () {

                return currentPath;

            },

        getCurrentFile:
            function () {

                return currentFile;

            }

    };


})();
