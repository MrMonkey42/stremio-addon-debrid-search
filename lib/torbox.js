import { TorboxApi } from '@torbox/torbox-api'
import Fuse from 'fuse.js'
import { isVideo } from './util/extension-util.js'
import PTT from './util/parse-torrent-title.js'
import { BadTokenError, AccessDeniedError } from './util/error-codes.js'
import { FILE_TYPES } from './util/file-types.js'

const API_BASE_URL = 'https://api.torbox.app'
const API_VERSION = 'v1'
const API_VALIDATION_OPTIONS = { responseValidation: false }

async function searchFiles(fileType, apiKey, searchKey, threshold) {
    console.log("Search " + fileType.description + " with searchKey: " + searchKey)

    const files = await listFilesParallel(fileType, apiKey)
    let results = []
    if (fileType == FILE_TYPES.TORRENTS)
        results = files.map(result => toTorrent(apiKey, result))
    else if (fileType == FILE_TYPES.DOWNLOADS)
        results = files.map(result => toDownload(result))
    console.log(fileType.description + ": " + JSON.stringify(results))

    const fuse = new Fuse(results, {
        keys: ['info.title'],
        threshold: threshold,
        minMatchCharLength: 2
    })

    const searchResults = fuse.search(searchKey)
    if (searchResults && searchResults.length) {
        return searchResults.map(searchResult => searchResult.item)
    } else {
        return []
    }
}

async function searchTorrents(apiKey, searchKey = null, threshold = 0.3) {
    return searchFiles(FILE_TYPES.TORRENTS, apiKey, searchKey, threshold)
}

async function searchDownloads(apiKey, searchKey = null, threshold = 0.3) {
    return searchFiles(FILE_TYPES.DOWNLOADS, apiKey, searchKey, threshold)
}

async function unrestrictUrl(apiKey, torrentId, fileId, userIp) {
    const torboxApi = new TorboxApi({
        token: apiKey,
        baseUrl: API_BASE_URL,
        validation: API_VALIDATION_OPTIONS
    });

    return torboxApi.torrents
        .requestDownloadLink(API_VERSION, {
            token: apiKey,
            torrentId,
            fileId,
            userIp
        })
        .then(res => res.data)
        .then(res => {
            console.log(res)
            if (res.success) {
                return res.data
            }
        })
        .catch(err => handleError(err))
}

function toTorrent(apiKey, item) {
    const videos = item.files
        .filter(file => isVideo(file.short_name))
        .map((file) => {
            const url = `${process.env.ADDON_URL}/resolve/TorBox/${apiKey}/${item.id}/${file.id}`

            return {
                id: `${item.id}:${file.id}`,
                name: file.short_name,
                url: url,
                size: file.size,
                created: new Date(item.created_at),
                info: PTT.parse(file.short_name)
            }
    })

    return {
        source: 'torbox',
        id: item.id,
        name: item.name,
        type: 'other',
        fileType: FILE_TYPES.TORRENTS,
        hash: item.hash,
        info: PTT.parse(item.name),
        size: item.size,
        created: new Date(item.created_at),
        videos: videos || []
    }
}

function toDownload(item) {
    return {
        source: 'torbox',
        id: item.id,
        url: item.name,
        name: item.filename,
        type: 'other',
        fileType: FILE_TYPES.DOWNLOADS,
        info: PTT.parse(item.name),
        size: item.size,
        created: new Date(item.created_at),
    }
}

async function listTorrents(apiKey, skip = 0) {
    // Todo: catalogs
    return []
}

async function listFilesParallel(fileType, apiKey, page = 1, pageSize = 1000) {
    const torboxApi = new TorboxApi({
        token: apiKey,
        baseUrl: API_BASE_URL,
        validation: API_VALIDATION_OPTIONS
    });
    let offset = (page - 1) * pageSize

    if (fileType == FILE_TYPES.TORRENTS) {
        return torboxApi.torrents
            .getTorrentList(API_VERSION, {
                bypassCache: true,
                offset,
                limit: pageSize
            })
            .then(res => res.data)
            .then(res => {
                if (res.success) {
                    return res.data
                }
            })
            .then(files => files.filter(f => f.download_finished && f.download_present))
            .catch(err => handleError(err))
    } else if (fileType == FILE_TYPES.DOWNLOADS) {
        // Todo: Web hoster downloads functionality
        return []
    }
}

function handleError(err) {
    console.log(err)
    return Promise.reject(err)
}

export default { listTorrents, searchTorrents, unrestrictUrl, searchDownloads }