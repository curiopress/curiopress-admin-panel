/* =====================================================
   CURIOPRESS SEARCH MANAGER
   js/search-manager.js
===================================================== */

(function () {

    "use strict";

    const API_URL =
        "https://curiopress-admin-api.curiopress31.workers.dev";

    let results = [];
    let currentQuery = "";
    let currentPage = 1;
    const RESULTS_PER_PAGE = 20;


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
                "searchManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement("div");


        box.id =
            "searchManagerMessage";


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


    async function apiRequest(
        endpoint
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
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${key}`,

                            "Accept":
                                "application/json"
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
       SEARCH
    ===================================================== */

    async function performSearch(
        query
    ) {

        const clean =
            String(query || "")
                .trim();


        if (!clean) {

            showMessage(
                "Enter something to search.",
                "error"
            );

            return;

        }


        currentQuery =
            clean;

        currentPage =
            1;


        renderLoading();


        try {

            const data =
                await apiRequest(
                    `/api/search?q=${encodeURIComponent(clean)}`
                );


            if (
                Array.isArray(
                    data.results
                )
            ) {

                results =
                    data.results;

            } else if (
                Array.isArray(
                    data.items
                )
            ) {

                results =
                    data.items;

            } else {

                results = [];

            }


            renderResults();

            updateStats(
                data.total_count
            );


        } catch (error) {

            results = [];


            renderError(
                error.message
            );


            updateStats(
                0
            );

        }

    }


    /* =====================================================
       LOADING
    ===================================================== */

    function renderLoading() {

        const container =
            document.getElementById(
                "searchResults"
            );


        if (!container) return;


        container.innerHTML = `

            <div style="
                padding:45px 20px;
                text-align:center;
                color:#8995a8;
                font-size:12px;
            ">

                Searching repository...

            </div>

        `;

    }


    /* =====================================================
       ERROR
    ===================================================== */

    function renderError(
        error
    ) {

        const container =
            document.getElementById(
                "searchResults"
            );


        if (!container) return;


        container.innerHTML = `

            <div style="
                padding:40px 20px;
                text-align:center;
                color:#fb7185;
                font-size:12px;
                line-height:1.6;
            ">

                ${escapeHtml(error)}

            </div>

        `;

    }


    /* =====================================================
       RESULT DATA
    ===================================================== */

    function getResultPath(
        result
    ) {

        return (
            result.path ||
            result.file ||
            result.name ||
            result.html_url ||
            ""
        );

    }


    function getResultName(
        result
    ) {

        if (result.name) {
            return result.name;
        }


        const path =
            getResultPath(result);


        if (!path) {
            return "Unknown";
        }


        return path
            .split("/")
            .pop();

    }


    function getResultDescription(
        result
    ) {

        return (
            result.description ||
            result.repository?.full_name ||
            result.repo ||
            "Repository result"
        );

    }


    /* =====================================================
       RENDER RESULTS
    ===================================================== */

    function renderResults() {

        const container =
            document.getElementById(
                "searchResults"
            );


        if (!container) return;


        if (!results.length) {

            container.innerHTML = `

                <div style="
                    padding:45px 20px;
                    text-align:center;
                    color:#8995a8;
                    font-size:12px;
                ">

                    No results found for
                    <strong style="
                        color:#d9e3f0;
                    ">
                        "${escapeHtml(currentQuery)}"
                    </strong>

                </div>

            `;

            renderPagination();

            return;

        }


        const start =
            (currentPage - 1) *
            RESULTS_PER_PAGE;


        const end =
            start +
            RESULTS_PER_PAGE;


        const pageResults =
            results.slice(
                start,
                end
            );


        container.innerHTML =
            pageResults
                .map(
                    result => {

                        const name =
                            getResultName(
                                result
                            );


                        const path =
                            getResultPath(
                                result
                            );


                        const description =
                            getResultDescription(
                                result
                            );


                        const url =
                            result.html_url ||
                            result.url ||
                            "";


                        return `

                            <div
                                data-search-result
                                style="
                                    padding:15px 8px;
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
                                        display:flex;
                                        gap:12px;
                                        min-width:0;
                                        flex:1;
                                    ">

                                        <div style="
                                            width:36px;
                                            height:36px;
                                            flex:0 0 auto;
                                            display:grid;
                                            place-items:center;
                                            border-radius:10px;
                                            background:#172235;
                                            color:#38bdf8;
                                            font-size:16px;
                                        ">
                                            ⌕
                                        </div>


                                        <div style="
                                            min-width:0;
                                        ">

                                            <strong style="
                                                display:block;
                                                overflow:hidden;
                                                text-overflow:ellipsis;
                                                white-space:nowrap;
                                                color:#f5f7fb;
                                                font-size:13px;
                                            ">
                                                ${escapeHtml(name)}
                                            </strong>


                                            <span style="
                                                display:block;
                                                margin-top:5px;
                                                overflow:hidden;
                                                text-overflow:ellipsis;
                                                white-space:nowrap;
                                                color:#38bdf8;
                                                font-family:monospace;
                                                font-size:10px;
                                            ">
                                                ${escapeHtml(path)}
                                            </span>


                                            <span style="
                                                display:block;
                                                margin-top:5px;
                                                color:#8995a8;
                                                font-size:10px;
                                            ">
                                                ${escapeHtml(description)}
                                            </span>

                                        </div>

                                    </div>


                                    <div style="
                                        display:flex;
                                        gap:6px;
                                        flex-wrap:wrap;
                                        justify-content:flex-end;
                                    ">

                                        <button
                                            class="mini-button"
                                            data-search-open
                                            data-path="${escapeHtml(path)}"
                                        >
                                            Open
                                        </button>


                                        <button
                                            class="mini-button"
                                            data-search-edit
                                            data-path="${escapeHtml(path)}"
                                        >
                                            Edit
                                        </button>


                                        ${
                                            url
                                                ? `
                                                    <button
                                                        class="mini-button"
                                                        data-search-url="${escapeHtml(url)}"
                                                    >
                                                        GitHub
                                                    </button>
                                                `
                                                : ""
                                        }

                                    </div>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        setupResultButtons();

        renderPagination();

    }


    /* =====================================================
       RESULT BUTTONS
    ===================================================== */

    function setupResultButtons() {

        document
            .querySelectorAll(
                "[data-search-open]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const path =
                                button.dataset.path;


                            if (
                                window.CurioPressSearchManager &&
                                typeof window
                                    .CurioPressSearchManager
                                    .openFile ===
                                    "function"
                            ) {

                                window
                                    .CurioPressSearchManager
                                    .openFile(
                                        path,
                                        "open"
                                    );

                                return;

                            }


                            if (
                                typeof window.openFile ===
                                "function"
                            ) {

                                window.openFile(
                                    path,
                                    "open"
                                );

                                return;

                            }


                            showMessage(
                                `Open ${path} from the repository module.`
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                "[data-search-edit]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const path =
                                button.dataset.path;


                            if (
                                typeof window.openFile ===
                                "function"
                            ) {

                                window.openFile(
                                    path,
                                    "edit"
                                );

                                return;

                            }


                            showMessage(
                                `Open ${path} in edit mode from the repository module.`
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                "[data-search-url]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const url =
                                button.dataset.searchUrl;


                            window.open(
                                url,
                                "_blank",
                                "noopener,noreferrer"
                            );

                        }
                    );

                }
            );

    }


    /* =====================================================
       PAGINATION
    ===================================================== */

    function renderPagination() {

        const pagination =
            document.getElementById(
                "searchPagination"
            );


        if (!pagination) return;


        const totalPages =
            Math.ceil(
                results.length /
                RESULTS_PER_PAGE
            );


        if (
            totalPages <= 1
        ) {

            pagination.innerHTML =
                "";

            return;

        }


        pagination.innerHTML = `

            <button
                class="button"
                id="searchPrevious"
                ${currentPage <= 1
                    ? "disabled"
                    : ""}
            >
                Previous
            </button>


            <span style="
                display:flex;
                align-items:center;
                padding:0 8px;
                color:#8995a8;
                font-size:11px;
            ">
                Page ${currentPage}
                of ${totalPages}
            </span>


            <button
                class="button"
                id="searchNext"
                ${currentPage >= totalPages
                    ? "disabled"
                    : ""}
            >
                Next
            </button>

        `;


        const previous =
            document.getElementById(
                "searchPrevious"
            );


        const next =
            document.getElementById(
                "searchNext"
            );


        if (previous) {

            previous.addEventListener(
                "click",
                () => {

                    if (
                        currentPage <= 1
                    ) return;


                    currentPage--;

                    renderResults();

                }
            );

        }


        if (next) {

            next.addEventListener(
                "click",
                () => {

                    if (
                        currentPage >= totalPages
                    ) return;


                    currentPage++;

                    renderResults();

                }
            );

        }

    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats(
        apiTotal
    ) {

        const total =
            document.getElementById(
                "searchTotal"
            );


        const query =
            document.getElementById(
                "searchCurrentQuery"
            );


        const status =
            document.getElementById(
                "searchStatus"
            );


        if (total) {

            total.textContent =
                Number.isFinite(
                    Number(apiTotal)
                )
                    ? apiTotal
                    : results.length;

        }


        if (query) {

            query.textContent =
                currentQuery ||
                "—";

        }


        if (status) {

            status.textContent =
                currentQuery
                    ? "Search complete"
                    : "Ready";

        }

    }


    /* =====================================================
       CLEAR
    ===================================================== */

    function clearSearch() {

        const input =
            document.getElementById(
                "searchManagerInput"
            );


        if (input) {

            input.value =
                "";

        }


        currentQuery =
            "";

        currentPage =
            1;

        results =
            [];


        updateStats(
            0
        );


        const container =
            document.getElementById(
                "searchResults"
            );


        if (container) {

            container.innerHTML = `

                <div style="
                    padding:45px 20px;
                    text-align:center;
                    color:#8995a8;
                    font-size:12px;
                ">

                    Enter a search term to search
                    the repository.

                </div>

            `;

        }


        renderPagination();

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "searchManagerPanel"
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
            "searchManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        File Search
                    </h2>

                    <span>
                        Search files and repository content
                    </span>

                </div>


                <span
                    id="searchStatus"
                    style="
                        padding:7px 10px;
                        border-radius:999px;
                        background:rgba(56,189,248,.08);
                        border:1px solid rgba(56,189,248,.15);
                        color:#7dd3fc;
                        font-size:10px;
                        font-weight:800;
                    "
                >
                    Ready
                </span>

            </div>


            <!-- SEARCH BAR -->

            <div style="
                display:flex;
                gap:8px;
                margin-bottom:18px;
                flex-wrap:wrap;
            ">

                <input
                    id="searchManagerInput"
                    type="search"
                    autocomplete="off"
                    placeholder="Search files, code, URLs..."
                    style="
                        flex:1;
                        min-width:230px;
                        height:45px;
                        padding:0 14px;
                        border:1px solid var(--border);
                        border-radius:12px;
                        outline:none;
                        background:#0c1320;
                        color:white;
                    "
                >


                <button
                    class="button button-primary"
                    id="searchManagerButton"
                >
                    Search
                </button>


                <button
                    class="button"
                    id="searchClearButton"
                >
                    Clear
                </button>

            </div>


            <!-- STATS -->

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(2,minmax(0,1fr));
                gap:10px;
                margin-bottom:18px;
            ">


                <div class="stat-card">

                    <small>
                        Results
                    </small>

                    <strong id="searchTotal">
                        0
                    </strong>

                </div>


                <div class="stat-card">

                    <small>
                        Current Query
                    </small>

                    <strong
                        id="searchCurrentQuery"
                        style="
                            font-size:13px;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                        "
                    >
                        —
                    </strong>

                </div>

            </div>


            <!-- RESULTS -->

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
                    Search Results
                </div>


                <div id="searchResults">

                    <div style="
                        padding:45px 20px;
                        text-align:center;
                        color:#8995a8;
                        font-size:12px;
                    ">
                        Enter a search term to search
                        the repository.
                    </div>

                </div>

            </div>


            <!-- PAGINATION -->

            <div
                id="searchPagination"
                style="
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    gap:8px;
                    margin-top:15px;
                "
            ></div>


            <!-- NOTICE -->

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

                Search uses the authenticated CurioPress
                Admin Worker. Results are not fabricated
                when the API is unavailable.

            </div>

        `;


        content.appendChild(
            panel
        );


        const input =
            document.getElementById(
                "searchManagerInput"
            );


        const searchButton =
            document.getElementById(
                "searchManagerButton"
            );


        const clearButton =
            document.getElementById(
                "searchClearButton"
            );


        searchButton.addEventListener(
            "click",
            () =>
                performSearch(
                    input.value
                )
        );


        clearButton.addEventListener(
            "click",
            clearSearch
        );


        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    performSearch(
                        input.value
                    );

                }

            }
        );

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                '.nav-item[data-page="search"]'
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
                                            "searchManagerPanel"
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

    window.CurioPressSearchManager = {

        search:
            performSearch,

        clear:
            clearSearch,

        openFile:
            function (
                path,
                mode = "open"
            ) {

                if (
                    typeof window.openFile ===
                    "function"
                ) {

                    return window.openFile(
                        path,
                        mode
                    );

                }


                showMessage(
                    "Repository file opener is not available.",
                    "error"
                );

            },

        getResults:
            () => [...results]

    };


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        createPanel();

        setupNavigation();

        updateStats(
            0
        );

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
