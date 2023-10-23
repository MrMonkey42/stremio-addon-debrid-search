import RealDebridClient from 'real-debrid-api'
import Fuse from 'fuse.js'
import PTT from './util/parse-torrent-title.js'

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

function toTorrent(item) {
    return {
        source: 'realdebrid',
        id: item.id,
        name: item.filename,
        type: 'other',
        info: PTT.parse(item.name),
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
    return metas
}

async function listTorrentsParallel(apiKey, page = 1, pageSize = 50) {
    const RD = new RealDebridClient(apiKey, {
        params: {
            page: page,
            limit: pageSize
        }
    })
    let torrents = []

    await RD.torrents.get()
        .then(result => {
            torrents = torrents.concat(result.data)
        })
        .catch(err => {
            console.log(err)
            throw new Error("Error from RD: " + JSON.stringify(err))
        })

    return torrents
}

export default { listTorrents, searchTorrents }