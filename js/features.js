/*
=========================================================
 CURIOPRESS ADMIN PANEL
 FEATURES MODULE
=========================================================

This file contains additional admin features.

It is designed to work with the existing index.html,
api.js and authentication system.

No Admin Key is stored in this file.
Authentication continues through the existing session.
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    function getElement(id) {

        return document.getElementById(id);

    }


    function toast(message) {

        if (typeof window.showToast === "function") {

            window.showToast(message);

            return;

        }


        const element =
            getElement("toast");


        if (!element) {

            return;

        }


        element.textContent =
            message;


        element.classList.add(
            "show"
        );


        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            2800
        );

    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       API HELPER
    ===================================================== */

    async function request(
        endpoint,
        options = {}
    ) {

        /*
            Use the existing global apiRequest
            whenever available.
        */

        if (
            typeof window.apiRequest ===
            "function"
        ) {

            return await window.apiRequest(
                endpoint,
                options
            );

        }


        throw new Error(
            "Admin API module is not available."
        );

    }


    /* =====================================================
       REPOSITORY STATISTICS
    ===================================================== */

    async function loadRepositoryStatistics() {

        try {

            const data =
                await request(
                    "/api/files"
                );


            if (
                !data ||
                !Array.isArray(data.files)
            ) {

                return;

            }


            let files = 0;
            let images = 0;
            let pages = 0;
            let posts = 0;


            data.files.forEach(
                item => {

                    if (
                        item.type ===
                        "file"
                    ) {

                        files++;

                    }


                    const name =
                        String(
                            item.name ||
                            ""
                        ).toLowerCase();


                    if (
                        /\.(png|jpg|jpeg|gif|webp|svg|avif|ico)$/i
                            .test(name)
                    ) {

                        images++;

                    }


                    if (
                        /\.html?$/i
                            .test(name)
                    ) {

                        pages++;

                    }


                    if (
                        name.includes(
                            "blog"
                        ) ||
                        name.includes(
                            "post"
                        )
                    ) {

                        posts++;

                    }

                }
            );


            const totalFiles =
                getElement(
                    "totalFiles"
                );


            const totalImages =
                getElement(
                    "totalImages"
                );


            const totalPages =
                getElement(
                    "totalPages"
                );


            const totalPosts =
                getElement(
                    "totalPosts"
                );


            if (totalFiles) {

                totalFiles.textContent =
                    files;

            }


            if (totalImages) {

                totalImages.textContent =
                    images;

            }


            if (totalPages) {

                totalPages.textContent =
                    pages;

            }


            if (totalPosts) {

                totalPosts.textContent =
                    posts;

            }

        } catch (error) {

            console.error(
                "Repository statistics error:",
                error
            );

        }

    }


    /* =====================================================
       COMMIT HISTORY
    ===================================================== */

    async function loadCommitHistory() {

        try {

            const data =
                await request(
                    "/api/commits"
                );


            if (
                !data ||
                !Array.isArray(
                    data.commits
                )
            ) {

                return;

            }


            const container =
                getElement(
                    "recentChanges"
                );


            if (!container) {

                return;

            }


            if (
                data.commits.length ===
                0
            ) {

                return;

            }


            container.innerHTML =
                "";


            data.commits
                .slice(0, 10)
                .forEach(
                    commit => {

                        const item =
                            document.createElement(
                                "div"
                            );


                        item.className =
                            "change";


                        const message =
                            String(
                                commit.message ||
                                "Repository update"
                            )
                            .split("\n")[0];


                        const author =
                            commit.author ||
                            "Unknown";


                        const date =
                            commit.date
                                ? new Date(
                                    commit.date
                                ).toLocaleString()
                                : "";


                        item.innerHTML = `

                            <div class="change-icon">
                                ✓
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(message)}
                                </strong>

                                <span>
                                    ${escapeHTML(author)}
                                    ${date
                                        ? " • " +
                                          escapeHTML(date)
                                        : ""
                                    }
                                </span>

                            </div>

                        `;


                        container.appendChild(
                            item
                        );

                    }
                );

        } catch (error) {

            console.error(
                "Commit history error:",
                error
            );

        }

    }


    /* =====================================================
       FILE SEARCH
    ===================================================== */

    async function searchRepository(
        query
    ) {

        const cleanQuery =
            String(
                query || ""
            ).trim();


        if (!cleanQuery) {

            toast(
                "Enter something to search."
            );

            return;

        }


        try {

            toast(
                "Searching repository..."
            );


            const data =
                await request(
                    `/api/search?q=${encodeURIComponent(cleanQuery)}`
                );


            const count =
                Number(
                    data.total_count ||
                    0
                );


            if (!count) {

                toast(
                    `No results found for "${cleanQuery}".`
                );

                return;

            }


            toast(
                `${count} result(s) found for "${cleanQuery}".`
            );


            showSearchResults(
                data.results || []
            );

        } catch (error) {

            toast(
                `Search failed: ${error.message}`
            );

        }

    }


    function showSearchResults(
        results
    ) {

        const existing =
            getElement(
                "featureSearchModal"
            );


        if (existing) {

            existing.remove();

        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "featureSearchModal";


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:1000;
            background:rgba(0,0,0,.78);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        `;


        const rows =
            results.length
                ? results.map(
                    result => `

                        <div style="
                            padding:14px 0;
                            border-bottom:1px solid rgba(255,255,255,.07);
                        ">

                            <strong style="
                                display:block;
                                color:#f5f7fb;
                                font-size:13px;
                            ">
                                ${escapeHTML(result.name)}
                            </strong>

                            <span style="
                                display:block;
                                margin-top:5px;
                                color:#8995a8;
                                font-size:11px;
                            ">
                                ${escapeHTML(result.path)}
                            </span>

                        </div>

                    `
                ).join("")
                :
                `
                    <div style="
                        padding:30px;
                        text-align:center;
                        color:#8995a8;
                    ">
                        No results.
                    </div>
                `;


        modal.innerHTML = `

            <div style="
                width:min(800px,100%);
                max-height:80vh;
                overflow:auto;
                padding:22px;
                border:1px solid rgba(255,255,255,.1);
                border-radius:20px;
                background:#0d1522;
                box-shadow:0 30px 100px rgba(0,0,0,.6);
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;
                    margin-bottom:15px;
                ">

                    <strong>
                        Search Results
                    </strong>

                    <button
                        class="mini-button"
                        id="featureSearchClose"
                    >
                        Close
                    </button>

                </div>

                ${rows}

            </div>
        `;


        document.body.appendChild(
            modal
        );


        getElement(
            "featureSearchClose"
        ).addEventListener(
            "click",
            () => modal.remove()
        );

    }


    /* =====================================================
       SITE HEALTH
    ===================================================== */

    async function runHealthCheck() {

        try {

            toast(
                "Running site health check..."
            );


            const repository =
                await request(
                    "/api/repository"
                );


            const health =
                getElement(
                    "healthButton"
                );


            if (health) {

                health.textContent =
                    "Healthy ✓";

            }


            updateHealthStatus(
                repository
            );


            toast(
                "Health check completed."
            );

        } catch (error) {

            const health =
                getElement(
                    "healthButton"
                );


            if (health) {

                health.textContent =
                    "Check Failed";

            }


            toast(
                `Health check failed: ${error.message}`
            );

        }

    }


    function updateHealthStatus(
        repository
    ) {

        if (!repository) {

            return;

        }


        const rows =
            document.querySelectorAll(
                ".health-row"
            );


        if (rows.length >= 1) {

            const status =
                rows[0]
                    .querySelector(
                        "span:last-child"
                    );


            if (status) {

                status.textContent =
                    "Online";

                status.className =
                    "good";

            }

        }


        if (rows.length >= 2) {

            const status =
                rows[1]
                    .querySelector(
                        "span:last-child"
                    );


            if (status) {

                status.textContent =
                    "Active";

                status.className =
                    "good";

            }

        }

    }


    /* =====================================================
       DASHBOARD REFRESH
    ===================================================== */

    async function refreshDashboard() {

        toast(
            "Refreshing dashboard..."
        );


        await Promise.allSettled([
            loadRepositoryStatistics(),
            loadCommitHistory()
        ]);


        toast(
            "Dashboard refreshed."
        );

    }


    /* =====================================================
       NAVIGATION FEATURE HANDLER
    ===================================================== */

    function handleFeatureNavigation(
        page
    ) {

        const messages = {

            blog:
                "Blog Manager is ready for the next module.",

            drafts:
                "Draft Manager is ready for the next module.",

            search:
                "Use the top search box to search repository files.",

            commits:
                "Loading commit history...",

            seo:
                "SEO Center is ready for the next module.",

            keywords:
                "Keyword Manager is ready for the next module.",

            links:
                "Link Center is ready for the next module.",

            images:
                "Image / ALT Audit is ready for the next module.",

            sitemap:
                "Sitemap tools are ready for the next module.",

            robots:
                "Robots.txt tools are ready for the next module.",

            redirects:
                "Redirect Manager is ready for the next module.",

            health:
                "Running Site Health check...",

            backups:
                "Backup & Restore is ready for the next module.",

            audit:
                "Audit History is ready for the next module.",

            gsc:
                "Search Console integration is ready for the next module.",

            settings:
                "Settings are ready for the next module."

        };


        if (
            page ===
            "commits"
        ) {

            loadCommitHistory();

            return;

        }


        if (
            page ===
            "health"
        ) {

            runHealthCheck();

            return;

        }


        toast(
            messages[page] ||
            "Module is ready."
        );

    }


    /* =====================================================
       QUICK ACTION EXTENSION
    ===================================================== */

    function setupQuickActions() {

        document
            .querySelectorAll(
                ".quick[data-action]"
            )
            .forEach(
                button => {

                    if (
                        button.dataset
                            .featuresBound ===
                        "true"
                    ) {

                        return;

                    }


                    button.dataset
                        .featuresBound =
                        "true";


                    button.addEventListener(
                        "dblclick",
                        () => {

                            const action =
                                button.dataset.action;


                            if (
                                action ===
                                "health"
                            ) {

                                runHealthCheck();

                            }

                        }
                    );

                }
            );

    }


    /* =====================================================
       GLOBAL SEARCH EXTENSION
    ===================================================== */

    function setupGlobalSearch() {

        const search =
            getElement(
                "globalSearch"
            );


        if (!search) {

            return;

        }


        if (
            search.dataset
                .featuresBound ===
            "true"
        ) {

            return;

        }


        search.dataset
            .featuresBound =
            "true";


        search.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !==
                    "Enter"
                ) {

                    return;

                }


                const query =
                    search.value.trim();


                if (!query) {

                    return;

                }


                searchRepository(
                    query
                );

            }
        );

    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    async function initializeFeatures() {

        setupQuickActions();

        setupGlobalSearch();


        const healthButton =
            getElement(
                "healthButton"
            );


        if (
            healthButton &&
            healthButton.dataset
                .featuresBound !==
                "true"
        ) {

            healthButton.dataset
                .featuresBound =
                "true";


            healthButton.addEventListener(
                "click",
                runHealthCheck
            );

        }


        const refreshButton =
            getElement(
                "refreshButton"
            );


        if (
            refreshButton &&
            refreshButton.dataset
                .featuresBound !==
                "true"
        ) {

            refreshButton.dataset
                .featuresBound =
                "true";


            refreshButton.addEventListener(
                "click",
                refreshDashboard
            );

        }


        document
            .querySelectorAll(
                ".nav-item[data-page]"
            )
            .forEach(
                item => {

                    if (
                        item.dataset
                            .featureNavigationBound ===
                        "true"
                    ) {

                        return;

                    }


                    item.dataset
                        .featureNavigationBound =
                        "true";


                    item.addEventListener(
                        "dblclick",
                        () => {

                            handleFeatureNavigation(
                                item.dataset.page
                            );

                        }
                    );

                }
            );

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.CurioPressFeatures = {

        loadRepositoryStatistics,

        loadCommitHistory,

        searchRepository,

        runHealthCheck,

        refreshDashboard,

        initializeFeatures

    };


    /*
        Wait until the existing index.html
        has finished creating its DOM.
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeFeatures
        );

    } else {

        initializeFeatures();

    }

})();
