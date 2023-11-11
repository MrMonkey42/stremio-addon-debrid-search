import RealDebridClient from 'real-debrid-api'
import Fuse from 'fuse.js'
import { isVideo } from './util/extension-util.js'
import PTT from './util/parse-torrent-title.js'
import { BadTokenError, AccessDeniedError } from './util/error-codes.js'
import { encode } from 'urlencode'

async function searchTorrents(apiKey, searchKey = null, threshold = 0.3) {
    console.log("Search torrents with searchKey: " + searchKey)

    const torrentsResults = await listTorrentsParallel(apiKey, 1, 1000)
    let torrents = torrentsResults.map(torrentsResult => {
        return toTorrent(torrentsResult)
    })
    // console.log("torrents: " + JSON.stringify(torrents))
    const fuse = new Fuse(torrents, {
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

async function getTorrentDetails(apiKey, id) {
    const RD = new RealDebridClient(apiKey)

    return await RD.torrents.info(id)
        .then(torrent => toTorrentDetails(apiKey, torrent))
        .catch(err => handleError(err))
}

async function toTorrentDetails(apiKey, item) {
    const videos = item.files
        .filter(file => file.selected)
        .filter(file => isVideo(file.path))
        .map((file, index) => {
            const hostUrl = item.links.at(index)
            const url = `${process.env.ADDON_URL}/resolve/RealDebrid/${apiKey}/${encode(hostUrl)}`

            return {
                id: `${item.id}:${file.id}`,
                name: file.path,
                url: url,
                size: file.bytes,
                created: new Date(item.added),
                info: PTT.parse(file.path)
            }
        })

    return {
        source: 'realdebrid',
        id: item.id,
        name: item.filename,
        type: 'other',
        hash: item.hash,
        info: PTT.parse(item.filename),
        size: item.bytes,
        created: new Date(item.added),
        videos: videos || []
    }
}

async function unrestrictUrl(apiKey, hostUrl) {
    const RD = new RealDebridClient(apiKey)

    return RD.unrestrict.link(hostUrl)
        .then(value => value.download)
        .catch(err => handleError(err))
}

function toTorrent(item) {
    return {
        source: 'realdebrid',
        id: item.id,
        name: item.filename,
        type: 'other',
        info: PTT.parse(item.filename),
        size: item.bytes,
        created: new Date(item.added),
    }
}

async function listTorrents(apiKey, skip = 0) {
    let nextPage = Math.floor(skip / 50) + 1

    let torrents = await listTorrentsParallel(apiKey, nextPage)
    const metas = torrents.map(torrent => {
        return {
            id: 'realdebrid:' + torrent.id,
            name: torrent.filename,
            type: 'other',
        }
    })
    return metas || []
}

async function listTorrentsParallel(apiKey, page = 1, pageSize = 50) {
    const RD = new RealDebridClient(apiKey, {
        params: {
            page: page,
            limit: pageSize
        }
    })

    const torrents = await RD.torrents.get(0, page, pageSize)
        .catch(err => handleError(err))

    return torrents || []
}

function handleError(err) {
    if (err && err.code === 8) {
        return Promise.reject(BadTokenError)
    }
    if (err && accessDeniedError(err)) {
        return Promise.reject(AccessDeniedError)
    }
    return Promise.reject(err)
}

function accessDeniedError(error) {
    return [9, 20].includes(error && error.code)
}

export default { listTorrents, searchTorrents, getTorrentDetails, unrestrictUrl }