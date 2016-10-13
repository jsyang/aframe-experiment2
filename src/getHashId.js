var ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

/**
 * @param {number} [length]
 * @returns {string}
 */

function getHashId(length) {
    var id = '';
    for (length = length || 4; length > 0; length--) {
        id += ID_CHARS[Math.floor(ID_CHARS.length * Math.random())];
    }

    return id;
}

module.exports = getHashId;