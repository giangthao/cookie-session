const base64url = str => {
    return btoa(str).replace(/\+/g, '-')
    .replace(/\//g,'-')
    .replace(/\=/g, '');
}

module.exports = {base64url};