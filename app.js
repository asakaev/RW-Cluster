var Promise = require('bluebird').Promise
var RedisClient = require('redis').RedisClient
var log4js = require('log4js')

var DeadLettersReader = require('./src/roles/dead-letters-reader')
var RuntimeReconfigurator = require('./src/roles/runtime-reconfigurator')
var WriterNode = require('./src/roles/writer-node')
var ReaderNode = require('./src/roles/reader-node')
var Serializer = require('./src/mq/serializer')
var Producer = require('./src/mq/producer')
var Consumer = require('./src/mq/consumer')
var Lease = require('./src/mutex/lease')
var WriterNodeHealthcheck = require('./src/coordination/writer-node-healthcheck')
var WriterNodeLeaseUpdater = require('./src/coordination/writer-node-lease-updater')

var log = log4js.getLogger('App')
var config = require('./etc/config.json')

var deadLettersBatchSize = config.deadLettersReader.batchReadSize
var readerNoMessagesDelayMs = config.readerNode.noMessageDelayMs
var writerSleepMs = config.writerNode.sleepMs


var redisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  enable_offline_queue: false
}

var redisClient = new RedisClient(redisOptions)
  .on('error', function(e) { log.error(e.message) })

// topics
var messagesTopic = config.topics.messages
var deadLettersTopic = config.topics.deadLetters

// queue
var serializer = new Serializer()
var consumer = new Consumer(redisClient, serializer)
var producer = new Producer(redisClient, serializer)

var lease = new Lease(redisClient, 'lease-key')

// roles
var deadLettersReader = new DeadLettersReader(consumer, deadLettersTopic)
var reconfigurator = new RuntimeReconfigurator(lease)
var writer = new WriterNode(producer, messagesTopic)
var reader = new ReaderNode(consumer, producer, messagesTopic, deadLettersTopic)

// runners
var writerNodeHealthcheck = new WriterNodeHealthcheck(lease)
var writerNodeLeaseUpdater = new WriterNodeLeaseUpdater(lease, writer.getId())


function becomeReaderNode() {
  writerNodeHealthcheck.run()

  reader.readMessage()
    .then(function(maybeMessage) {
      if (!maybeMessage) {
        return Promise.delay(readerNoMessagesDelayMs)
      } else {
        log.info('read message:', maybeMessage)
        return reader.processMessage(maybeMessage)
          .catch(function() {
            log.warn('message-not-processed', maybeMessage)
            return reader.writeDeadLetter(maybeMessage)
              .then(function() { log.debug('Write message to dead letter queue') })
          })
      }
    })
    .then(function() {
      if (writerNodeHealthcheck.isWriterNodeOnline()) {
        becomeReaderNode()
      } else {
        writerNodeHealthcheck.shutdown()
        becomeRuntimeReconfigurator()
      }
    })
    .catch(function(e) {
      writerNodeHealthcheck.shutdown()
      log.error('Failed to be a reader node:', e.message)
      becomeIdle()
    })
}


function becomeRuntimeReconfigurator() {
  var writerNodeId = writer.getId()
  reconfigurator.tryBecomeWriterNode(writerNodeId)
    .then(function(isWriterNodeNow) {
      if (isWriterNodeNow) {
        log.info('Successful become WriterNode', writerNodeId)
        becomeWriterNode()
      } else {
        log.info('Failed to become WriterNode', writerNodeId)
        becomeReaderNode()
      }
    })
    .catch(function(e) {
      log.error('Failed to reconfigure:', e.message)
      becomeIdle()
    })
}


function becomeWriterNode() {
  writerNodeLeaseUpdater.run()

  var message = writer.generateMessage()
  writer.send(message)
    .then(function() {
      log.info('send message:', message)
      return Promise.delay(writerSleepMs)
    })
    .then(function() {
      var meHoldingLease = writerNodeLeaseUpdater.getLeaseHolder() === writer.getId()

      if (meHoldingLease) {
        becomeWriterNode()
      } else {
        writerNodeLeaseUpdater.shutdown()
        becomeReaderNode()
      }
    })
    .catch(function(e) {
      writerNodeLeaseUpdater.shutdown()
      log.error('Failed to be a writer node:', e.message)
      becomeIdle()
    })
}


function becomeIdle() {
  var idleTimeMs = 3000
  log.info('idle', idleTimeMs)
  Promise.delay(idleTimeMs).then(becomeRuntimeReconfigurator)
}


function becomeDeadLettersReader() {
  log.debug('read dead letters, batch size:', deadLettersBatchSize)

  function loop() {
    deadLettersReader.readBatch(deadLettersBatchSize)
      .then(function(messages) {
        if (messages.length) {
          console.log(messages)
          loop()
        } else {
          console.log('Done')
          closeApp()
        }
      })
  }

  loop()
}


function closeApp() {
  redisClient.quit()
}

function deadLettersMode() {
  return process.argv[2] === 'getErrors'
}


redisClient.once('ready', function() {
  deadLettersMode() ? becomeDeadLettersReader() : becomeRuntimeReconfigurator()
})
