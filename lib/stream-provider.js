import Cinemeta from './util/cinemeta.js'
import DebridLink from './debrid-link.js'
import RealDebrid from './real-debrid.js'

const STREAM_NAME_MAP = {
    debridlink: "[DL+] DebridSearch",
    realdebrid: "[RD+] DebridSearch"
}

async function getMovieStreams(config, type, id) {
    const cinemetaDetails = await Cinemeta.getMeta(type, id)
    const searchKey = cinemetaDetails.name

    let apiKey = config.DebridLinkApiKey ? config.DebridLinkApiKey : config.DebridApiKey

    let resultsPromise
    if (config.DebridLinkApiKey || config.DebridProvider == "DebridLink") {
        resultsPromise = DebridLink.searchTorrents(apiKey, searchKey, 0.1)
    } else if (config.DebridProvider == "RealDebrid") {
        // Todo: Add streams for RealDebrid
        return []
    } else {
        throw new Error('Invalid Debrid configuration: Unknown DebridProvider')
    }

    const torrents = await resultsPromise
    if (torrents && torrents.length) {
        const torrentIds = torrents.map(torrent => torrent.id).join()

        if (config.DebridLinkApiKey || config.DebridProvider == "DebridLink") {
            return DebridLink.getTorrentDetails(apiKey, torrentIds)
                .then(torrentDetailsList => {
                    return torrentDetailsList
                        .map(torrentDetails => toStream(torrentDetails))
                })
        }
    } else {
        return []
    }
}

async function getSeriesStreams(config, type, id) {
    const [imdbId, season, episode] = id.split(":")
    const cinemetaDetails = await Cinemeta.getMeta(type, imdbId)
    const searchKey = cinemetaDetails.name

    let apiKey = config.DebridLinkApiKey ? config.DebridLinkApiKey : config.DebridApiKey

    let resultsPromise
    if (config.DebridLinkApiKey || config.DebridProvider == "DebridLink") {
        resultsPromise = DebridLink.searchTorrents(apiKey, searchKey, 0.1)
    } else if (config.DebridProvider == "RealDebrid") {
        // Todo: Add streams for RealDebrid
        return []
    } else {
        throw new Error('Invalid Debrid configuration: Unknown DebridProvider')
    }

    const torrents = await resultsPromise
    if (torrents && torrents.length) {
        const torrentIds = torrents.map(torrent => torrent.id).join()

        if (config.DebridLinkApiKey || config.DebridProvider == "DebridLink") {
            return DebridLink.getTorrentDetails(apiKey, torrentIds)
                .then(torrentDetailsList => {
                    return torrentDetailsList
                        .filter(torrentDetails => filterEpisode(torrentDetails, season, episode))
                        .map(torrentDetails => toStream(torrentDetails, type))
                })
        }
    } else {
        return []
    }
}

function filterEpisode(torrentDetails, season, episode) {
    torrentDetails.videos = torrentDetails.videos
        .filter(video => (season == video.info.season) && (episode == video.info.episode))

    return torrentDetails.videos && torrentDetails.videos.length
}

function toStream(torrentDetails, type) {
    const video = torrentDetails.videos.sort((a, b) => b.size - a.size) && torrentDetails.videos[0]

    let title = torrentDetails.name
    if (type == 'series') {
        title = title + '\n' + video.name
    }
    title = title + '\n' + '💾 ' + formatSize(video.size)

    let name = STREAM_NAME_MAP[torrentDetails.source]
    name = name + '\n' + video.info.resolution

    return {
        name,
        title,
        url: video.url,
    }
}

function formatSize(size) {
    if (!size) {
        return undefined
    }

    const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024))
    return Number((size / Math.pow(1024, i)).toFixed(2)) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
}

export default { getMovieStreams, getSeriesStreams }