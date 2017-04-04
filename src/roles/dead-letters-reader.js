var Promise = require('bluebird').Promise


/**
 * DeadLettersReader
 *
 * @param {Consumer} consumer
 * @param {String} deadLettersTopic
 * @constructor
 */
function DeadLettersReader(consumer, deadLettersTopic) {

  /** @private */
  this.consumer = consumer

  /** @private */
  this.deadLettersTopic = deadLettersTopic
}


/**
 * @param {Number} size
 * @returns {Promise.<Array.<Number>>}
 */
DeadLettersReader.prototype.readBatch = function(size) {
  var self = this

  function loop(count, messages) {
    return count <= 0 ?
      Promise.resolve(messages) :
      self.consumer.poll(self.deadLettersTopic)
        .then(function(maybeMessage) {
          return maybeMessage ?
            loop(count - 1, messages.concat(maybeMessage)) :
            messages
        })
  }

  return loop(size, [])
}


module.exports = DeadLettersReader
