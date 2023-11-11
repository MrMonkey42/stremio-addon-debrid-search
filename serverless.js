import StremioAddonSdk from "stremio-addon-sdk"
const { getRouter } = StremioAddonSdk
import addonInterface from "./addon.js"
import landingTemplate from "./lib/util/landingTemplate.js"
import StreamProvider from './lib/stream-provider.js'
import { decode } from 'urlencode'

const landingHTML = landingTemplate(addonInterface.manifest)

const router = getRouter(addonInterface);

router.get('/', (_, res) => {
    res.redirect('/configure')
})

router.get('/configure', (_, res) => {
    res.setHeader('content-type', 'text/html')
    res.end(landingHTML)
})

router.get('/resolve/:debridProvider/:debridApiKey/:hostUrl', (req, res) => {
    StreamProvider.resolveUrl(req.params.debridProvider, req.params.debridApiKey, decode(req.params.hostUrl))
        .then(url => {
            res.redirect(url)
        })
        .catch(err => {
            console.log(err)
            res.status(404).send(err)
        })
})

router.get('/ping', (_, res) => {
    res.statusCode = 200
    res.end()
})

export default function (req, res) {
    router(req, res, function () {
        res.statusCode = 404;
        res.end();
    });
}