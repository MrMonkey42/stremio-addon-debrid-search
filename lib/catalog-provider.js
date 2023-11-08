import DebridLink from './debrid-link.js'
import RealDebrid from './real-debrid.js'
import AllDebrid from './all-debrid.js'

async function searchTorrents(config, searchKey) {
    let resultsPromise
    if (config.DebridLinkApiKey) {
        resultsPromise = DebridLink.searchTorrents(config.DebridLinkApiKey, searchKey)
    } else if (config.DebridProvider == "DebridLink") {
        resultsPromise = DebridLink.searchTorrents(config.DebridApiKey, searchKey)
    } else if (config.DebridProvider == "RealDebrid") {
        resultsPromise = RealDebrid.searchTorrents(config.DebridApiKey, searchKey)
    } else if (config.DebridProvider == "AllDebrid") {
        resultsPromise = AllDebrid.searchTorrents(config.DebridApiKey, searchKey)
    } else {
        throw new Error('Invalid Debrid configuration: Unknown DebridProvider')
    }

    return resultsPromise
        .then(torrents => torrents.map(torrent => toMeta(torrent)))
}

function toMeta(torrent) {
    return {
        id: torrent.source + ':' + torrent.id,
        name: torrent.name,
        type: torrent.type,
        // poster: `https://img.icons8.com/ios/256/video--v1.png`,
        // posterShape: 'square'
    }
}


export default { searchTorrents }