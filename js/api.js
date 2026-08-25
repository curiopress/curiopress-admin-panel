const API_URL =
    "https://curiopress-admin-api.curiopress31.workers.dev";


function getAdminKey() {

    return sessionStorage.getItem(
        "curiopress_admin_key"
    );

}


function apiHeaders(extra = {}) {

    const key = getAdminKey();

    return {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        ...extra
    };

}


async function apiRequest(
    endpoint,
    options = {}
) {

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,

                headers:
                    apiHeaders(
                        options.headers || {}
                    )
            }
        );


    let data;

    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            `API returned an invalid response (${response.status})`
        );

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


async function verifyAdminKey(key) {

    const response =
        await fetch(
            `${API_URL}/api/repository`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${key}`
                }
            }
        );


    return response.ok;

}


async function getRepository() {

    return await apiRequest(
        "/api/repository"
    );

}


async function getFiles(
    path = ""
) {

    return await apiRequest(
        `/api/files?path=${encodeURIComponent(path)}`
    );

}


async function getFile(path) {

    return await apiRequest(
        `/api/file?path=${encodeURIComponent(path)}`
    );

}


async function createFile(
    path,
    content,
    message
) {

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


async function updateFile(
    path,
    content,
    sha,
    message
) {

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


async function deleteFile(
    path,
    sha,
    message
) {

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


async function searchRepository(
    query
) {

    return await apiRequest(
        `/api/search?q=${encodeURIComponent(query)}`
    );

}


async function getCommits() {

    return await apiRequest(
        "/api/commits"
    );

}


window.CurioPressAPI = {

    API_URL,

    getAdminKey,

    verifyAdminKey,

    apiRequest,

    getRepository,

    getFiles,

    getFile,

    createFile,

    updateFile,

    deleteFile,

    searchRepository,

    getCommits

};
