import { addonBuilder } from "stremio-addon-sdk"
import StreamProvider from './lib/stream-provider.js'
import CatalogProvider from './lib/catalog-provider.js'
import { getManifest } from './lib/util/manifest.js'

const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE) || 1 * 60 // 1 min
const STALE_REVALIDATE_AGE = 1 * 60 // 1 min
const STALE_ERROR_AGE = 1 * 24 * 60 * 60 // 1 days

const builder = new addonBuilder(getManifest())

builder.defineCatalogHandler((args) => {
    return new Promise((resolve, reject) => {
        console.log("Request for catalog with args: " + JSON.stringify(args))
        // Request to Debrid Search
        if (args.id == 'debridsearch') {
            if (!((args.config?.DebridProvider && args.config?.DebridApiKey) || args.config?.DebridLinkApiKey)) {
                reject(new Error('Invalid Debrid configuration: Missing configs'))
            }

            // Search catalog request
            if (args.extra.search) {
                CatalogProvider.searchTorrents(args.config, args.extra.search)
                    .then(metas => {
                        console.log("Response metas: " + JSON.stringify(metas))
                        resolve({
                            metas,
                            ...enrichCacheParams()
                        })
                    })
                    .catch(err => reject(err))
            } else {
                // Standard catalog request
                CatalogProvider.listTorrents(args.config, args.extra.skip)
                    .then(metas => {
                        console.log("Response metas: " + JSON.stringify(metas))
                        resolve({
                            metas,
                            ...enrichCacheParams()
                        })
                    })
                    .catch(err => reject(err))
            }
        } else {
            reject(new Error('Invalid catalog request'))
        }
    })
})


// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/requests/defineStreamHandler.md
builder.defineStreamHandler(args => {
    return new Promise((resolve, reject) => {
        if (!args.id.match(/tt\d+/i)) {
            resolve({ streams: [] })
            return
        }

        console.log("Request for streams with args: " + JSON.stringify(args))
        switch (args.type) {
            case 'movie':
                StreamProvider.getMovieStreams(args.config, args.type, args.id)
                    .then(streams => {
                        console.log("Response streams: " + JSON.stringify(streams))
                        resolve({
                            streams,
                            ...enrichCacheParams()
                        })
                    })
                    .catch(err => reject(err))
                break
            case 'series':
                StreamProvider.getSeriesStreams(args.config, args.type, args.id)
                    .then(streams => {
                        console.log("Response streams: " + JSON.stringify(streams))
                        resolve({
                            streams,
                            ...enrichCacheParams()
                        })
                    })
                    .catch(err => reject(err))
                break
            default:
                results = resolve({ streams: [] })
                break
        }
    })
})

function enrichCacheParams() {
    return {
        cacheMaxAge: CACHE_MAX_AGE,
        staleRevalidate: STALE_REVALIDATE_AGE,
        staleError: STALE_ERROR_AGE
    }
}

export default builder.getInterface()
