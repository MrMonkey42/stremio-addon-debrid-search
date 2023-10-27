import StremioAddonSdk from "stremio-addon-sdk"
const { getRouter } = StremioAddonSdk
import addonInterface from "./addon.js"
import landingTemplate from "./lib/util/landingTemplate.js"

const landingHTML = landingTemplate(addonInterface.manifest)

const router = getRouter(addonInterface);

router.get('/', (_, res) => {
    res.redirect('/configure')
})

router.get('/configure', (_, res) => {
    res.setHeader('content-type', 'text/html')
    res.end(landingHTML)
})

export default function (req, res) {
    router(req, res, function () {
        res.statusCode = 404;
        res.end();
    });
}