#!/usr/bin/env node

const { serveHTTP, publishToCentral } = require("stremio-addon-sdk")
const addonInterface = require("./addon")
serveHTTP(addonInterface, {
    port: process.env.PORT || 55771,
    cacheMaxAge: process.env.CACHE_MAX_AGE || 1 * 60 // 1 min
})

// https://stremio.github.io/stremio-publish-addon/index.html
// publishToCentral("https://68d69db7dc40-stremio-addon-debrid-search.baby-beamup.club/manifest.json")
// for more information on deploying, see: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/deploying/README.md
