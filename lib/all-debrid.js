import AllDebridClient from 'all-debrid-api'
import Fuse from 'fuse.js'
import { isVideo } from './util/extension-util.js'
import PTT from './util/parse-torrent-title.js'
import { BadTokenError } from './util/error-codes.js'

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
    const AD = new AllDebridClient(apiKey)

    return await AD.magnet.status(id)
        .then(res => toTorrentDetails(apiKey, res.data.magnets))
        .catch(err => handleError(err))
}

async function toTorrentDetails(apiKey, item) {
    const videos = item.links
        .filter(file => isVideo(file.filename))
        .map((file, index) => {
            const hostUrl = file.link
            const url = `${process.env.ADDON_URL}/resolve/AllDebrid/${apiKey}/${item.id}/${encode(hostUrl)}`

            return {
                id: `${item.id}:${index}`,
                name: file.filename,
                url: url,
                size: file.size,
                created: new Date(item.completionDate),
                info: PTT.parse(file.filename)
            }
        })

    return {
        source: 'alldebrid',
        id: item.id,
        name: item.filename,
        type: 'other',
        hash: item.hash,
        info: PTT.parse(item.filename),
        size: item.size,
        created: new Date(item.completionDate),
        videos: videos || []
    }
}

async function unrestrictUrl(apiKey, hostUrl) {
    const AD = new AllDebridClient(apiKey)

    return AD.link.unlock(hostUrl)
        .then(res => res.data.link)
        .catch(err => handleError(err))
}

function toTorrent(item) {
    return {
        source: 'alldebrid',
        id: item.id,
        name: item.filename,
        type: 'other',
        info: PTT.parse(item.filename),
        size: item.size,
        created: new Date(item.completionDate),
    }
}

async function listTorrents(apiKey) {
    let torrents = await listTorrentsParallel(apiKey)
    const metas = torrents.map(torrent => {
        return {
            id: 'alldebrid:' + torrent.id,
            name: torrent.filename,
            type: 'other',
        }
    })
    return metas || []
}

async function listTorrentsParallel(apiKey) {
    const AD = new AllDebridClient(apiKey);

    const torrents = await AD.magnet.status()
        .then(res => res.data.magnets
            .filter(item => item.statusCode === 4)
        )
        .catch(err => handleError(err))

    return torrents || []
}

function handleError(err) {
    console.log(err)
    if (err && err.code === 'AUTH_BAD_APIKEY') {
        return Promise.reject(BadTokenError)
    }
    return Promise.reject(err)
}

export default { listTorrents, searchTorrents, getTorrentDetails, unrestrictUrl }