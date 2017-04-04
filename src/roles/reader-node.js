var Promise = require('bluebird').Promise


/**
 * Reader role node
 *
 * @param {Consumer} consumer
 * @param {Producer} producer
 * @param {String} readTopic
 * @param {String} deadLetterTopic
 * @constructor
 */
function ReaderNode(consumer, producer, readTopic, deadLetterTopic) {

  /** @private */
  this.consumer = consumer

  /** @private */
  this.producer = producer

  /** @private */
  this.readTopic = readTopic

  /** @private */
  this.deadLetterTopic = deadLetterTopic
}


/**
 * @returns {Promise.<?Number>}
 */
ReaderNode.prototype.readMessage = function() {
  return this.consumer.poll(this.readTopic)
}


/**
 * @param {Number} message
 * @returns {Promise}
 */
ReaderNode.prototype.processMessage = function(message) {
  return new Promise(function(resolve, reject) {

    function onComplete() {
      var error = Math.random() > 0.85
      error ? reject(message) : resolve()
    }

    setTimeout(onComplete, Math.floor(Math.random() * 1000))
  })
}


/**
 * @param {Number} message
 * @returns {Promise}
 */
ReaderNode.prototype.writeDeadLetter = function(message) {
  return this.producer.send(this.deadLetterTopic, message)
}


module.exports = ReaderNode
