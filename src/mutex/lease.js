var Promise = require('bluebird').Promise


/**
 * Lease
 *
 * @param {RedisClient} redisClient
 * @param {String} redisKey
 * @param {Number=} durationMs
 * @constructor
 */
function Lease(redisClient, redisKey, durationMs) {

  /** @private */
  this.redisClient = redisClient

  /** @private */
  this.redisKey = redisKey

  /** @private */
  this.durationMs = durationMs || 5000
}


/**
 * Atomic lease acquire
 * @param {String} id
 * @returns {Promise.<Boolean>}
 */
Lease.prototype.acquire = function(id) {
  var self = this
  return new Promise(function(resolve, reject) {
    var args = [self.redisKey, id, 'NX', 'PX', self.durationMs]
    self.redisClient.set(args, function(error, result) {
      error ? reject(error) : resolve(result === 'OK')
    })
  })
}


/**
 * Atomic lease renew
 * @param {String} id
 * @returns {Promise.<Boolean>}
 */
Lease.prototype.renew = function(id) {
  var self = this
  return new Promise(function(resolve, reject) {
    var lua = 'return redis.call(\'get\', KEYS[1]) == ARGV[1]' +
      ' and redis.call(\'set\', KEYS[1], ARGV[1], \'PX\', ARGV[2])'

    var args = [lua, 1, self.redisKey, id, self.durationMs]
    self.redisClient.eval(args, function(error, result) {
      error ? reject(error) : resolve(result === 'OK')
    })
  })
}


/**
 * @returns {Promise.<Boolean>}
 */
Lease.prototype.isActive = function() {
  var self = this
  return new Promise(function(resolve, reject) {
    self.redisClient.exists(self.redisKey, function(error, result) {
      error ? reject(error) : resolve(Boolean(result))
    })
  })
}


/**
 * @returns {Number}
 */
Lease.prototype.getDuration = function() {
  return this.durationMs
}


module.exports = Lease
