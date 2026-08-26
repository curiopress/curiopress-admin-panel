/* =====================================================
   CurioPress Admin
   Blog Manager
   File: js/blog-manager.js
===================================================== */

(function () {

    "use strict";

    const BLOG_STORAGE_KEY =
        "curiopress_admin_blog_posts";


    /* =====================================================
       HELPERS
    ===================================================== */

    function getPosts() {

        try {

            const saved =
                localStorage.getItem(
                    BLOG_STORAGE_KEY
                );

            if (!saved) {
                return [];
            }

            const posts =
                JSON.parse(saved);

            return Array.isArray(posts)
                ? posts
                : [];

        } catch {

            return [];

        }

    }


    function savePosts(posts) {

        localStorage.setItem(
            BLOG_STORAGE_KEY,
            JSON.stringify(posts)
        );

    }


    function createId() {

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );

    }


    function escapeHtml(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function slugify(text) {

        return String(text || "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

    }


    function formatDate(date) {

        if (!date) {
            return "Unknown";
        }

        try {

            return new Date(date)
                .toLocaleString(
                    undefined,
                    {
                        dateStyle: "medium",
                        timeStyle: "short"
                    }
                );

        } catch {

            return String(date);

        }

    }


    function toast(message) {

        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(message);
            return;

        }

        const element =
            document.getElementById("toast");

        if (!element) {
            return;
        }

        element.textContent =
            message;

        element.classList.add("show");

        setTimeout(
            () =>
                element.classList.remove("show"),
            2800
        );

    }


    /* =====================================================
       BLOG DATA API
    ===================================================== */

    window.CurioPressBlogManager = {

        getAll() {

            return getPosts();

        },


        get(id) {

            return getPosts().find(
                post =>
                    post.id === id
            );

        },


        create(data = {}) {

            const posts =
                getPosts();

            const now =
                new Date().toISOString();

            const post = {

                id:
                    createId(),

                title:
                    String(
                        data.title ||
                        "Untitled Blog Post"
                    ).trim(),

                slug:
                    String(
                        data.slug ||
                        slugify(data.title)
                    ).trim(),

                excerpt:
                    String(
                        data.excerpt || ""
                    ),

                content:
                    String(
                        data.content || ""
                    ),

                category:
                    String(
                        data.category || ""
                    ),

                tags:
                    Array.isArray(data.tags)
                        ? data.tags
                        : [],

                featuredImage:
                    String(
                        data.featuredImage || ""
                    ),

                author:
                    String(
                        data.author || "Admin"
                    ),

                status:
                    data.status ||
                    "Draft",

                seoTitle:
                    String(
                        data.seoTitle || ""
                    ),

                seoDescription:
                    String(
                        data.seoDescription || ""
                    ),

                createdAt:
                    now,

                updatedAt:
                    now,

                publishedAt:
                    data.status === "Published"
                        ? now
                        : null

            };


            posts.unshift(post);

            savePosts(posts);

            return post;

        },


        update(id, changes = {}) {

            const posts =
                getPosts();

            const index =
                posts.findIndex(
                    post =>
                        post.id === id
                );


            if (index === -1) {
                return null;
            }


            const oldStatus =
                posts[index].status;


            posts[index] = {

                ...posts[index],

                ...changes,

                updatedAt:
                    new Date().toISOString()

            };


            if (
                changes.status ===
                    "Published" &&
                oldStatus !==
                    "Published"
            ) {

                posts[index].publishedAt =
                    new Date().toISOString();

            }


            savePosts(posts);

            return posts[index];

        },


        delete(id) {

            const posts =
                getPosts();

            const filtered =
                posts.filter(
                    post =>
                        post.id !== id
                );

            savePosts(filtered);

            return (
                filtered.length !==
                posts.length
            );

        },


        duplicate(id) {

            const original =
                this.get(id);

            if (!original) {
                return null;
            }


            return this.create({

                title:
                    `${original.title} Copy`,

                slug:
                    `${original.slug}-copy`,

                excerpt:
                    original.excerpt,

                content:
                    original.content,

                category:
                    original.category,

                tags:
                    [
                        ...original.tags
                    ],

                featuredImage:
                    original.featuredImage,

                author:
                    original.author,

                status:
                    "Draft",

                seoTitle:
                    original.seoTitle,

                seoDescription:
                    original.seoDescription

            });

        }

    };


    /* =====================================================
       EDITOR
    ===================================================== */

    function openEditor(post = null) {

        const old =
            document.getElementById(
                "blogManagerModal"
            );

        if (old) {
            old.remove();
        }


        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "blogManagerModal";

        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:1200;
            background:rgba(0,0,0,.84);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:18px;
        `;


        const editing =
            Boolean(post);


        modal.innerHTML = `

            <div style="
                width:min(1150px,100%);
                height:min(92vh,900px);
                display:flex;
                flex-direction:column;
                background:#0d1522;
                border:1px solid rgba(255,255,255,.1);
                border-radius:20px;
                overflow:hidden;
                box-shadow:0 30px 100px rgba(0,0,0,.7);
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;
                    padding:16px 18px;
                    border-bottom:1px solid rgba(255,255,255,.08);
                ">

                    <div>

                        <strong style="
                            font-size:17px;
                        ">
                            ${
                                editing
                                    ? "Edit Blog Post"
                                    : "Create Blog Post"
                            }
                        </strong>

                        <div style="
                            margin-top:4px;
                            color:#8995a8;
                            font-size:11px;
                        ">
                            CurioPress Blog Manager
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
                    flex:1;
                    overflow:auto;
                    padding:20px;
                ">

                    <div style="
                        display:grid;
                        grid-template-columns:
                            repeat(2,minmax(0,1fr));
                        gap:15px;
                    ">

                        <div style="
                            grid-column:1/-1;
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
                                value="${escapeHtml(
                                    post?.title || ""
                                )}"
                                placeholder="Enter blog title"
                                style="
                                    width:100%;
                                    height:48px;
                                    padding:0 14px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div>

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
                                value="${escapeHtml(
                                    post?.slug || ""
                                )}"
                                placeholder="blog-post-slug"
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div>

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Category
                            </label>

                            <input
                                id="blogCategory"
                                value="${escapeHtml(
                                    post?.category || ""
                                )}"
                                placeholder="Technology"
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div>

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Author
                            </label>

                            <input
                                id="blogAuthor"
                                value="${escapeHtml(
                                    post?.author ||
                                    "Admin"
                                )}"
                                placeholder="Author"
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div>

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Status
                            </label>

                            <select
                                id="blogStatus"
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                                <option
                                    value="Draft"
                                    ${
                                        post?.status ===
                                        "Draft"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Draft
                                </option>

                                <option
                                    value="Scheduled"
                                    ${
                                        post?.status ===
                                        "Scheduled"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Scheduled
                                </option>

                                <option
                                    value="Published"
                                    ${
                                        post?.status ===
                                        "Published"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Published
                                </option>

                            </select>

                        </div>


                        <div style="
                            grid-column:1/-1;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Featured Image URL
                            </label>

                            <input
                                id="blogImage"
                                value="${escapeHtml(
                                    post?.featuredImage ||
                                    ""
                                )}"
                                placeholder="https://..."
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div style="
                            grid-column:1/-1;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Excerpt
                            </label>

                            <textarea
                                id="blogExcerpt"
                                placeholder="Short article description..."
                                style="
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
                                "
                            >${escapeHtml(
                                post?.excerpt || ""
                            )}</textarea>

                        </div>


                        <div style="
                            grid-column:1/-1;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                Article Content
                            </label>

                            <textarea
                                id="blogContent"
                                spellcheck="false"
                                placeholder="Write the complete article here..."
                                style="
                                    width:100%;
                                    min-height:350px;
                                    padding:15px;
                                    resize:vertical;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:#d9e3f0;
                                    outline:none;
                                    font-family:
                                        ui-monospace,
                                        SFMono-Regular,
                                        Menlo,
                                        Consolas,
                                        monospace;
                                    font-size:13px;
                                    line-height:1.65;
                                "
                            >${escapeHtml(
                                post?.content || ""
                            )}</textarea>

                        </div>


                        <div style="
                            grid-column:1/-1;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                SEO Title
                            </label>

                            <input
                                id="blogSeoTitle"
                                value="${escapeHtml(
                                    post?.seoTitle || ""
                                )}"
                                maxlength="60"
                                placeholder="SEO optimized title"
                                style="
                                    width:100%;
                                    height:46px;
                                    padding:0 13px;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                "
                            >

                        </div>


                        <div style="
                            grid-column:1/-1;
                        ">

                            <label style="
                                display:block;
                                margin-bottom:7px;
                                color:#b8c2d1;
                                font-size:12px;
                                font-weight:700;
                            ">
                                SEO Description
                            </label>

                            <textarea
                                id="blogSeoDescription"
                                maxlength="160"
                                placeholder="SEO meta description"
                                style="
                                    width:100%;
                                    min-height:80px;
                                    padding:13px;
                                    resize:vertical;
                                    border:1px solid rgba(255,255,255,.08);
                                    border-radius:11px;
                                    background:#080e19;
                                    color:white;
                                    outline:none;
                                    font:inherit;
                                "
                            >${escapeHtml(
                                post?.seoDescription ||
                                ""
                            )}</textarea>

                        </div>

                    </div>

                </div>


                <div style="
                    display:flex;
                    justify-content:flex-end;
                    gap:8px;
                    padding:13px 18px;
                    border-top:1px solid rgba(255,255,255,.08);
                ">

                    <button
                        class="button"
                        id="blogCancel"
                    >
                        Cancel
                    </button>

                    <button
                        class="button button-primary"
                        id="blogSave"
                    >
                        ${
                            editing
                                ? "Save Changes"
                                : "Create Blog"
                        }
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        const title =
            modal.querySelector(
                "#blogTitle"
            );

        const slug =
            modal.querySelector(
                "#blogSlug"
            );


        title.addEventListener(
            "input",
            () => {

                if (
                    !slug.value.trim()
                ) {

                    slug.value =
                        slugify(
                            title.value
                        );

                }

            }
        );


        function close() {
            modal.remove();
        }


        modal.querySelector(
            "#blogClose"
        ).addEventListener(
            "click",
            close
        );


        modal.querySelector(
            "#blogCancel"
        ).addEventListener(
            "click",
            close
        );


        modal.querySelector(
            "#blogSave"
        ).addEventListener(
            "click",
            () => {

                const values = {

                    title:
                        title.value.trim(),

                    slug:
                        slug.value.trim() ||
                        slugify(
                            title.value
                        ),

                    category:
                        modal.querySelector(
                            "#blogCategory"
                        ).value.trim(),

                    author:
                        modal.querySelector(
                            "#blogAuthor"
                        ).value.trim() ||
                        "Admin",

                    status:
                        modal.querySelector(
                            "#blogStatus"
                        ).value,

                    featuredImage:
                        modal.querySelector(
                            "#blogImage"
                        ).value.trim(),

                    excerpt:
                        modal.querySelector(
                            "#blogExcerpt"
                        ).value.trim(),

                    content:
                        modal.querySelector(
                            "#blogContent"
                        ).value,

                    seoTitle:
                        modal.querySelector(
                            "#blogSeoTitle"
                        ).value.trim(),

                    seoDescription:
                        modal.querySelector(
                            "#blogSeoDescription"
                        ).value.trim()

                };


                if (!values.title) {

                    toast(
                        "Blog title is required."
                    );

                    title.focus();

                    return;

                }


                if (editing) {

                    window
                        .CurioPressBlogManager
                        .update(
                            post.id,
                            values
                        );

                    toast(
                        "Blog post updated successfully."
                    );

                } else {

                    window
                        .CurioPressBlogManager
                        .create(
                            values
                        );

                    toast(
                        "Blog post created successfully."
                    );

                }


                close();

                renderBlogManager();

            }

        );

    }


    /* =====================================================
       BLOG LIST
    ===================================================== */

    function renderBlogManager() {

        const container =
            document.getElementById(
                "blogManagerContainer"
            );


        if (!container) {
            return;
        }


        const posts =
            getPosts();


        const list =
            container.querySelector(
                "#blogPostsList"
            );


        if (!list) {
            return;
        }


        if (!posts.length) {

            list.innerHTML = `

                <div style="
                    padding:35px 15px;
                    text-align:center;
                    color:#8995a8;
                ">

                    <div style="
                        font-size:30px;
                        margin-bottom:10px;
                    ">
                        ✦
                    </div>

                    <strong style="
                        display:block;
                        color:#d9e3f0;
                        margin-bottom:6px;
                    ">
                        No blog posts yet
                    </strong>

                    <span style="
                        font-size:12px;
                    ">
                        Create your first blog post.
                    </span>

                </div>

            `;

            return;

        }


        list.innerHTML =
            posts.map(
                post => `

                    <div
                        class="change"
                        style="
                            align-items:center;
                        "
                    >

                        <div class="change-icon">
                            ✦
                        </div>


                        <div style="
                            flex:1;
                            min-width:0;
                        ">

                            <strong>
                                ${escapeHtml(
                                    post.title
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    post.category ||
                                    "Uncategorized"
                                )}
                                ·
                                ${escapeHtml(
                                    post.status
                                )}
                                ·
                                ${escapeHtml(
                                    formatDate(
                                        post.updatedAt
                                    )
                                )}
                            </span>

                        </div>


                        <div style="
                            display:flex;
                            gap:6px;
                            flex-wrap:wrap;
                        ">

                            <button
                                class="mini-button"
                                data-blog-edit="${escapeHtml(post.id)}"
                            >
                                Edit
                            </button>

                            <button
                                class="mini-button"
                                data-blog-preview="${escapeHtml(post.id)}"
                            >
                                Preview
                            </button>

                            <button
                                class="mini-button"
                                data-blog-copy="${escapeHtml(post.id)}"
                            >
                                Duplicate
                            </button>

                            <button
                                class="mini-button"
                                data-blog-delete="${escapeHtml(post.id)}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");


        list
            .querySelectorAll(
                "[data-blog-edit]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const post =
                                window
                                    .CurioPressBlogManager
                                    .get(
                                        button.dataset
                                            .blogEdit
                                    );

                            if (post) {
                                openEditor(
                                    post
                                );
                            }

                        }
                    );

                }
            );


        list
            .querySelectorAll(
                "[data-blog-preview]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const post =
                                window
                                    .CurioPressBlogManager
                                    .get(
                                        button.dataset
                                            .blogPreview
                                    );

                            if (post) {
                                previewPost(
                                    post
                                );
                            }

                        }
                    );

                }
            );


        list
            .querySelectorAll(
                "[data-blog-copy]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            window
                                .CurioPressBlogManager
                                .duplicate(
                                    button.dataset
                                        .blogCopy
                                );

                            toast(
                                "Blog post duplicated."
                            );

                            renderBlogManager();

                        }
                    );

                }
            );


        list
            .querySelectorAll(
                "[data-blog-delete]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const post =
                                window
                                    .CurioPressBlogManager
                                    .get(
                                        button.dataset
                                            .blogDelete
                                    );

                            if (!post) {
                                return;
                            }


                            if (
                                !confirm(
                                    `Delete "${post.title}"?`
                                )
                            ) {
                                return;
                            }


                            window
                                .CurioPressBlogManager
                                .delete(
                                    post.id
                                );

                            toast(
                                "Blog post deleted."
                            );

                            renderBlogManager();

                        }
                    );

                }
            );

    }


    /* =====================================================
       PREVIEW
    ===================================================== */

    function previewPost(post) {

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


        const content =
            String(
                post.content || ""
            )
            .replace(
                /\n/g,
                "<br>"
            );


        preview.document.open();


        preview.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <meta
                    charset="UTF-8"
                >

                <meta
                    name="viewport"
                    content="width=device-width,initial-scale=1"
                >

                <title>
                    ${escapeHtml(
                        post.title
                    )}
                </title>

                <style>

                    body {
                        margin:0;
                        background:#080d18;
                        color:#f5f7fb;
                        font-family:
                            Inter,
                            system-ui,
                            sans-serif;
                    }

                    article {
                        width:min(850px,92%);
                        margin:60px auto;
                    }

                    h1 {
                        font-size:
                            clamp(
                                32px,
                                6vw,
                                56px
                            );
                        line-height:1.1;
                        margin-bottom:15px;
                    }

                    .meta {
                        color:#8995a8;
                        margin-bottom:35px;
                    }

                    .excerpt {
                        font-size:18px;
                        color:#b8c2d1;
                        line-height:1.7;
                        margin-bottom:30px;
                    }

                    .content {
                        font-size:16px;
                        line-height:1.9;
                    }

                    img {
                        max-width:100%;
                        border-radius:14px;
                    }

                </style>

            </head>

            <body>

                <article>

                    ${
                        post.featuredImage
                            ? `
                                <img
                                    src="${escapeHtml(
                                        post.featuredImage
                                    )}"
                                    alt="${escapeHtml(
                                        post.title
                                    )}"
                                >
                              `
                            : ""
                    }

                    <h1>
                        ${escapeHtml(
                            post.title
                        )}
                    </h1>

                    <div class="meta">
                        ${escapeHtml(
                            post.author
                        )}
                        ·
                        ${escapeHtml(
                            post.category
                        )}
                        ·
                        ${escapeHtml(
                            post.status
                        )}
                    </div>

                    <div class="excerpt">
                        ${escapeHtml(
                            post.excerpt
                        )}
                    </div>

                    <div class="content">
                        ${content}
                    </div>

                </article>

            </body>

            </html>

        `);


        preview.document.close();

    }


    /* =====================================================
       INITIALIZE UI
    ===================================================== */

    function initialize() {

        let container =
            document.getElementById(
                "blogManagerContainer"
            );


        if (!container) {

            container =
                document.createElement(
                    "section"
                );

            container.id =
                "blogManagerContainer";

            container.className =
                "panel";

            container.style.marginTop =
                "20px";


            container.innerHTML = `

                <div class="panel-header">

                    <div>

                        <h2>
                            Blog Manager
                        </h2>

                        <span>
                            Create and manage CurioPress blog posts
                        </span>

                    </div>

                    <button
                        class="button button-primary"
                        id="newBlogButton"
                    >
                        New Blog
                    </button>

                </div>


                <div
                    id="blogPostsList"
                    class="file-list"
                ></div>

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


        const newButton =
            container.querySelector(
                "#newBlogButton"
            );


        if (
            newButton &&
            !newButton.dataset.bound
        ) {

            newButton.dataset.bound =
                "true";


            newButton.addEventListener(
                "click",
                () =>
                    openEditor()
            );

        }


        renderBlogManager();

    }


    /* =====================================================
       PUBLIC UI API
    ===================================================== */

    window.CurioPressBlogUI = {

        open:
            openEditor,

        refresh:
            renderBlogManager,

        preview:
            previewPost,

        initialize

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
