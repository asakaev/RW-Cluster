var Promise = require('bluebird').Promise


/**
 * Messages Producer
 *
 * @param {RedisClient} redisClient
 * @param {Serializer} serializer
 * @constructor
 */
function Producer(redisClient, serializer) {

  /** @private */
  this.redisClient = redisClient

  /** @private */
  this.serializer = serializer
}


/**
 * @param {String} topic
 * @param {Number} message
 * @returns {Promise}
 */
Producer.prototype.send = function(topic, message) {
  var self = this
  return new Promise(function(resolve, reject) {
    var encoded = self.serializer.encode(message)
    self.redisClient.lpush(topic, encoded, function(error) {
      error ? reject(error) : resolve()
    })
  })
}


module.exports = Producer
