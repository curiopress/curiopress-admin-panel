/* =====================================================
   CURIOPRESS ADMIN UI
   Toasts, sidebar, navigation and common UI helpers
===================================================== */

(function () {

    "use strict";


    /* =================================================
       ELEMENTS
    ================================================= */

    const sidebar =
        document.getElementById("sidebar");

    const mobileMenu =
        document.getElementById("mobileMenu");

    const toast =
        document.getElementById("toast");


    /* =================================================
       TOAST
    ================================================= */

    let toastTimer = null;


    function showToast(
        message,
        duration = 2800
    ) {

        if (!toast) {

            return;

        }


        toast.textContent =
            message || "";


        toast.classList.add(
            "show"
        );


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(
                function () {

                    toast.classList.remove(
                        "show"
                    );

                },
                duration
            );

    }


    /* =================================================
       HIDE TOAST
    ================================================= */

    function hideToast() {

        if (!toast) {

            return;

        }


        toast.classList.remove(
            "show"
        );

    }


    /* =================================================
       MOBILE SIDEBAR
    ================================================= */

    function toggleSidebar() {

        if (!sidebar) {

            return;

        }


        sidebar.classList.toggle(
            "open"
        );

    }


    function closeSidebar() {

        if (!sidebar) {

            return;

        }


        sidebar.classList.remove(
            "open"
        );

    }


    if (mobileMenu) {

        mobileMenu.addEventListener(
            "click",
            toggleSidebar
        );

    }


    /* =================================================
       NAVIGATION ACTIVE STATE
    ================================================= */

    function setActiveNav(
        page
    ) {

        document
            .querySelectorAll(
                ".nav-item[data-page]"
            )
            .forEach(
                function (item) {

                    item.classList.toggle(
                        "active",
                        item.dataset.page ===
                        page
                    );

                }
            );

    }


    /* =================================================
       PAGE TITLE
    ================================================= */

    function setPageTitle(
        title,
        description = ""
    ) {

        const titleElement =
            document.querySelector(
                ".page-title h1"
            );


        const descriptionElement =
            document.querySelector(
                ".page-title p"
            );


        if (titleElement) {

            titleElement.textContent =
                title;

        }


        if (
            descriptionElement &&
            description
        ) {

            descriptionElement.textContent =
                description;

        }

    }


    /* =================================================
       HTML ESCAPE
    ================================================= */

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
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


    /* =================================================
       LOADING HTML
    ================================================= */

    function loading(
        message = "Loading..."
    ) {

        return `
            <div style="
                padding:30px;
                text-align:center;
                color:#8995a8;
                font-size:13px;
            ">
                ${escapeHtml(message)}
            </div>
        `;

    }


    /* =================================================
       EMPTY STATE
    ================================================= */

    function emptyState(
        message = "Nothing found."
    ) {

        return `
            <div style="
                padding:30px;
                text-align:center;
                color:#8995a8;
                font-size:13px;
            ">
                ${escapeHtml(message)}
            </div>
        `;

    }


    /* =================================================
       ERROR STATE
    ================================================= */

    function errorState(
        message = "Something went wrong."
    ) {

        return `
            <div style="
                padding:30px;
                text-align:center;
                color:#fb7185;
                font-size:13px;
            ">
                ${escapeHtml(message)}
            </div>
        `;

    }


    /* =================================================
       CONFIRM ACTION
    ================================================= */

    function confirmAction(
        message
    ) {

        return window.confirm(
            message ||
            "Are you sure?"
        );

    }


    /* =================================================
       DISABLE BUTTON
    ================================================= */

    function setButtonLoading(
        button,
        loading,
        loadingText = "Loading..."
    ) {

        if (!button) {

            return;

        }


        if (loading) {

            if (
                !button.dataset.originalText
            ) {

                button.dataset.originalText =
                    button.textContent;

            }


            button.disabled =
                true;

            button.textContent =
                loadingText;

        } else {

            button.disabled =
                false;

            button.textContent =
                button.dataset.originalText ||
                button.textContent;

        }

    }


    /* =================================================
       MODAL
    ================================================= */

    function closeModal(
        modal
    ) {

        if (!modal) {

            return;

        }


        modal.remove();

    }


    /* =================================================
       GLOBAL CLICK
       CLOSE SIDEBAR AFTER NAVIGATION
    ================================================= */

    document.addEventListener(
        "click",
        function (event) {

            const nav =
                event.target.closest(
                    ".nav-item[data-page]"
                );


            if (nav) {

                closeSidebar();

            }

        }
    );


    /* =================================================
       PUBLIC UI OBJECT
    ================================================= */

    window.CurioPressUI = {

        showToast,

        hideToast,

        toggleSidebar,

        closeSidebar,

        setActiveNav,

        setPageTitle,

        escapeHtml,

        loading,

        emptyState,

        errorState,

        confirmAction,

        setButtonLoading,

        closeModal

    };


    /* =================================================
       GLOBAL COMPATIBILITY
       Keeps existing index.html functions working
    ================================================= */

    window.showToast =
        showToast;

    window.escapeHtml =
        escapeHtml;

})();
