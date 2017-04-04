

/**
 * Serializer
 * @constructor
 */
function Serializer() {}


/**
 * @param {Number} message
 * @returns {String}
 */
Serializer.prototype.encode = function(message) {
  return String(message)
}


/**
 * @param {String} string
 * @returns {Number}
 */
Serializer.prototype.decode = function(string) {
  return Number(string)
}


module.exports = Serializer
