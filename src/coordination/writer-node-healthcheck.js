var log4js = require('log4js')
var log = log4js.getLogger('WriterNodeHealthcheck')


/**
 * WriterNodeHealthcheck
 *
 * @param {Lease} lease
 * @constructor
 */
function WriterNodeHealthcheck(lease) {

  /** @private */
  this.lease = lease

  /** @private */
  this.timer = null

  /** @private */
  this.isOnline = false
}


/**
 * @returns {Boolean}
 */
WriterNodeHealthcheck.prototype.isWriterNodeOnline = function() {
  return this.isOnline
}


/**
 * Run writer node heartbeat
 */
WriterNodeHealthcheck.prototype.run = function() {
  if (this.isRunning()) { return }

  log.debug('start healthcheck')

  var self = this

  function healthcheck() {
    self.lease.isActive()
      .then(function(isActive) {
        log.debug('isWriterNodeUp', isActive)
        self.isOnline = isActive
      })
      .catch(function(e) {
        self.isOnline = false
        self.shutdown()
        log.error('Failed to healthcheck', e)
      })
  }

  healthcheck()
  this.timer = setInterval(healthcheck, this.healthcheckInterval())
}


/**
 * Stops heartbeats
 */
WriterNodeHealthcheck.prototype.shutdown = function () {
  clearInterval(this.timer)
  this.timer = null
}


/**
 * @returns {Boolean}
 * @private
 */
WriterNodeHealthcheck.prototype.isRunning = function() {
  return !!this.timer
}


/**
 * @returns {Number}
 * @private
 */
WriterNodeHealthcheck.prototype.healthcheckInterval = function() {
  return this.lease.getDuration() / 2
}


module.exports = WriterNodeHealthcheck
