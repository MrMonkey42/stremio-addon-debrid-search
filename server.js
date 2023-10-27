#!/usr/bin/env node

import StremioAddonSdk from "stremio-addon-sdk"
import express from 'express'
import serverless from './serverless.js'

const app = express()

app.use((req, res, next) => serverless(req, res, next))
app.listen(process.env.PORT || 55771, () => {
    console.log(`Started addon at: http://127.0.0.1:${process.env.PORT || 55771}`)
})

// https://stremio.github.io/stremio-publish-addon/index.html
// publishToCentral("https://68d69db7dc40-stremio-addon-debrid-search.baby-beamup.club/manifest.json")
// for more information on deploying, see: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/deploying/README.md
