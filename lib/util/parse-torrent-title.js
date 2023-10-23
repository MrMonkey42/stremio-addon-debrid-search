import PTT from 'parse-torrent-title'

const DomainNameRegex = /^www\.[a-zA-Z0-9]+\.[a-zA-Z]{2,} -/i

function parse(title) {
    title = title.replace(DomainNameRegex, '')
    return PTT.parse(title)
}

export default { parse }