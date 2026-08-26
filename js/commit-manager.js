/* =====================================================
   CURIOPRESS COMMIT MANAGER
   js/commit-manager.js
===================================================== */

(function () {

    "use strict";

    const API_URL =
        "https://curiopress-admin-api.curiopress31.workers.dev";

    const STORAGE_KEY =
        "curiopress_commit_manager";

    let commits = [];
    let settings = {
        repository: "curiopress/curiopress.github.io",
        branch: "main"
    };


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
                "commitManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement("div");


        box.id =
            "commitManagerMessage";


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
            3000
        );

    }


    function getAdminKey() {

        return sessionStorage.getItem(
            "curiopress_admin_key"
        );

    }


    function getHeaders() {

        const key =
            getAdminKey();


        if (!key) {

            throw new Error(
                "Admin session is missing. Please login again."
            );

        }


        return {
            "Authorization":
                `Bearer ${key}`,
            "Accept":
                "application/json",
            "Content-Type":
                "application/json"
        };

    }


    async function apiRequest(
        endpoint,
        options = {}
    ) {

        let response;


        try {

            response =
                await fetch(
                    `${API_URL}${endpoint}`,
                    {
                        ...options,
                        headers: {
                            ...getHeaders(),
                            ...(options.headers || {})
                        },
                        cache: "no-store"
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
       STORAGE
    ===================================================== */

    function loadSettings() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (saved) {

                const data =
                    JSON.parse(saved);


                if (
                    data &&
                    typeof data === "object"
                ) {

                    settings = {
                        ...settings,
                        ...data
                    };

                }

            }

        } catch {

            settings = {
                repository:
                    "curiopress/curiopress.github.io",

                branch:
                    "main"
            };

        }

    }


    function saveSettings() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(settings)
        );

    }


    /* =====================================================
       LOAD COMMITS
    ===================================================== */

    async function loadCommits() {

        const container =
            document.getElementById(
                "commitList"
            );


        if (!container) return;


        container.innerHTML = `
            <div style="
                padding:35px;
                text-align:center;
                color:#8995a8;
                font-size:12px;
            ">
                Loading commit history...
            </div>
        `;


        try {

            const data =
                await apiRequest(
                    `/api/commits?branch=${encodeURIComponent(settings.branch)}`
                );


            commits =
                Array.isArray(data.commits)
                    ? data.commits
                    : Array.isArray(data)
                        ? data
                        : [];


            renderCommits();

            updateStats();


        } catch (error) {

            container.innerHTML = `
                <div style="
                    padding:35px;
                    text-align:center;
                    color:#fb7185;
                    font-size:12px;
                    line-height:1.6;
                ">
                    ${escapeHtml(error.message)}
                </div>
            `;

        }

    }


    /* =====================================================
       RENDER COMMITS
    ===================================================== */

    function renderCommits(
        query = ""
    ) {

        const container =
            document.getElementById(
                "commitList"
            );


        if (!container) return;


        const clean =
            String(query || "")
                .toLowerCase()
                .trim();


        const filtered =
            commits.filter(
                commit => {

                    const message =
                        commit.message ||
                        commit.commit?.message ||
                        "";


                    const author =
                        commit.author?.name ||
                        commit.commit?.author?.name ||
                        commit.author_name ||
                        "";


                    const sha =
                        commit.sha ||
                        "";


                    return (
                        !clean ||
                        message
                            .toLowerCase()
                            .includes(clean) ||
                        author
                            .toLowerCase()
                            .includes(clean) ||
                        sha
                            .toLowerCase()
                            .includes(clean)
                    );

                }
            );


        if (!filtered.length) {

            container.innerHTML = `
                <div style="
                    padding:35px;
                    text-align:center;
                    color:#8995a8;
                    font-size:12px;
                ">
                    No commits found.
                </div>
            `;

            return;

        }


        container.innerHTML =
            filtered
                .map(
                    commit => {

                        const message =
                            commit.message ||
                            commit.commit?.message ||
                            "No commit message";


                        const author =
                            commit.author?.name ||
                            commit.commit?.author?.name ||
                            commit.author_name ||
                            "Unknown";


                        const date =
                            commit.date ||
                            commit.commit?.author?.date ||
                            commit.commit?.committer?.date ||
                            "";


                        const sha =
                            commit.sha ||
                            "";


                        const shortSha =
                            sha
                                ? sha.substring(0, 7)
                                : "—";


                        return `

                            <div
                                data-commit-row
                                style="
                                    padding:16px 8px;
                                    border-bottom:
                                        1px solid rgba(255,255,255,.05);
                                "
                            >

                                <div style="
                                    display:flex;
                                    align-items:flex-start;
                                    justify-content:space-between;
                                    gap:15px;
                                ">

                                    <div style="
                                        min-width:0;
                                        flex:1;
                                    ">

                                        <strong style="
                                            display:block;
                                            color:#f5f7fb;
                                            font-size:13px;
                                            line-height:1.5;
                                        ">
                                            ${escapeHtml(message)}
                                        </strong>


                                        <div style="
                                            display:flex;
                                            gap:10px;
                                            flex-wrap:wrap;
                                            margin-top:6px;
                                            color:#8995a8;
                                            font-size:10px;
                                        ">

                                            <span>
                                                ${escapeHtml(author)}
                                            </span>

                                            <span>
                                                ${escapeHtml(
                                                    formatDate(date)
                                                )}
                                            </span>

                                            <span style="
                                                color:#38bdf8;
                                                font-family:monospace;
                                            ">
                                                ${escapeHtml(shortSha)}
                                            </span>

                                        </div>

                                    </div>


                                    <button
                                        class="mini-button"
                                        data-view-commit="${escapeHtml(sha)}"
                                    >
                                        View
                                    </button>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        container
            .querySelectorAll(
                "[data-view-commit]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () =>
                            viewCommit(
                                button.dataset.viewCommit
                            )
                    );

                }
            );

    }


    function formatDate(value) {

        if (!value) return "Unknown date";


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
       VIEW COMMIT
    ===================================================== */

    async function viewCommit(
        sha
    ) {

        if (!sha) {

            showMessage(
                "Commit SHA is unavailable.",
                "error"
            );

            return;

        }


        try {

            const data =
                await apiRequest(
                    `/api/commit?sha=${encodeURIComponent(sha)}`
                );


            showCommitModal(
                data.commit || data
            );


        } catch (error) {

            showMessage(
                error.message,
                "error"
            );

        }

    }


    function showCommitModal(
        commit
    ) {

        const old =
            document.getElementById(
                "commitDetailModal"
            );


        if (old) old.remove();


        const modal =
            document.createElement("div");


        modal.id =
            "commitDetailModal";


        const message =
            commit.message ||
            commit.commit?.message ||
            "No commit message";


        const author =
            commit.author?.name ||
            commit.commit?.author?.name ||
            "Unknown";


        const date =
            commit.date ||
            commit.commit?.author?.date ||
            commit.commit?.committer?.date ||
            "";


        const sha =
            commit.sha ||
            "";


        const files =
            Array.isArray(commit.files)
                ? commit.files
                : [];


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:99998;
            background:rgba(0,0,0,.8);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        `;


        modal.innerHTML = `

            <div style="
                width:min(900px,100%);
                max-height:85vh;
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
                    align-items:flex-start;
                    justify-content:space-between;
                    gap:15px;
                    padding:18px;
                    border-bottom:1px solid rgba(255,255,255,.08);
                ">

                    <div>

                        <strong style="
                            display:block;
                            font-size:15px;
                        ">
                            Commit Details
                        </strong>

                        <span style="
                            display:block;
                            margin-top:6px;
                            color:#8995a8;
                            font-size:10px;
                        ">
                            ${escapeHtml(
                                sha
                            )}
                        </span>

                    </div>


                    <button
                        class="mini-button"
                        id="closeCommitModal"
                    >
                        Close
                    </button>

                </div>


                <div style="
                    overflow:auto;
                    padding:20px;
                ">

                    <div style="
                        padding:17px;
                        border-radius:14px;
                        background:#101927;
                        margin-bottom:18px;
                    ">

                        <strong style="
                            display:block;
                            font-size:14px;
                            line-height:1.5;
                        ">
                            ${escapeHtml(message)}
                        </strong>


                        <div style="
                            margin-top:9px;
                            color:#8995a8;
                            font-size:10px;
                        ">
                            Author:
                            ${escapeHtml(author)}
                        </div>


                        <div style="
                            margin-top:5px;
                            color:#8995a8;
                            font-size:10px;
                        ">
                            Date:
                            ${escapeHtml(
                                formatDate(date)
                            )}
                        </div>

                    </div>


                    <h3 style="
                        margin:0 0 12px;
                        font-size:13px;
                    ">
                        Changed Files
                    </h3>


                    ${
                        files.length
                            ? files
                                .map(
                                    file => `
                                        <div style="
                                            padding:11px;
                                            border-bottom:
                                                1px solid rgba(255,255,255,.05);
                                            font-family:monospace;
                                            font-size:10px;
                                            color:#b7c2d3;
                                        ">
                                            ${escapeHtml(
                                                file.filename ||
                                                file.path ||
                                                file.name ||
                                                "Unknown file"
                                            )}
                                        </div>
                                    `
                                )
                                .join("")
                            : `
                                <div style="
                                    padding:20px;
                                    text-align:center;
                                    color:#8995a8;
                                    font-size:11px;
                                ">
                                    File details were not returned by the API.
                                </div>
                            `
                    }

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        modal
            .querySelector(
                "#closeCommitModal"
            )
            .addEventListener(
                "click",
                () => modal.remove()
            );


        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    modal.remove();

                }

            }
        );

    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        const total =
            document.getElementById(
                "commitTotal"
            );


        const latest =
            document.getElementById(
                "commitLatest"
            );


        const branch =
            document.getElementById(
                "commitBranch"
            );


        const repository =
            document.getElementById(
                "commitRepository"
            );


        if (total) {

            total.textContent =
                commits.length;

        }


        if (latest) {

            latest.textContent =
                commits.length
                    ? formatDate(
                        commits[0].date ||
                        commits[0].commit?.author?.date
                    )
                    : "—";

        }


        if (branch) {

            branch.textContent =
                settings.branch;

        }


        if (repository) {

            repository.textContent =
                settings.repository;

        }

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function setupSearch() {

        const input =
            document.getElementById(
                "commitSearch"
            );


        if (!input) return;


        input.addEventListener(
            "input",
            event =>
                renderCommits(
                    event.target.value
                )
        );

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "commitManagerPanel"
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
            document.createElement("section");


        panel.id =
            "commitManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Commit History
                    </h2>

                    <span>
                        GitHub repository commit activity
                    </span>

                </div>


                <button
                    class="button button-primary"
                    id="commitRefresh"
                >
                    Refresh Commits
                </button>

            </div>


            <!-- STATS -->

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(4,minmax(0,1fr));
                gap:10px;
                margin-bottom:18px;
            ">

                <div class="stat-card">

                    <small>
                        Loaded Commits
                    </small>

                    <strong id="commitTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Latest Commit
                    </small>

                    <strong
                        id="commitLatest"
                        style="
                            font-size:13px;
                            line-height:1.5;
                        "
                    >
                        —
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Branch
                    </small>

                    <strong
                        id="commitBranch"
                        style="
                            font-size:15px;
                        "
                    >
                        main
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Repository
                    </small>

                    <strong
                        id="commitRepository"
                        style="
                            font-size:11px;
                            line-height:1.5;
                            word-break:break-word;
                        "
                    >
                        curiopress/curiopress.github.io
                    </strong>

                </div>

            </div>


            <!-- SEARCH -->

            <div style="
                display:flex;
                gap:9px;
                margin-bottom:15px;
                flex-wrap:wrap;
            ">

                <input
                    id="commitSearch"
                    type="search"
                    placeholder="Search commits, authors or SHA..."
                    style="
                        flex:1;
                        min-width:220px;
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


            <!-- COMMIT LIST -->

            <div style="
                border:1px solid var(--border);
                border-radius:15px;
                overflow:hidden;
                background:#0d1522;
            ">

                <div style="
                    padding:12px;
                    border-bottom:
                        1px solid rgba(255,255,255,.07);
                    color:#596579;
                    font-size:10px;
                    font-weight:900;
                    text-transform:uppercase;
                    letter-spacing:.8px;
                ">
                    Repository Activity
                </div>


                <div id="commitList">

                    <div style="
                        padding:35px;
                        text-align:center;
                        color:#8995a8;
                        font-size:12px;
                    ">
                        Click Refresh Commits to load history.
                    </div>

                </div>

            </div>


            <div style="
                margin-top:15px;
                padding:14px 16px;
                border-radius:13px;
                background:rgba(56,189,248,.05);
                border:1px solid rgba(56,189,248,.12);
                color:#93c5fd;
                font-size:10px;
                line-height:1.6;
            ">

                Commit history uses the authenticated
                CurioPress Admin Worker. No fake commit
                records are created when the API is unavailable.

            </div>

        `;


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "commitRefresh"
            )
            .addEventListener(
                "click",
                loadCommits
            );


        setupSearch();

        updateStats();

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                '.nav-item[data-page="commits"]'
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
                                            "commitManagerPanel"
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

                }
            );

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.CurioPressCommitManager = {

        refresh:
            loadCommits,

        view:
            viewCommit,

        getCommits:
            () => [...commits],

        getSettings:
            () => ({
                ...settings
            })

    };


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        loadSettings();

        createPanel();

        setupNavigation();

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

})();
