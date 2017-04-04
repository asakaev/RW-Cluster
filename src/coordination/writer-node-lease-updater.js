var log4js = require('log4js')
var log = log4js.getLogger('WriterNodeLeaseUpdater')


/**
 * WriterNodeLeaseUpdater
 *
 * @param {Lease} lease
 * @param {String} writerNodeId
 * @constructor
 */
function WriterNodeLeaseUpdater(lease, writerNodeId) {

  /** @private */
  this.lease = lease

  /** @private */
  this.writerNodeId = writerNodeId

  /** @private */
  this.timer = null

  /** @private */
  this.isLeaseRenewed = false
}


/**
 * @returns {?String}
 */
WriterNodeLeaseUpdater.prototype.getLeaseHolder = function() {
  return this.isLeaseRenewed ? this.writerNodeId : null
}


/**
 * Run writer node heartbeat
 */
WriterNodeLeaseUpdater.prototype.run = function() {
  if (this.isRunning()) { return }

  log.debug('start heartbeats')

  var self = this

  function heartbeat() {
    self.lease.renew(self.writerNodeId)
      .then(function(isLeaseRenewed) {
        log.debug('isLeaseRenewed', self.writerNodeId, self.lease.getDuration(), isLeaseRenewed)
        self.isLeaseRenewed = isLeaseRenewed
      })
      .catch(function(e) {
        self.isLeaseRenewed = false
        self.shutdown()
        log.error('Failed to heartbeat', e)
      })
  }

  heartbeat()
  this.timer = setInterval(heartbeat, this.heartbeatIntervalMs())
}


/**
 * Stops heartbeats
 */
WriterNodeLeaseUpdater.prototype.shutdown = function () {
  clearInterval(this.timer)
  this.timer = null
}


/**
 * @returns {Boolean}
 * @private
 */
WriterNodeLeaseUpdater.prototype.isRunning = function() {
  return !!this.timer
}


/**
 * @returns {Number}
 * @private
 */
WriterNodeLeaseUpdater.prototype.heartbeatIntervalMs = function() {
  return this.lease.getDuration() * 0.9
}


module.exports = WriterNodeLeaseUpdater
