const DebridLinkClient = require('debrid-link-api')
const Fuse = require('fuse.js')

async function searchTorrents(apiKey, searchKey = null) {
    console.log("Search torrents with searchKey: " + searchKey)

    const torrents = await listTorrentsParallel(apiKey)
    // console.log("torrents: " + JSON.stringify(torrents))
    const fuse = new Fuse(torrents, {
        keys: ['name'],
        threshold: 0.3,
        minMatchCharLength: 2
    })

    const searchResults = fuse.search(searchKey)
    if (searchResults && searchResults.length) {
        const metas = searchResults.map(searchResult => {
            return {
                id: 'debridlink:' + searchResult.item.id.split('-')[0],
                name: searchResult.item.name,
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
    const DL = new DebridLinkClient(apiKey)
    const idParent = 'seedbox'
    let torrents = []

    let nextPage = Math.floor(skip / 50)

    await DL.files.list(idParent, nextPage)
        .then(result => {
            if (result.success) {
                torrents = torrents.concat(result.value)
            }
        })
        .catch(err => {
            throw new Error("Error from DL: " + JSON.stringify(err))
        })

    const metas = torrents.map(torrent => {
        return {
            id: 'debridlink:' + torrent.id.split('-')[0],
            name: torrent.name,
            type: 'other',
        }
    })
    return metas
}

async function listTorrentsParallel(apiKey) {
    const DL = new DebridLinkClient(apiKey)
    const idParent = 'seedbox'
    let torrents = []
    let promises = []

    let nextPage = 0
    let totalPages = 0
    await DL.files.list(idParent)
        .then(result => {
            if (result.success) {
                torrents = torrents.concat(result.value)
                totalPages = result.pagination.pages
                nextPage = result.pagination.next
            }
        })
        .catch(err => {
            throw new Error("Error from DL: " + JSON.stringify(err))
        })

    while (nextPage != -1 && nextPage < totalPages) {
        promises.push(
            DL.files.list(idParent, nextPage)
                .then(result => {
                    if (result.success) {
                        torrents = torrents.concat(result.value)
                    }
                }).catch(err => {
                    throw new Error("Error from DL: " + JSON.stringify(err))
                })
        )
        nextPage = nextPage + 1
    }

    await Promise.all(promises)
        .catch(err => {
            throw new Error("Error from DL: " + JSON.stringify(err))
        })

    return torrents
}

module.exports = { listTorrents, searchTorrents }