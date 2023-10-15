const { addonBuilder } = require("stremio-addon-sdk")
const DebridLink = require('./lib/debrid-link')
const RealDebrid = require('./lib/real-debrid')
const package = require("./package.json");

const API_KEY_DESCRIPTION = `<div class="separator"></div><h3 class="gives">Get the API Key here :</h3> <ul><li><a href="https://real-debrid.com/apitoken" target="_blank">RealDebrid API Key</a></li><li><a href="https://debrid-link.fr/webapp/apikey" target="_blank">DebridLink API Key</a></li></ul>`

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
    id: "community.stremio.debrid-search",
    version: package.version,
    name: "Debrid Search",
    description: package.description + API_KEY_DESCRIPTION,
    background: `https://i.ibb.co/VtSfFP9/t8wVwcg.jpg`,
    logo: `https://img.icons8.com/fluency/256/search-in-cloud.png`,
    catalogs: [
        {
            "id": "debridsearch",
            "type": "other",
            "extra": [
                {
                    "name": "search",
                    "isRequired": true
                }
            ]
        }
    ],
    resources: [
        "catalog"
    ],
    types: [
        "movie",
        "series",
        'anime',
        "other"
    ],
    behaviorHints: {
        configurable: true,
        configurationRequired: true
    },

    // Ref - https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md#user-data
    config: [
        {
            "key": "DebridProvider",
            "title": "Debrid Provider",
            "type": "select",
            "required": true,
            "options": ["RealDebrid", "DebridLink"]
        },
        {
            "key": "DebridApiKey",
            "title": "Debrid API Key",
            "type": "text",
            "required": true
        },
    ]
}

const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE) || 1 * 60 // 1 min
const STALE_REVALIDATE_AGE = 1 * 60 // 1 min
const STALE_ERROR_AGE = 1 * 24 * 60 * 60 // 1 days

const builder = new addonBuilder(manifest)

builder.defineCatalogHandler((args) => {
    return new Promise((resolve, reject) => {
        console.log("Request for catalog with args: " + JSON.stringify(args))
        // Request to Debrid Search
        if (args.id == 'debridsearch') {
            if (!((args.config?.DebridProvider && args.config?.DebridApiKey) || args.config?.DebridLinkApiKey)) {
                reject(new Error('Invalid Debrid configuration: Missing configs'))
            }

            if (args.extra.search) {
                let resultsPromise
                if (args.config.DebridLinkApiKey) {
                    resultsPromise = DebridLink.searchTorrents(args.config.DebridLinkApiKey, args.extra.search)
                } else if (args.config.DebridProvider == "DebridLink") {
                    resultsPromise = DebridLink.searchTorrents(args.config.DebridApiKey, args.extra.search)
                } else if (args.config.DebridProvider == "RealDebrid") {
                    resultsPromise = RealDebrid.searchTorrents(args.config.DebridApiKey, args.extra.search)
                } else {
                    reject(new Error('Invalid Debrid configuration: Unknown DebridProvider'))
                }

                resultsPromise
                    .then(metas => {
                        console.log("Response metas: " + JSON.stringify(metas))
                        resolve({
                            metas: metas,
                            cacheMaxAge: CACHE_MAX_AGE,
                            staleRevalidate: STALE_REVALIDATE_AGE,
                            staleError: STALE_ERROR_AGE
                        })
                    })
                    .catch(err => reject(err))
            } else {
                // Standard catalog request
                resolve({ metas: [] })
            }
        } else {
            reject(new Error('Invalid catalog request'))
        }
    })
})

module.exports = builder.getInterface()
