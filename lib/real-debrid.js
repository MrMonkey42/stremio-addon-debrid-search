const RealDebridClient = require('real-debrid-api')
const Fuse = require('fuse.js')

async function searchTorrents(apiKey, searchKey = null) {
    console.log("Search torrents with searchKey: " + searchKey)

    const torrents = await listTorrentsParallel(apiKey)
    // console.log("torrents: " + JSON.stringify(torrents))
    const fuse = new Fuse(torrents, {
        keys: ['filename'],
        threshold: 0.4,
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

async function listTorrentsParallel(apiKey) {
    const RD = new RealDebridClient(apiKey, {
        params: {
            offset: 0,
            page: 1,
            limit: 1000,
            filter: ''
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

module.exports = { searchTorrents }