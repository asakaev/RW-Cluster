

/**
 * Writer role node
 *
 * @param {Producer} producer
 * @param {String} topic
 * @constructor
 */
function WriterNode(producer, topic) {

  /** @private */
  this.id = 'id.' + Date.now()

  /** @private */
  this.producer = producer

  /** @private */
  this.topic = topic

  /** @private */
  this.counter = 0
}


/**
 * @param {Number} message
 * @returns {Promise}
 */
WriterNode.prototype.send = function(message) {
  return this.producer.send(this.topic, message)
}


/**
 * @returns {Number}
 */
WriterNode.prototype.generateMessage = function() {
  return this.counter++
}


/**
 * @returns {String}
 */
WriterNode.prototype.getId = function() {
  return this.id
}


module.exports = WriterNode
