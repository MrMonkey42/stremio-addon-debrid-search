import RealDebridClient from 'real-debrid-api'
import Fuse from 'fuse.js'

async function searchTorrents(apiKey, searchKey = null) {
    console.log("Search torrents with searchKey: " + searchKey)

    const torrents = await listTorrentsParallel(apiKey, 1, 1000)
    // console.log("torrents: " + JSON.stringify(torrents))
    const fuse = new Fuse(torrents, {
        keys: ['filename'],
        threshold: 0.3,
        minMatchCharLength: 2
    })

    const searchResults = fuse.search(searchKey)
    if (searchResults && searchResults.length) {
        const metas = searchResults.map(searchResult => {
            return {
                id: 'realdebrid:' + searchResult.item.id,
                name: searchResult.item.filename,
                type: 'other',
                // poster: `https://img.icons8.com/ios/256/video--v1.png`,
                // posterShape: 'square'
            }
        })
        return metas
    } else {
        return []
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