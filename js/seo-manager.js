/* =====================================================
   CurioPress Admin
   SEO Manager
   File: js/seo-manager.js
===================================================== */

(function () {

    "use strict";

    const SEO_STORAGE_KEY =
        "curiopress_admin_seo_settings";


    /* =====================================================
       DEFAULT SEO DATA
    ===================================================== */

    const DEFAULT_SEO = {

        siteTitle:
            "CurioPress",

        siteDescription:
            "",

        canonical:
            "",

        robots:
            "index, follow",

        ogTitle:
            "",

        ogDescription:
            "",

        ogImage:
            "",

        twitterTitle:
            "",

        twitterDescription:
            "",

        twitterImage:
            "",

        twitterCard:
            "summary_large_image",

        keywords:
            "",

        author:
            "CurioPress",

        language:
            "en",

        themeColor:
            "#080d18",

        favicon:
            "",

        googleVerification:
            "",

        bingVerification:
            "",

        updatedAt:
            null

    };


    /* =====================================================
       STORAGE
    ===================================================== */

    function getSEO() {

        try {

            const saved =
                localStorage.getItem(
                    SEO_STORAGE_KEY
                );

            if (!saved) {

                return {
                    ...DEFAULT_SEO
                };

            }


            const parsed =
                JSON.parse(saved);


            return {
                ...DEFAULT_SEO,
                ...(parsed || {})
            };

        } catch {

            return {
                ...DEFAULT_SEO
            };

        }

    }


    function saveSEO(data) {

        const finalData = {

            ...DEFAULT_SEO,
            ...data,

            updatedAt:
                new Date().toISOString()

        };


        localStorage.setItem(
            SEO_STORAGE_KEY,
            JSON.stringify(
                finalData
            )
        );


        return finalData;

    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHtml(value) {

        return String(value || "")
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


    function toast(message) {

        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                message
            );

            return;

        }


        const element =
            document.getElementById(
                "toast"
            );


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


    function inputStyle() {

        return `
            width:100%;
            height:46px;
            padding:0 13px;
            border:1px solid rgba(255,255,255,.08);
            border-radius:11px;
            background:#080e19;
            color:white;
            outline:none;
        `;

    }


    function textareaStyle() {

        return `
            width:100%;
            min-height:90px;
            padding:13px;
            resize:vertical;
            border:1px solid rgba(255,255,255,.08);
            border-radius:11px;
            background:#080e19;
            color:white;
            outline:none;
            font:inherit;
            line-height:1.55;
        `;

    }


    function labelStyle() {

        return `
            display:block;
            margin-bottom:7px;
            color:#b8c2d1;
            font-size:12px;
            font-weight:700;
        `;

    }


    /* =====================================================
       SEO SCORE
    ===================================================== */

    function calculateScore(data) {

        let score = 0;


        if (
            data.siteTitle &&
            data.siteTitle.length >= 10 &&
            data.siteTitle.length <= 60
        ) {

            score += 15;

        }


        if (
            data.siteDescription &&
            data.siteDescription.length >= 50 &&
            data.siteDescription.length <= 160
        ) {

            score += 15;

        }


        if (data.canonical) {

            score += 10;

        }


        if (data.robots) {

            score += 10;

        }


        if (data.ogTitle) {

            score += 10;

        }


        if (data.ogDescription) {

            score += 10;

        }


        if (data.ogImage) {

            score += 10;

        }


        if (data.twitterCard) {

            score += 5;

        }


        if (data.favicon) {

            score += 5;

        }


        if (
            data.googleVerification ||
            data.bingVerification
        ) {

            score += 5;

        }


        if (data.keywords) {

            score += 5;

        }


        return Math.min(
            score,
            100
        );

    }


    /* =====================================================
       SEO API
    ===================================================== */

    window.CurioPressSEOManager = {

        get() {

            return getSEO();

        },


        save(data) {

            return saveSEO(
                data
            );

        },


        reset() {

            const resetData = {
                ...DEFAULT_SEO
            };

            localStorage.setItem(
                SEO_STORAGE_KEY,
                JSON.stringify(
                    resetData
                )
            );

            return resetData;

        },


        score() {

            return calculateScore(
                getSEO()
            );

        }

    };


    /* =====================================================
       SEO PANEL
    ===================================================== */

    function initialize() {

        let container =
            document.getElementById(
                "seoManagerContainer"
            );


        if (!container) {

            container =
                document.createElement(
                    "section"
                );


            container.id =
                "seoManagerContainer";


            container.className =
                "panel";


            container.style.marginTop =
                "20px";


            container.innerHTML = `

                <div class="panel-header">

                    <div>

                        <h2>
                            SEO Center
                        </h2>

                        <span>
                            Manage website SEO settings
                        </span>

                    </div>


                    <div style="
                        display:flex;
                        align-items:center;
                        gap:8px;
                    ">

                        <div
                            id="seoScoreBadge"
                            style="
                                padding:8px 11px;
                                border-radius:999px;
                                background:rgba(52,211,153,.08);
                                border:1px solid rgba(52,211,153,.15);
                                color:#86efac;
                                font-size:11px;
                                font-weight:800;
                            "
                        >
                            SEO Score: —
                        </div>


                        <button
                            class="button button-primary"
                            id="seoSaveButton"
                        >
                            Save SEO
                        </button>

                    </div>

                </div>


                <div style="
                    display:grid;
                    grid-template-columns:
                        repeat(2,minmax(0,1fr));
                    gap:18px;
                ">


                    <!-- BASIC SEO -->

                    <div style="
                        padding:18px;
                        border:1px solid rgba(255,255,255,.07);
                        border-radius:15px;
                        background:#0b1320;
                    ">

                        <h3 style="
                            margin:0 0 16px;
                            font-size:14px;
                        ">
                            Basic SEO
                        </h3>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                Site Title
                            </label>

                            <input
                                id="seoSiteTitle"
                                maxlength="60"
                                placeholder="CurioPress"
                                style="${inputStyle()}"
                            >

                            <div
                                id="seoTitleCount"
                                style="
                                    margin-top:5px;
                                    color:#8995a8;
                                    font-size:10px;
                                "
                            >
                                0 / 60
                            </div>

                        </div>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                Meta Description
                            </label>

                            <textarea
                                id="seoSiteDescription"
                                maxlength="160"
                                placeholder="Describe your website..."
                                style="${textareaStyle()}"
                            ></textarea>

                            <div
                                id="seoDescriptionCount"
                                style="
                                    margin-top:5px;
                                    color:#8995a8;
                                    font-size:10px;
                                "
                            >
                                0 / 160
                            </div>

                        </div>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                Canonical URL
                            </label>

                            <input
                                id="seoCanonical"
                                type="url"
                                placeholder="https://example.com/"
                                style="${inputStyle()}"
                            >

                        </div>


                        <div>

                            <label style="${labelStyle()}">
                                Robots
                            </label>

                            <select
                                id="seoRobots"
                                style="${inputStyle()}"
                            >

                                <option value="index, follow">
                                    index, follow
                                </option>

                                <option value="index, nofollow">
                                    index, nofollow
                                </option>

                                <option value="noindex, follow">
                                    noindex, follow
                                </option>

                                <option value="noindex, nofollow">
                                    noindex, nofollow
                                </option>

                            </select>

                        </div>

                    </div>


                    <!-- OPEN GRAPH -->

                    <div style="
                        padding:18px;
                        border:1px solid rgba(255,255,255,.07);
                        border-radius:15px;
                        background:#0b1320;
                    ">

                        <h3 style="
                            margin:0 0 16px;
                            font-size:14px;
                        ">
                            Open Graph
                        </h3>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                OG Title
                            </label>

                            <input
                                id="seoOgTitle"
                                maxlength="60"
                                placeholder="Social sharing title"
                                style="${inputStyle()}"
                            >

                        </div>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                OG Description
                            </label>

                            <textarea
                                id="seoOgDescription"
                                maxlength="160"
                                placeholder="Social sharing description"
                                style="${textareaStyle()}"
                            ></textarea>

                        </div>


                        <div>

                            <label style="${labelStyle()}">
                                OG Image URL
                            </label>

                            <input
                                id="seoOgImage"
                                type="url"
                                placeholder="https://..."
                                style="${inputStyle()}"
                            >

                        </div>

                    </div>


                    <!-- TWITTER -->

                    <div style="
                        padding:18px;
                        border:1px solid rgba(255,255,255,.07);
                        border-radius:15px;
                        background:#0b1320;
                    ">

                        <h3 style="
                            margin:0 0 16px;
                            font-size:14px;
                        ">
                            Social / Twitter
                        </h3>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                Twitter Card
                            </label>

                            <select
                                id="seoTwitterCard"
                                style="${inputStyle()}"
                            >

                                <option value="summary_large_image">
                                    summary_large_image
                                </option>

                                <option value="summary">
                                    summary
                                </option>

                            </select>

                        </div>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                Twitter Title
                            </label>

                            <input
                                id="seoTwitterTitle"
                                maxlength="70"
                                placeholder="Twitter title"
                                style="${inputStyle()}"
                            >

                        </div>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                Twitter Description
                            </label>

                            <textarea
                                id="seoTwitterDescription"
                                maxlength="200"
                                placeholder="Twitter description"
                                style="${textareaStyle()}"
                            ></textarea>

                        </div>


                        <div>

                            <label style="${labelStyle()}">
                                Twitter Image URL
                            </label>

                            <input
                                id="seoTwitterImage"
                                type="url"
                                placeholder="https://..."
                                style="${inputStyle()}"
                            >

                        </div>

                    </div>


                    <!-- TECHNICAL -->

                    <div style="
                        padding:18px;
                        border:1px solid rgba(255,255,255,.07);
                        border-radius:15px;
                        background:#0b1320;
                    ">

                        <h3 style="
                            margin:0 0 16px;
                            font-size:14px;
                        ">
                            Technical SEO
                        </h3>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                Keywords
                            </label>

                            <input
                                id="seoKeywords"
                                placeholder="technology, news, education"
                                style="${inputStyle()}"
                            >

                        </div>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                Author
                            </label>

                            <input
                                id="seoAuthor"
                                placeholder="CurioPress"
                                style="${inputStyle()}"
                            >

                        </div>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                Language
                            </label>

                            <input
                                id="seoLanguage"
                                placeholder="en"
                                maxlength="10"
                                style="${inputStyle()}"
                            >

                        </div>


                        <div style="
                            margin-bottom:14px;
                        ">

                            <label style="${labelStyle()}">
                                Theme Color
                            </label>

                            <input
                                id="seoThemeColor"
                                type="text"
                                placeholder="#080d18"
                                style="${inputStyle()}"
                            >

                        </div>


                        <div>

                            <label style="${labelStyle()}">
                                Favicon URL
                            </label>

                            <input
                                id="seoFavicon"
                                type="url"
                                placeholder="https://..."
                                style="${inputStyle()}"
                            >

                        </div>

                    </div>


                    <!-- SEARCH VERIFICATION -->

                    <div style="
                        grid-column:1/-1;
                        padding:18px;
                        border:1px solid rgba(255,255,255,.07);
                        border-radius:15px;
                        background:#0b1320;
                    ">

                        <h3 style="
                            margin:0 0 16px;
                            font-size:14px;
                        ">
                            Search Engine Verification
                        </h3>


                        <div style="
                            display:grid;
                            grid-template-columns:
                                repeat(2,minmax(0,1fr));
                            gap:15px;
                        ">

                            <div>

                                <label style="${labelStyle()}">
                                    Google Verification
                                </label>

                                <input
                                    id="seoGoogleVerification"
                                    placeholder="Verification content"
                                    style="${inputStyle()}"
                                >

                            </div>


                            <div>

                                <label style="${labelStyle()}">
                                    Bing Verification
                                </label>

                                <input
                                    id="seoBingVerification"
                                    placeholder="Verification content"
                                    style="${inputStyle()}"
                                >

                            </div>

                        </div>

                    </div>


                    <!-- PREVIEW -->

                    <div style="
                        grid-column:1/-1;
                        padding:18px;
                        border:1px solid rgba(255,255,255,.07);
                        border-radius:15px;
                        background:#0b1320;
                    ">

                        <h3 style="
                            margin:0 0 16px;
                            font-size:14px;
                        ">
                            Search Preview
                        </h3>


                        <div style="
                            max-width:700px;
                            padding:16px;
                            border-radius:13px;
                            background:#080e19;
                            border:1px solid rgba(255,255,255,.07);
                        ">

                            <div
                                id="seoPreviewTitle"
                                style="
                                    color:#60a5fa;
                                    font-size:18px;
                                    font-weight:700;
                                    margin-bottom:5px;
                                "
                            >
                                CurioPress
                            </div>


                            <div
                                id="seoPreviewUrl"
                                style="
                                    color:#34d399;
                                    font-size:11px;
                                    margin-bottom:7px;
                                "
                            >
                                https://example.com/
                            </div>


                            <div
                                id="seoPreviewDescription"
                                style="
                                    color:#8995a8;
                                    font-size:12px;
                                    line-height:1.6;
                                "
                            >
                                Your website description will appear here.
                            </div>

                        </div>

                    </div>

                </div>


                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                    margin-top:18px;
                    padding-top:15px;
                    border-top:1px solid rgba(255,255,255,.06);
                ">

                    <button
                        class="button"
                        id="seoResetButton"
                    >
                        Reset
                    </button>


                    <div style="
                        display:flex;
                        gap:8px;
                    ">

                        <button
                            class="button"
                            id="seoGenerateButton"
                        >
                            Generate Defaults
                        </button>

                        <button
                            class="button button-primary"
                            id="seoSaveButtonBottom"
                        >
                            Save SEO
                        </button>

                    </div>

                </div>

            `;


            const content =
                document.querySelector(
                    ".content"
                );


            if (content) {

                content.appendChild(
                    container
                );

            }

        }


        loadIntoForm();

        bindEvents();

    }


    /* =====================================================
       LOAD FORM
    ===================================================== */

    function loadIntoForm() {

        const data =
            getSEO();


        const fields = {

            seoSiteTitle:
                data.siteTitle,

            seoSiteDescription:
                data.siteDescription,

            seoCanonical:
                data.canonical,

            seoRobots:
                data.robots,

            seoOgTitle:
                data.ogTitle,

            seoOgDescription:
                data.ogDescription,

            seoOgImage:
                data.ogImage,

            seoTwitterCard:
                data.twitterCard,

            seoTwitterTitle:
                data.twitterTitle,

            seoTwitterDescription:
                data.twitterDescription,

            seoTwitterImage:
                data.twitterImage,

            seoKeywords:
                data.keywords,

            seoAuthor:
                data.author,

            seoLanguage:
                data.language,

            seoThemeColor:
                data.themeColor,

            seoFavicon:
                data.favicon,

            seoGoogleVerification:
                data.googleVerification,

            seoBingVerification:
                data.bingVerification

        };


        Object.entries(
            fields
        ).forEach(
            ([id, value]) => {

                const element =
                    document.getElementById(
                        id
                    );


                if (element) {

                    element.value =
                        value || "";

                }

            }
        );


        updatePreview();

        updateCounters();

        updateScore();

    }


    /* =====================================================
       COLLECT FORM
    ===================================================== */

    function collectForm() {

        return {

            siteTitle:
                document.getElementById(
                    "seoSiteTitle"
                )?.value.trim() || "",

            siteDescription:
                document.getElementById(
                    "seoSiteDescription"
                )?.value.trim() || "",

            canonical:
                document.getElementById(
                    "seoCanonical"
                )?.value.trim() || "",

            robots:
                document.getElementById(
                    "seoRobots"
                )?.value || "index, follow",

            ogTitle:
                document.getElementById(
                    "seoOgTitle"
                )?.value.trim() || "",

            ogDescription:
                document.getElementById(
                    "seoOgDescription"
                )?.value.trim() || "",

            ogImage:
                document.getElementById(
                    "seoOgImage"
                )?.value.trim() || "",

            twitterCard:
                document.getElementById(
                    "seoTwitterCard"
                )?.value ||
                "summary_large_image",

            twitterTitle:
                document.getElementById(
                    "seoTwitterTitle"
                )?.value.trim() || "",

            twitterDescription:
                document.getElementById(
                    "seoTwitterDescription"
                )?.value.trim() || "",

            twitterImage:
                document.getElementById(
                    "seoTwitterImage"
                )?.value.trim() || "",

            keywords:
                document.getElementById(
                    "seoKeywords"
                )?.value.trim() || "",

            author:
                document.getElementById(
                    "seoAuthor"
                )?.value.trim() ||
                "CurioPress",

            language:
                document.getElementById(
                    "seoLanguage"
                )?.value.trim() ||
                "en",

            themeColor:
                document.getElementById(
                    "seoThemeColor"
                )?.value.trim() ||
                "#080d18",

            favicon:
                document.getElementById(
                    "seoFavicon"
                )?.value.trim() || "",

            googleVerification:
                document.getElementById(
                    "seoGoogleVerification"
                )?.value.trim() || "",

            bingVerification:
                document.getElementById(
                    "seoBingVerification"
                )?.value.trim() || ""

        };

    }


    /* =====================================================
       SAVE
    ===================================================== */

    function saveFromForm() {

        const data =
            collectForm();


        saveSEO(
            data
        );


        updatePreview();

        updateCounters();

        updateScore();


        toast(
            "SEO settings saved successfully."
        );

    }


    /* =====================================================
       PREVIEW
    ===================================================== */

    function updatePreview() {

        const data =
            collectForm();


        const title =
            data.ogTitle ||
            data.siteTitle ||
            "CurioPress";


        const description =
            data.ogDescription ||
            data.siteDescription ||
            "Your website description will appear here.";


        const url =
            data.canonical ||
            "https://example.com/";


        const titleElement =
            document.getElementById(
                "seoPreviewTitle"
            );


        const urlElement =
            document.getElementById(
                "seoPreviewUrl"
            );


        const descriptionElement =
            document.getElementById(
                "seoPreviewDescription"
            );


        if (titleElement) {

            titleElement.textContent =
                title;

        }


        if (urlElement) {

            urlElement.textContent =
                url;

        }


        if (descriptionElement) {

            descriptionElement.textContent =
                description;

        }

    }


    /* =====================================================
       COUNTERS
    ===================================================== */

    function updateCounters() {

        const title =
            document.getElementById(
                "seoSiteTitle"
            );


        const description =
            document.getElementById(
                "seoSiteDescription"
            );


        const titleCount =
            document.getElementById(
                "seoTitleCount"
            );


        const descriptionCount =
            document.getElementById(
                "seoDescriptionCount"
            );


        if (title && titleCount) {

            titleCount.textContent =
                `${title.value.length} / 60`;

        }


        if (
            description &&
            descriptionCount
        ) {

            descriptionCount.textContent =
                `${description.value.length} / 160`;

        }

    }


    /* =====================================================
       SCORE
    ===================================================== */

    function updateScore() {

        const score =
            calculateScore(
                collectForm()
            );


        const badge =
            document.getElementById(
                "seoScoreBadge"
            );


        if (!badge) {
            return;
        }


        badge.textContent =
            `SEO Score: ${score}/100`;


        if (score >= 80) {

            badge.style.color =
                "#86efac";

            badge.style.background =
                "rgba(52,211,153,.08)";

        } else if (score >= 50) {

            badge.style.color =
                "#fcd34d";

            badge.style.background =
                "rgba(251,191,36,.08)";

        } else {

            badge.style.color =
                "#fda4af";

            badge.style.background =
                "rgba(251,113,133,.08)";

        }

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        const container =
            document.getElementById(
                "seoManagerContainer"
            );


        if (!container) {
            return;
        }


        if (
            container.dataset.bound ===
            "true"
        ) {

            return;

        }


        container.dataset.bound =
            "true";


        container
            .querySelector(
                "#seoSaveButton"
            )
            .addEventListener(
                "click",
                saveFromForm
            );


        container
            .querySelector(
                "#seoSaveButtonBottom"
            )
            .addEventListener(
                "click",
                saveFromForm
            );


        container
            .querySelector(
                "#seoResetButton"
            )
            .addEventListener(
                "click",
                () => {

                    if (
                        !confirm(
                            "Reset all SEO settings?"
                        )
                    ) {

                        return;

                    }


                    window
                        .CurioPressSEOManager
                        .reset();


                    loadIntoForm();


                    toast(
                        "SEO settings reset."
                    );

                }
            );


        container
            .querySelector(
                "#seoGenerateButton"
            )
            .addEventListener(
                "click",
                () => {

                    const current =
                        collectForm();


                    if (
                        !current.ogTitle
                    ) {

                        document
                            .getElementById(
                                "seoOgTitle"
                            )
                            .value =
                            current.siteTitle;

                    }


                    if (
                        !current.ogDescription
                    ) {

                        document
                            .getElementById(
                                "seoOgDescription"
                            )
                            .value =
                            current.siteDescription;

                    }


                    if (
                        !current.twitterTitle
                    ) {

                        document
                            .getElementById(
                                "seoTwitterTitle"
                            )
                            .value =
                            current.siteTitle;

                    }


                    if (
                        !current.twitterDescription
                    ) {

                        document
                            .getElementById(
                                "seoTwitterDescription"
                            )
                            .value =
                            current.siteDescription;

                    }


                    if (
                        !current.twitterImage
                    ) {

                        document
                            .getElementById(
                                "seoTwitterImage"
                            )
                            .value =
                            current.ogImage;

                    }


                    updatePreview();

                    updateCounters();

                    updateScore();


                    toast(
                        "SEO defaults generated."
                    );

                }
            );


        container
            .querySelectorAll(
                "input, textarea, select"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "input",
                        () => {

                            updatePreview();

                            updateCounters();

                            updateScore();

                        }
                    );


                    element.addEventListener(
                        "change",
                        () => {

                            updatePreview();

                            updateCounters();

                            updateScore();

                        }
                    );

                }
            );

    }


    /* =====================================================
       PUBLIC UI
    ===================================================== */

    window.CurioPressSEOUI = {

        initialize,

        refresh:
            loadIntoForm,

        save:
            saveFromForm,

        get:
            () =>
                getSEO(),

        score:
            () =>
                calculateScore(
                    getSEO()
                )

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
