import packageInfo from "./../../package.json" assert { type: "json" }

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
function getManifest(config = {}) {
    const manifest = {
        id: "community.stremio.debrid-search",
        version: packageInfo.version,
        name: "Debrid Search",
        description: packageInfo.description,
        background: `https://i.ibb.co/VtSfFP9/t8wVwcg.jpg`,
        logo: `https://img.icons8.com/fluency/256/search-in-cloud.png`,
        catalogs: getCatalogs(config),
        resources: [
            "catalog",
            "stream"
        ],
        types: [
            "movie",
            "series",
            'anime',
            "other"
        ],
        idPrefixes: ['tt'],
        behaviorHints: {
            configurable: true,
            configurationRequired: isConfigurationRequired(config)
        },
    }

    return manifest
}

function getCatalogs(config) {
    if (!(config && config.DebridProvider)) {
        return []
    }

    return [
        {
            "id": `debridsearch`,
            "name": `Debrid Search - ${config.DebridProvider}`,
            "type": "other",
            "extra": [
                { "name": "search", "isRequired": false },
                { "name": "skip", "isRequired": false }
            ]
        }
    ]
}

function isConfigurationRequired(config) {
    return !(config && config.DebridProvider)
}

export { getManifest }