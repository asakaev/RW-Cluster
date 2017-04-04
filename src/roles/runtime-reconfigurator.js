

/**
 * Runtime reconfigurator
 *
 * @param {Lease} lease
 * @constructor
 */
function RuntimeReconfigurator(lease) {

  /** @private */
  this.lease = lease
}


/**
 * @param {String} writeNodeId
 * @returns {Promise.<Boolean>}
 */
RuntimeReconfigurator.prototype.tryBecomeWriterNode = function(writeNodeId) {
  return this.lease.acquire(writeNodeId)
}


module.exports = RuntimeReconfigurator
