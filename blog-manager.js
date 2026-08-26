/*
=========================================================
 CURIOPRESS ADMIN PANEL
 BLOG MANAGER MODULE
=========================================================
*/

(function () {

    "use strict";


    const BLOG_FOLDER = "blog";


    /* =====================================================
       HELPERS
    ===================================================== */

    function toast(message) {

        if (typeof window.showToast === "function") {

            window.showToast(message);

            return;

        }


        const element =
            document.getElementById("toast");


        if (!element) return;


        element.textContent = message;

        element.classList.add("show");


        setTimeout(() => {

            element.classList.remove("show");

        }, 2800);

    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    async function api(
        endpoint,
        options = {}
    ) {

        if (
            typeof window.apiRequest !==
            "function"
        ) {

            throw new Error(
                "Admin API is not available."
            );

        }


        return await window.apiRequest(
            endpoint,
            options
        );

    }


    /* =====================================================
       CREATE BLOG WINDOW
    ===================================================== */

    function openBlogManager() {

        const old =
            document.getElementById(
                "blogManagerModal"
            );


        if (old) old.remove();


        const modal =
            document.createElement("div");


        modal.id =
            "blogManagerModal";


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:1100;
            background:rgba(0,0,0,.82);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:18px;
        `;


        modal.innerHTML = `

            <div style="
                width:min(1100px,100%);
                height:min(88vh,850px);
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
                    padding:16px 20px;
                    border-bottom:1px solid rgba(255,255,255,.08);
                ">

                    <div>

                        <strong style="
                            font-size:17px;
                        ">
                            Blog Manager
                        </strong>

                        <div style="
                            margin-top:4px;
                            color:#8995a8;
                            font-size:11px;
                        ">
                            Create and manage CurioPress articles
                        </div>

                    </div>


                    <button
                        class="mini-button"
                        id="blogClose"
                    >
                        Close
                    </button>

                </div>


                <div style="
                    display:grid;
                    grid-template-columns:minmax(0,1fr) 280px;
                    flex:1;
                    min-height:0;
                ">

                    <div style="
                        padding:20px;
                        overflow:auto;
                    ">

                        <label style="
                            display:block;
                            margin-bottom:7px;
                            color:#b8c2d1;
                            font-size:12px;
                            font-weight:700;
                        ">
                            Blog Title
                        </label>

                        <input
                            id="blogTitle"
                            type="text"
                            placeholder="Enter blog title"
                            style="
                                width:100%;
                                height:46px;
                                padding:0 13px;
                                margin-bottom:16px;
                                border:1px solid rgba(255,255,255,.08);
                                border-radius:11px;
                                outline:none;
                                background:#080e19;
                                color:#f5f7fb;
                            "
                        >


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
                            id="blogSlug"
                            type="text"
                            placeholder="my-blog-post"
                            style="
                                width:100%;
                                height:46px;
                                padding:0 13px;
                                margin-bottom:16px;
                                border:1px solid rgba(255,255,255,.08);
                                border-radius:11px;
                                outline:none;
                                background:#080e19;
                                color:#f5f7fb;
                            "
                        >


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
                            id="blogContent"
                            spellcheck="false"
                            placeholder="Write your blog HTML/content here..."
                            style="
                                width:100%;
                                min-height:420px;
                                resize:vertical;
                                padding:15px;
                                border:1px solid rgba(255,255,255,.08);
                                border-radius:11px;
                                outline:none;
                                background:#080e19;
                                color:#d9e3f0;
                                font-family:ui-monospace,monospace;
                                font-size:13px;
                                line-height:1.6;
                            "
                        ></textarea>

                    </div>


                    <aside style="
                        padding:20px;
                        border-left:1px solid rgba(255,255,255,.08);
                        overflow:auto;
                    ">

                        <strong style="
                            font-size:13px;
                        ">
                            Blog Settings
                        </strong>


                        <div style="
                            margin-top:18px;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#8995a8;
                                font-size:11px;
                            ">
                                Description
                            </label>

                            <textarea
                                id="blogDescription"
                                placeholder="SEO description"
                                style="
                                    width:100%;
                                    min-height:100px;
                                    padding:12px;
                                    resize:vertical;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:10px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            ></textarea>

                        </div>


                        <div style="
                            margin-top:16px;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#8995a8;
                                font-size:11px;
                            ">
                                Author
                            </label>

                            <input
                                id="blogAuthor"
                                type="text"
                                value="CurioPress"
                                style="
                                    width:100%;
                                    height:42px;
                                    padding:0 11px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:10px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div style="
                            margin-top:20px;
                            display:flex;
                            flex-direction:column;
                            gap:9px;
                        ">

                            <button
                                class="button"
                                id="blogPreview"
                            >
                                Preview
                            </button>

                            <button
                                class="button button-primary"
                                id="blogSave"
                            >
                                Create Blog
                            </button>

                        </div>


                        <div style="
                            margin-top:20px;
                            padding:12px;
                            border:1px solid rgba(255,255,255,.07);
                            border-radius:11px;
                            color:#8995a8;
                            font-size:10px;
                            line-height:1.6;
                        ">
                            The article will be created through
                            the existing Admin API and committed
                            directly to the configured GitHub
                            repository.
                        </div>

                    </aside>

                </div>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        const title =
            document.getElementById(
                "blogTitle"
            );


        const slug =
            document.getElementById(
                "blogSlug"
            );


        title.addEventListener(
            "input",
            () => {

                if (
                    slug.dataset.manual ===
                    "true"
                ) {

                    return;

                }


                slug.value =
                    createSlug(
                        title.value
                    );

            }
        );


        slug.addEventListener(
            "input",
            () => {

                slug.dataset.manual =
                    "true";

            }
        );


        document
            .getElementById(
                "blogClose"
            )
            .addEventListener(
                "click",
                () => modal.remove()
            );


        document
            .getElementById(
                "blogPreview"
            )
            .addEventListener(
                "click",
                previewBlog
            );


        document
            .getElementById(
                "blogSave"
            )
            .addEventListener(
                "click",
                createBlog
            );


        title.focus();

    }


    /* =====================================================
       SLUG GENERATOR
    ===================================================== */

    function createSlug(
        value
    ) {

        return String(value || "")
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9\s-]/g,
                ""
            )
            .replace(
                /\s+/g,
                "-"
            )
            .replace(
                /-+/g,
                "-"
            );

    }


    /* =====================================================
       BLOG HTML GENERATOR
    ===================================================== */

    function buildBlogHTML(
        title,
        description,
        author,
        content
    ) {

        return `<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>${escapeHTML(title)} | CurioPress</title>

<meta
    name="description"
    content="${escapeHTML(description)}"
>

<meta
    name="author"
    content="${escapeHTML(author)}"
>

</head>

<body>

<main>

<article>

<header>

<h1>
${escapeHTML(title)}
</h1>

<p>
${escapeHTML(description)}
</p>

</header>

<div class="article-content">

${content}

</div>

<footer>

<p>
By ${escapeHTML(author)}
</p>

</footer>

</article>

</main>

</body>

</html>`;

    }


    /* =====================================================
       PREVIEW
    ===================================================== */

    function previewBlog() {

        const title =
            document.getElementById(
                "blogTitle"
            ).value.trim();


        const description =
            document.getElementById(
                "blogDescription"
            ).value.trim();


        const author =
            document.getElementById(
                "blogAuthor"
            ).value.trim();


        const content =
            document.getElementById(
                "blogContent"
            ).value;


        if (!title) {

            toast(
                "Enter a blog title first."
            );

            return;

        }


        const html =
            buildBlogHTML(
                title,
                description,
                author,
                content
            );


        const preview =
            window.open(
                "",
                "_blank"
            );


        if (!preview) {

            toast(
                "Allow pop-ups to preview the blog."
            );

            return;

        }


        preview.document.open();

        preview.document.write(
            html
        );

        preview.document.close();

    }


    /* =====================================================
       CREATE BLOG
    ===================================================== */

    async function createBlog() {

        const title =
            document.getElementById(
                "blogTitle"
            ).value.trim();


        const slug =
            document.getElementById(
                "blogSlug"
            ).value.trim();


        const description =
            document.getElementById(
                "blogDescription"
            ).value.trim();


        const author =
            document.getElementById(
                "blogAuthor"
            ).value.trim() ||
            "CurioPress";


        const content =
            document.getElementById(
                "blogContent"
            ).value;


        if (!title) {

            toast(
                "Blog title is required."
            );

            return;

        }


        if (!slug) {

            toast(
                "Blog slug is required."
            );

            return;

        }


        if (!content.trim()) {

            toast(
                "Blog content is required."
            );

            return;

        }


        const filename =
            `${BLOG_FOLDER}/${slug}.html`;


        const confirmed =
            confirm(
                `Create ${filename}?`
            );


        if (!confirmed) {

            return;

        }


        const button =
            document.getElementById(
                "blogSave"
            );


        button.disabled =
            true;


        button.textContent =
            "Creating...";


        try {

            const html =
                buildBlogHTML(
                    title,
                    description,
                    author,
                    content
                );


            await api(
                "/api/file",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({

                            path:
                                filename,

                            content:
                                html,

                            message:
                                `Create blog: ${title}`

                        })

                }
            );


            toast(
                "Blog created successfully."
            );


            const modal =
                document.getElementById(
                    "blogManagerModal"
                );


            if (modal) {

                modal.remove();

            }


            if (
                typeof window.loadFiles ===
                "function"
            ) {

                await window.loadFiles(
                    BLOG_FOLDER
                );

            }

        } catch (error) {

            toast(
                `Blog creation failed: ${error.message}`
            );

        } finally {

            button.disabled =
                false;

            button.textContent =
                "Create Blog";

        }

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.CurioPressBlogManager = {

        open:
            openBlogManager,

        create:
            createBlog,

        preview:
            previewBlog

    };


    /* =====================================================
       BLOG NAVIGATION
    ===================================================== */

    function bindBlogNavigation() {

        document
            .querySelectorAll(
                '[data-page="blog"]'
            )
            .forEach(
                button => {

                    if (
                        button.dataset
                            .blogBound ===
                        "true"
                    ) {

                        return;

                    }


                    button.dataset
                        .blogBound =
                        "true";


                    button.addEventListener(
                        "dblclick",
                        openBlogManager
                    );

                }
            );


        document
            .querySelectorAll(
                '[data-action="blog"]'
            )
            .forEach(
                button => {

                    if (
                        button.dataset
                            .blogBound ===
                        "true"
                    ) {

                        return;

                    }


                    button.dataset
                        .blogBound =
                        "true";


                    button.addEventListener(
                        "dblclick",
                        openBlogManager
                    );

                }
            );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            bindBlogNavigation
        );

    } else {

        bindBlogNavigation();

    }


})();
