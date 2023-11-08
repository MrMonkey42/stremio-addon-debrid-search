import Cinemeta from './util/cinemeta.js'
import DebridLink from './debrid-link.js'
import RealDebrid from './real-debrid.js'
import AllDebrid from './all-debrid.js'

const STREAM_NAME_MAP = {
    debridlink: "[DL+] DebridSearch",
    realdebrid: "[RD+] DebridSearch",
    alldebrid:  "[AD+] DebridSearch"
}

async function getMovieStreams(config, type, id) {
    const cinemetaDetails = await Cinemeta.getMeta(type, id)
    const searchKey = cinemetaDetails.name

    let apiKey = config.DebridLinkApiKey ? config.DebridLinkApiKey : config.DebridApiKey

    if (config.DebridLinkApiKey || config.DebridProvider == "DebridLink") {
        const torrents = await DebridLink.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const torrentIds = torrents
                .filter(torrent => filterYear(torrent, cinemetaDetails))
                .map(torrent => torrent.id)

            if (torrentIds && torrentIds.length) {
                return await DebridLink.getTorrentDetails(apiKey, torrentIds.join())
                    .then(torrentDetailsList => {
                        return torrentDetailsList.map(torrentDetails => toStream(torrentDetails))
                    })
            }            
        }
    } else if (config.DebridProvider == "RealDebrid") {
        const torrents = await RealDebrid.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const streams = await Promise.all(torrents
                .filter(torrent => filterYear(torrent, cinemetaDetails))
                .map(torrent => {
                return RealDebrid.getTorrentDetails(apiKey, torrent.id)
                    .then(torrentDetails => toStream(torrentDetails))
                    .catch(err => {
                        console.log(err)
                        Promise.resolve()
                    })
            }))

            return streams.filter(stream => stream)
        }
    } else if (config.DebridProvider == "AllDebrid") {
        const torrents = await AllDebrid.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const streams = await Promise.all(
                torrents
                    .filter(torrent => filterYear(torrent, cinemetaDetails))
                    .map(torrent => {
                        return AllDebrid.getTorrentDetails(apiKey, torrent.id)
                            .then(torrentDetails => toStream(torrentDetails))
                            .catch(err => {
                                console.log(err)
                                Promise.resolve()
                            })
                    })
            )

            return streams
        }
    } else {
        throw new Error('Invalid Debrid configuration: Unknown DebridProvider')
    }

    return []
}

async function getSeriesStreams(config, type, id) {
    const [imdbId, season, episode] = id.split(":")
    const cinemetaDetails = await Cinemeta.getMeta(type, imdbId)
    const searchKey = cinemetaDetails.name

    let apiKey = config.DebridLinkApiKey ? config.DebridLinkApiKey : config.DebridApiKey

    if (config.DebridLinkApiKey || config.DebridProvider == "DebridLink") {
        const torrents = await DebridLink.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const torrentIds = torrents
                .filter(torrent => filterSeason(torrent, season))
                .map(torrent => torrent.id)

            if (torrentIds && torrentIds.length) {
                return DebridLink.getTorrentDetails(apiKey, torrentIds.join())
                    .then(torrentDetailsList => {
                        return torrentDetailsList
                            .filter(torrentDetails => filterEpisode(torrentDetails, season, episode))
                            .map(torrentDetails => toStream(torrentDetails, type))
                    })
            }
        }
    } else if (config.DebridProvider == "RealDebrid") {
        const torrents = await RealDebrid.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const streams = await Promise.all(torrents
                .filter(torrent => filterSeason(torrent, season))
                .map(torrent => {
                    return RealDebrid.getTorrentDetails(apiKey, torrent.id)
                        .then(torrentDetails => {
                            if (filterEpisode(torrentDetails, season, episode)) {
                                return toStream(torrentDetails, type)
                            }
                        })
                        .catch(err => {
                            console.log(err)
                            Promise.resolve()
                        })
                }))

            return streams.filter(stream => stream)
        }
    } else if (config.DebridProvider == "AllDebrid") {
        const torrents = await AllDebrid.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const streams = await Promise.all(torrents
                .filter(torrent => filterSeason(torrent, season))
                .map(torrent => {
                    return AllDebrid.getTorrentDetails(apiKey, torrent.id)
                        .then(torrentDetails => {
                            if (filterEpisode(torrentDetails, season, episode)) {
                                return toStream(torrentDetails, type)
                            }
                        })
                        .catch(err => {
                            console.log(err)
                            Promise.resolve()
                        })
                })
            )

            return streams
        }
    } else {
        throw new Error('Invalid Debrid configuration: Unknown DebridProvider')
    }

    return []
}

function filterSeason(torrent, season) {
    return torrent && torrent.info.season == season
}

function filterEpisode(torrentDetails, season, episode) {
    torrentDetails.videos = torrentDetails.videos
        .filter(video => (season == video.info.season) && (episode == video.info.episode))

    return torrentDetails.videos && torrentDetails.videos.length
}

function filterYear(torrent, cinemetaDetails) {
    if (torrent && torrent.info.year && cinemetaDetails) {
        return torrent.info.year == cinemetaDetails.year
    }

    return true
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