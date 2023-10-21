import fetch from 'node-fetch'

async function getMeta(type, imdbId) {
    return await fetch('https://v3-cinemeta.strem.io/meta/' + type + '/' + imdbId + '.json')
        .then(response => response.json())
        .then(body => body && body.meta)
        .catch(err => {
            console.log(err)
            throw new Error("Error from Cinemeta: " + JSON.stringify(err))
        })
}

export default { getMeta }