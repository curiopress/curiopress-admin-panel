/* =====================================================
   CURIOPRESS SETTINGS MANAGER
   js/settings-manager.js
===================================================== */

(function () {

    "use strict";

    const STORAGE_KEY =
        "curiopress_admin_settings";

    const DEFAULT_SETTINGS = {

        siteName:
            "CurioPress",

        siteUrl:
            "https://curiopress.github.io",

        adminName:
            "Admin",

        timezone:
            "Asia/Kolkata",

        defaultCommitMessage:
            "Update CurioPress",

        autoRefresh:
            true,

        confirmBeforeCommit:
            true,

        confirmBeforeDeploy:
            true,

        rememberSession:
            true,

        showNotifications:
            true,

        compactMode:
            false

    };


    let settings = {
        ...DEFAULT_SETTINGS
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


    function notify(
        text,
        type = "success"
    ) {

        const old =
            document.getElementById(
                "settingsManagerMessage"
            );

        if (old) old.remove();


        const box =
            document.createElement(
                "div"
            );


        box.id =
            "settingsManagerMessage";


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
            3000
        );

    }


    /* =====================================================
       LOAD SETTINGS
    ===================================================== */

    function loadSettings() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (saved) {

                const parsed =
                    JSON.parse(
                        saved
                    );


                if (
                    parsed &&
                    typeof parsed ===
                    "object"
                ) {

                    settings = {
                        ...DEFAULT_SETTINGS,
                        ...parsed
                    };

                }

            }

        } catch {

            settings = {
                ...DEFAULT_SETTINGS
            };

        }

    }


    /* =====================================================
       SAVE SETTINGS
    ===================================================== */

    function saveSettings() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    settings
                )
            );


            return true;

        } catch {

            notify(
                "Unable to save settings.",
                "error"
            );


            return false;

        }

    }


    /* =====================================================
       GET / SET
    ===================================================== */

    function get(
        key
    ) {

        return settings[key];

    }


    function set(
        key,
        value
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                DEFAULT_SETTINGS,
                key
            )
        ) {

            return false;

        }


        settings[key] =
            value;


        saveSettings();

        render();


        return true;

    }


    /* =====================================================
       RESET
    ===================================================== */

    function resetSettings() {

        if (
            !confirm(
                "Reset all Admin Panel settings to default?"
            )
        ) {

            return;

        }


        settings = {
            ...DEFAULT_SETTINGS
        };


        saveSettings();

        render();


        notify(
            "Settings restored to default."
        );

    }


    /* =====================================================
       SAVE FORM
    ===================================================== */

    function saveForm() {

        const siteName =
            document.getElementById(
                "settingSiteName"
            );


        const siteUrl =
            document.getElementById(
                "settingSiteUrl"
            );


        const adminName =
            document.getElementById(
                "settingAdminName"
            );


        const timezone =
            document.getElementById(
                "settingTimezone"
            );


        const commitMessage =
            document.getElementById(
                "settingCommitMessage"
            );


        const autoRefresh =
            document.getElementById(
                "settingAutoRefresh"
            );


        const confirmCommit =
            document.getElementById(
                "settingConfirmCommit"
            );


        const confirmDeploy =
            document.getElementById(
                "settingConfirmDeploy"
            );


        const rememberSession =
            document.getElementById(
                "settingRememberSession"
            );


        const notifications =
            document.getElementById(
                "settingNotifications"
            );


        const compactMode =
            document.getElementById(
                "settingCompactMode"
            );


        settings.siteName =
            siteName
                ? siteName.value.trim() ||
                  DEFAULT_SETTINGS.siteName
                : settings.siteName;


        settings.siteUrl =
            siteUrl
                ? siteUrl.value.trim() ||
                  DEFAULT_SETTINGS.siteUrl
                : settings.siteUrl;


        settings.adminName =
            adminName
                ? adminName.value.trim() ||
                  DEFAULT_SETTINGS.adminName
                : settings.adminName;


        settings.timezone =
            timezone
                ? timezone.value ||
                  DEFAULT_SETTINGS.timezone
                : settings.timezone;


        settings.defaultCommitMessage =
            commitMessage
                ? commitMessage.value.trim() ||
                  DEFAULT_SETTINGS.defaultCommitMessage
                : settings.defaultCommitMessage;


        settings.autoRefresh =
            autoRefresh
                ? autoRefresh.checked
                : settings.autoRefresh;


        settings.confirmBeforeCommit =
            confirmCommit
                ? confirmCommit.checked
                : settings.confirmBeforeCommit;


        settings.confirmBeforeDeploy =
            confirmDeploy
                ? confirmDeploy.checked
                : settings.confirmBeforeDeploy;


        settings.rememberSession =
            rememberSession
                ? rememberSession.checked
                : settings.rememberSession;


        settings.showNotifications =
            notifications
                ? notifications.checked
                : settings.showNotifications;


        settings.compactMode =
            compactMode
                ? compactMode.checked
                : settings.compactMode;


        if (
            saveSettings()
        ) {

            notify(
                "Settings saved successfully."
            );

        }

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function render() {

        const siteName =
            document.getElementById(
                "settingSiteName"
            );


        const siteUrl =
            document.getElementById(
                "settingSiteUrl"
            );


        const adminName =
            document.getElementById(
                "settingAdminName"
            );


        const timezone =
            document.getElementById(
                "settingTimezone"
            );


        const commitMessage =
            document.getElementById(
                "settingCommitMessage"
            );


        const autoRefresh =
            document.getElementById(
                "settingAutoRefresh"
            );


        const confirmCommit =
            document.getElementById(
                "settingConfirmCommit"
            );


        const confirmDeploy =
            document.getElementById(
                "settingConfirmDeploy"
            );


        const rememberSession =
            document.getElementById(
                "settingRememberSession"
            );


        const notifications =
            document.getElementById(
                "settingNotifications"
            );


        const compactMode =
            document.getElementById(
                "settingCompactMode"
            );


        if (siteName)
            siteName.value =
                settings.siteName;


        if (siteUrl)
            siteUrl.value =
                settings.siteUrl;


        if (adminName)
            adminName.value =
                settings.adminName;


        if (timezone)
            timezone.value =
                settings.timezone;


        if (commitMessage)
            commitMessage.value =
                settings.defaultCommitMessage;


        if (autoRefresh)
            autoRefresh.checked =
                settings.autoRefresh;


        if (confirmCommit)
            confirmCommit.checked =
                settings.confirmBeforeCommit;


        if (confirmDeploy)
            confirmDeploy.checked =
                settings.confirmBeforeDeploy;


        if (rememberSession)
            rememberSession.checked =
                settings.rememberSession;


        if (notifications)
            notifications.checked =
                settings.showNotifications;


        if (compactMode)
            compactMode.checked =
                settings.compactMode;

    }


    /* =====================================================
       TOGGLE COMPONENT
    ===================================================== */

    function toggleRow(
        id,
        title,
        description
    ) {

        return `

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:20px;
                padding:15px 0;
                border-bottom:
                    1px solid rgba(255,255,255,.05);
            ">

                <div>

                    <strong style="
                        display:block;
                        color:#f5f7fb;
                        font-size:12px;
                    ">
                        ${escapeHtml(title)}
                    </strong>

                    <span style="
                        display:block;
                        margin-top:4px;
                        color:#8995a8;
                        font-size:10px;
                        line-height:1.5;
                    ">
                        ${escapeHtml(description)}
                    </span>

                </div>


                <label style="
                    position:relative;
                    width:44px;
                    height:24px;
                    flex:0 0 auto;
                ">

                    <input
                        id="${escapeHtml(id)}"
                        type="checkbox"
                        style="
                            opacity:0;
                            width:0;
                            height:0;
                        "
                    >


                    <span
                        data-toggle-for="${escapeHtml(id)}"
                        style="
                            position:absolute;
                            inset:0;
                            cursor:pointer;
                            border-radius:999px;
                            background:#1b2738;
                            border:1px solid rgba(255,255,255,.08);
                            transition:.2s ease;
                        "
                    ></span>

                </label>

            </div>

        `;

    }


    /* =====================================================
       TOGGLE STYLE
    ===================================================== */

    function setupToggle(
        inputId
    ) {

        const input =
            document.getElementById(
                inputId
            );


        const track =
            document.querySelector(
                `[data-toggle-for="${inputId}"]`
            );


        if (
            !input ||
            !track
        ) {

            return;

        }


        function update() {

            if (
                input.checked
            ) {

                track.style.background =
                    "linear-gradient(135deg,#5eead4,#38bdf8)";

                track.style.borderColor =
                    "transparent";


                track.innerHTML = `
                    <span style="
                        position:absolute;
                        width:18px;
                        height:18px;
                        right:2px;
                        top:2px;
                        border-radius:50%;
                        background:#061018;
                    "></span>
                `;

            } else {

                track.style.background =
                    "#1b2738";

                track.style.borderColor =
                    "rgba(255,255,255,.08)";


                track.innerHTML = `
                    <span style="
                        position:absolute;
                        width:18px;
                        height:18px;
                        left:2px;
                        top:2px;
                        border-radius:50%;
                        background:#8995a8;
                    "></span>
                `;

            }

        }


        input.addEventListener(
            "change",
            update
        );


        track.addEventListener(
            "click",
            () => {

                input.checked =
                    !input.checked;

                input.dispatchEvent(
                    new Event(
                        "change"
                    )
                );

            }
        );


        update();

    }


    /* =====================================================
       CREATE PANEL
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "settingsManagerPanel"
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
            "settingsManagerPanel";


        panel.className =
            "panel";


        panel.style.marginTop =
            "20px";


        panel.innerHTML = `

            <div class="panel-header">

                <div>

                    <h2>
                        Settings
                    </h2>

                    <span>
                        Configure your CurioPress Admin Panel
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
                        id="settingsReset"
                    >
                        Reset
                    </button>

                    <button
                        class="button button-primary"
                        id="settingsSave"
                    >
                        Save Settings
                    </button>

                </div>

            </div>


            <div style="
                display:grid;
                grid-template-columns:
                    repeat(2,minmax(0,1fr));
                gap:20px;
            ">


                <!-- GENERAL -->

                <div style="
                    padding:20px;
                    border:1px solid var(--border);
                    border-radius:16px;
                    background:#0d1522;
                ">

                    <h3 style="
                        margin:0 0 18px;
                        font-size:15px;
                    ">
                        General
                    </h3>


                    <div style="
                        margin-bottom:15px;
                    ">

                        <label style="
                            display:block;
                            margin-bottom:7px;
                            color:#b8c2d1;
                            font-size:11px;
                            font-weight:800;
                        ">
                            Site Name
                        </label>

                        <input
                            id="settingSiteName"
                            type="text"
                            style="
                                width:100%;
                                height:43px;
                                padding:0 13px;
                                border:1px solid var(--border);
                                border-radius:11px;
                                outline:none;
                                background:#080e18;
                                color:white;
                            "
                        >

                    </div>


                    <div style="
                        margin-bottom:15px;
                    ">

                        <label style="
                            display:block;
                            margin-bottom:7px;
                            color:#b8c2d1;
                            font-size:11px;
                            font-weight:800;
                        ">
                            Site URL
                        </label>

                        <input
                            id="settingSiteUrl"
                            type="url"
                            style="
                                width:100%;
                                height:43px;
                                padding:0 13px;
                                border:1px solid var(--border);
                                border-radius:11px;
                                outline:none;
                                background:#080e18;
                                color:white;
                            "
                        >

                    </div>


                    <div style="
                        margin-bottom:15px;
                    ">

                        <label style="
                            display:block;
                            margin-bottom:7px;
                            color:#b8c2d1;
                            font-size:11px;
                            font-weight:800;
                        ">
                            Admin Name
                        </label>

                        <input
                            id="settingAdminName"
                            type="text"
                            style="
                                width:100%;
                                height:43px;
                                padding:0 13px;
                                border:1px solid var(--border);
                                border-radius:11px;
                                outline:none;
                                background:#080e18;
                                color:white;
                            "
                        >

                    </div>


                    <div style="
                        margin-bottom:15px;
                    ">

                        <label style="
                            display:block;
                            margin-bottom:7px;
                            color:#b8c2d1;
                            font-size:11px;
                            font-weight:800;
                        ">
                            Timezone
                        </label>

                        <select
                            id="settingTimezone"
                            style="
                                width:100%;
                                height:43px;
                                padding:0 13px;
                                border:1px solid var(--border);
                                border-radius:11px;
                                outline:none;
                                background:#080e18;
                                color:white;
                            "
                        >

                            <option value="Asia/Kolkata">
                                Asia/Kolkata
                            </option>

                            <option value="UTC">
                                UTC
                            </option>

                            <option value="Asia/Dubai">
                                Asia/Dubai
                            </option>

                            <option value="Europe/London">
                                Europe/London
                            </option>

                            <option value="America/New_York">
                                America/New_York
                            </option>

                            <option value="America/Los_Angeles">
                                America/Los_Angeles
                            </option>

                        </select>

                    </div>


                    <div>

                        <label style="
                            display:block;
                            margin-bottom:7px;
                            color:#b8c2d1;
                            font-size:11px;
                            font-weight:800;
                        ">
                            Default Commit Message
                        </label>

                        <input
                            id="settingCommitMessage"
                            type="text"
                            style="
                                width:100%;
                                height:43px;
                                padding:0 13px;
                                border:1px solid var(--border);
                                border-radius:11px;
                                outline:none;
                                background:#080e18;
                                color:white;
                            "
                        >

                    </div>

                </div>


                <!-- SECURITY / WORKFLOW -->

                <div style="
                    padding:20px;
                    border:1px solid var(--border);
                    border-radius:16px;
                    background:#0d1522;
                ">

                    <h3 style="
                        margin:0 0 4px;
                        font-size:15px;
                    ">
                        Workflow & Security
                    </h3>


                    <div style="
                        margin-bottom:5px;
                        color:#8995a8;
                        font-size:10px;
                    ">
                        These preferences affect the Admin Panel interface.
                    </div>


                    ${toggleRow(
                        "settingAutoRefresh",
                        "Auto Refresh",
                        "Automatically refresh repository data when requested."
                    )}


                    ${toggleRow(
                        "settingConfirmCommit",
                        "Confirm Before Commit",
                        "Ask for confirmation before committing file changes."
                    )}


                    ${toggleRow(
                        "settingConfirmDeploy",
                        "Confirm Before Deploy",
                        "Require confirmation before deployment actions."
                    )}


                    ${toggleRow(
                        "settingRememberSession",
                        "Remember Session",
                        "Keep the current Admin Panel session for this browser session."
                    )}


                    ${toggleRow(
                        "settingNotifications",
                        "Notifications",
                        "Show Admin Panel success and error notifications."
                    )}


                    ${toggleRow(
                        "settingCompactMode",
                        "Compact Mode",
                        "Use a more compact Admin Panel layout."
                    )}

                </div>


            </div>


            <!-- INFO -->

            <div style="
                margin-top:20px;
                padding:15px 17px;
                border-radius:13px;
                background:rgba(56,189,248,.06);
                border:1px solid rgba(56,189,248,.12);
                color:#a9dff5;
                font-size:11px;
                line-height:1.6;
            ">

                <strong>
                    Security note:
                </strong>

                Admin API credentials and Worker secrets are
                not stored by this settings module.
                Worker secrets should remain inside Cloudflare
                Worker environment secrets.

            </div>

        `;


        content.appendChild(
            panel
        );


        document
            .getElementById(
                "settingsSave"
            )
            .addEventListener(
                "click",
                saveForm
            );


        document
            .getElementById(
                "settingsReset"
            )
            .addEventListener(
                "click",
                resetSettings
            );


        setupToggle(
            "settingAutoRefresh"
        );

        setupToggle(
            "settingConfirmCommit"
        );

        setupToggle(
            "settingConfirmDeploy"
        );

        setupToggle(
            "settingRememberSession"
        );

        setupToggle(
            "settingNotifications"
        );

        setupToggle(
            "settingCompactMode"
        );


        render();

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                '.nav-item[data-page="settings"]'
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
                                            "settingsManagerPanel"
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

        loadSettings();

        createPanel();

        setupNavigation();

        render();

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

    window.CurioPressSettings = {

        get:
            get,

        set:
            set,

        save:
            saveForm,

        reset:
            resetSettings,

        getAll:
            () => ({
                ...settings
            })

    };

})();
