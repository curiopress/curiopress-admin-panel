/* =====================================================
   CURIOPRESS ADMIN AUTHENTICATION
===================================================== */

(function () {

    "use strict";


    /* =================================================
       ELEMENTS
    ================================================= */

    const loginScreen =
        document.getElementById("loginScreen");

    const app =
        document.getElementById("app");

    const loginForm =
        document.getElementById("loginForm");

    const adminKeyInput =
        document.getElementById("adminKey");

    const loginError =
        document.getElementById("loginError");


    /* =================================================
       CHECK REQUIRED ELEMENTS
    ================================================= */

    if (!loginScreen ||
        !app ||
        !loginForm ||
        !adminKeyInput ||
        !loginError) {

        console.error(
            "CurioPress Auth: Required login elements not found."
        );

        return;

    }


    /* =================================================
       SHOW LOGIN
    ================================================= */

    function showLogin() {

        loginScreen.style.display =
            "flex";

        app.style.display =
            "none";

    }


    /* =================================================
       SHOW APP
    ================================================= */

    function showApp() {

        loginScreen.style.display =
            "none";

        app.style.display =
            "block";

    }


    /* =================================================
       SHOW ERROR
    ================================================= */

    function showLoginError(
        message
    ) {

        loginError.textContent =
            message ||
            "Invalid Admin Key.";

        loginError.style.display =
            "block";

    }


    /* =================================================
       HIDE ERROR
    ================================================= */

    function hideLoginError() {

        loginError.style.display =
            "none";

    }


    /* =================================================
       SET BUTTON STATE
    ================================================= */

    function setLoginButton(
        loading
    ) {

        const button =
            loginForm.querySelector(
                "button[type='submit']"
            );


        if (!button) {

            return;

        }


        button.disabled =
            loading;


        button.textContent =
            loading
                ? "Connecting..."
                : "Enter Admin Panel";

    }


    /* =================================================
       LOGIN
    ================================================= */

    async function login(
        key
    ) {

        if (!key) {

            showLoginError(
                "Please enter your Admin Key."
            );

            return false;

        }


        hideLoginError();

        setLoginButton(true);


        try {

            const valid =
                await CurioPressAPI.verifyAdminKey(
                    key
                );


            if (!valid) {

                throw new Error(
                    "Invalid Admin Key."
                );

            }


            CurioPressAPI.setAdminKey(
                key
            );


            showApp();


            if (
                typeof window.loadRepository ===
                "function"
            ) {

                await window.loadRepository();

            }


            if (
                typeof window.showToast ===
                "function"
            ) {

                window.showToast(
                    "Welcome to CurioPress Admin"
                );

            }


            return true;

        } catch (error) {

            showLoginError(
                CurioPressAPI.getApiErrorMessage(
                    error
                )
            );

            return false;

        } finally {

            setLoginButton(false);

        }

    }


    /* =================================================
       LOGOUT
    ================================================= */

    function logout() {

        CurioPressAPI.clearAdminKey();

        showLogin();

        adminKeyInput.value = "";

        hideLoginError();

    }


    /* =================================================
       LOGIN FORM
    ================================================= */

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const key =
                adminKeyInput.value.trim();


            await login(key);

        }
    );


    /* =================================================
       RESTORE SESSION
    ================================================= */

    async function restoreSession() {

        const savedKey =
            CurioPressAPI.getAdminKey();


        if (!savedKey) {

            showLogin();

            return false;

        }


        try {

            const valid =
                await CurioPressAPI.verifyAdminKey(
                    savedKey
                );


            if (!valid) {

                CurioPressAPI.clearAdminKey();

                showLogin();

                return false;

            }


            showApp();


            if (
                typeof window.loadRepository ===
                "function"
            ) {

                await window.loadRepository();

            }


            return true;

        } catch {

            CurioPressAPI.clearAdminKey();

            showLogin();

            return false;

        }

    }


    /* =================================================
       PUBLIC AUTH OBJECT
    ================================================= */

    window.CurioPressAuth = {

        login,

        logout,

        restoreSession,

        showLogin,

        showApp,

        getKey: function () {

            return CurioPressAPI.getAdminKey();

        }

    };


    /* =================================================
       LOGOUT BUTTON
    ================================================= */

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                logout();

                location.reload();

            }
        );

    }


    /* =================================================
       INITIAL SESSION CHECK
    ================================================= */

    restoreSession();

})();
