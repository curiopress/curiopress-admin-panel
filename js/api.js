/* =====================================================
   CURIOPRESS ADMIN API
   Central API communication layer
===================================================== */

const CURIOPRESS_API_URL =
    "https://curiopress-admin-api.curiopress31.workers.dev";


/* =====================================================
   API URL
===================================================== */

function getApiUrl() {

    return CURIOPRESS_API_URL;

}


/* =====================================================
   ADMIN KEY
===================================================== */

function getAdminKey() {

    return sessionStorage.getItem(
        "curiopress_admin_key"
    );

}


function setAdminKey(key) {

    sessionStorage.setItem(
        "curiopress_admin_key",
        key
    );

}


function clearAdminKey() {

    sessionStorage.removeItem(
        "curiopress_admin_key"
    );

}


/* =====================================================
   AUTH HEADERS
===================================================== */

function getAuthHeaders() {

    const key =
        getAdminKey();

    return {

        "Authorization":
            `Bearer ${key}`,

        "Content-Type":
            "application/json"

    };

}


/* =====================================================
   MAIN API REQUEST
===================================================== */

async function apiRequest(
    endpoint,
    options = {}
) {

    const headers = {

        ...getAuthHeaders(),

        ...(options.headers || {})

    };


    const response =
        await fetch(
            `${CURIOPRESS_API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );


    let data;


    try {

        data =
            await response.json();

    } catch {

        data = {

            success: false,

            error:
                "Invalid response from API"

        };

    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
            `API request failed (${response.status})`
        );

    }


    return data;

}


/* =====================================================
   PUBLIC API REQUEST
   Used only when authentication is not required
===================================================== */

async function publicApiRequest(
    endpoint,
    options = {}
) {

    const response =
        await fetch(
            `${CURIOPRESS_API_URL}${endpoint}`,
            {
                ...options
            }
        );


    let data;


    try {

        data =
            await response.json();

    } catch {

        data = {

            success: false,

            error:
                "Invalid response from API"

        };

    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
            `API request failed (${response.status})`
        );

    }


    return data;

}


/* =====================================================
   VERIFY ADMIN KEY
===================================================== */

async function verifyAdminKey(key) {

    if (!key) {

        return false;

    }


    try {

        const response =
            await fetch(
                `${CURIOPRESS_API_URL}/api/repository`,
                {
                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${key}`

                    }
                }
            );


        return response.ok;

    } catch {

        return false;

    }

}


/* =====================================================
   REPOSITORY
===================================================== */

async function getRepository() {

    return await apiRequest(
        "/api/repository"
    );

}


/* =====================================================
   FILES
===================================================== */

async function getFiles(
    path = ""
) {

    return await apiRequest(
        `/api/files?path=${encodeURIComponent(path)}`
    );

}


/* =====================================================
   SINGLE FILE
===================================================== */

async function getFile(
    path
) {

    if (!path) {

        throw new Error(
            "File path is required"
        );

    }


    return await apiRequest(
        `/api/file?path=${encodeURIComponent(path)}`
    );

}


/* =====================================================
   CREATE FILE
===================================================== */

async function createFile(
    path,
    content,
    message = ""
) {

    if (!path) {

        throw new Error(
            "File path is required"
        );

    }


    if (typeof content !== "string") {

        throw new Error(
            "File content must be text"
        );

    }


    return await apiRequest(
        "/api/file",
        {

            method: "POST",

            body:
                JSON.stringify({

                    path,

                    content,

                    message:
                        message ||
                        `Create ${path}`

                })

        }
    );

}


/* =====================================================
   UPDATE FILE
===================================================== */

async function updateFile(
    path,
    content,
    sha = "",
    message = ""
) {

    if (!path) {

        throw new Error(
            "File path is required"
        );

    }


    if (typeof content !== "string") {

        throw new Error(
            "File content must be text"
        );

    }


    return await apiRequest(
        "/api/file",
        {

            method: "PUT",

            body:
                JSON.stringify({

                    path,

                    content,

                    sha,

                    message:
                        message ||
                        `Update ${path}`

                })

        }
    );

}


/* =====================================================
   DELETE FILE
===================================================== */

async function deleteFile(
    path,
    sha = "",
    message = ""
) {

    if (!path) {

        throw new Error(
            "File path is required"
        );

    }


    return await apiRequest(
        "/api/file",
        {

            method: "DELETE",

            body:
                JSON.stringify({

                    path,

                    sha,

                    message:
                        message ||
                        `Delete ${path}`

                })

        }
    );

}


/* =====================================================
   SEARCH
===================================================== */

async function searchRepository(
    query
) {

    if (!query) {

        throw new Error(
            "Search query is required"
        );

    }


    return await apiRequest(
        `/api/search?q=${encodeURIComponent(query)}`
    );

}


/* =====================================================
   COMMITS
===================================================== */

async function getCommits() {

    return await apiRequest(
        "/api/commits"
    );

}


/* =====================================================
   API HEALTH
===================================================== */

async function checkApiStatus() {

    try {

        const data =
            await publicApiRequest(
                "/"
            );


        return {

            online:
                data.success === true,

            data

        };

    } catch (error) {

        return {

            online: false,

            error:
                error.message

        };

    }

}


/* =====================================================
   SAFE API ERROR
===================================================== */

function getApiErrorMessage(
    error
) {

    if (
        error &&
        error.message
    ) {

        return error.message;

    }


    return "Something went wrong while contacting the API.";

}


/* =====================================================
   EXPORT GLOBAL API OBJECT
===================================================== */

window.CurioPressAPI = {

    getApiUrl,

    getAdminKey,

    setAdminKey,

    clearAdminKey,

    getAuthHeaders,

    apiRequest,

    publicApiRequest,

    verifyAdminKey,

    getRepository,

    getFiles,

    getFile,

    createFile,

    updateFile,

    deleteFile,

    searchRepository,

    getCommits,

    checkApiStatus,

    getApiErrorMessage

};
