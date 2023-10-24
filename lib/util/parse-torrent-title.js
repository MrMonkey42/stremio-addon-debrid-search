import PTT from 'parse-torrent-title'

const DomainNameRegex = /^www\.[a-zA-Z0-9]+\.[a-zA-Z]{2,}[ \-]+/i
const SourcePrefixRegex = /^\[[a-zA-Z0-9 ._]+\][ \-]+/

function parse(title) {
    title = title.replace(DomainNameRegex, '')
    title = title.replace(SourcePrefixRegex, '')
    return PTT.parse(title)
}

export default { parse }