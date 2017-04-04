var Promise = require('bluebird').Promise


/**
 * Messages consumer
 *
 * @param {RedisClient} redisClient
 * @param {Serializer} serializer
 * @constructor
 */
function Consumer(redisClient, serializer) {

  /** @private */
  this.redisClient = redisClient

  /** @private */
  this.serializer = serializer
}


/**
 * @param {String} topic
 * @returns {Promise.<?Number>}
 */
Consumer.prototype.poll = function(topic) {
  var self = this
  return new Promise(function(resolve, reject) {
    self.redisClient.rpop(topic, function(error, result) {
      error ? reject(error) : resolve(self.serializer.decode(result))
    })
  })
}


module.exports = Consumer
