var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter

var PeerFileReceive = function(connection) {
  if (!(this instanceof PeerFileReceive)) {
    return new PeerFileReceive(connection)
  }

  this.received = {}
  this.connection = connection
  this.handle = this.handle.bind(this)

  this.connection.on('data', this.handle)
}

inherits(PeerFileReceive, EventEmitter)

PeerFileReceive.prototype.handle = function(data) {
  var acceptable = /^file:(start|chunk|end|cancel)$/

  if (data.type && !acceptable.test(data.type)) {
    return false
  }

  var file = this.received[data.id] || {}

  if (data.type === 'file:start') {
    file = data.meta
    file.id = data.id
    file.accepted = false
    file.cancelled = false
    file.data = []

    this.received[data.id] = file
    this.emit('incoming', file)
  }

  else if (data.type === 'file:chunk' && file.accepted && !file.cancelled) {
    file.data.push(data.chunk)

    var receivedBytes = file.data.length * file.chunkSize
    if (receivedBytes > file.size) {
      receivedBytes = file.size
    }

    this.received[data.id] = file
    this.emit('progress', file, receivedBytes)
  }

  else if (data.type === 'file:end' && file.accepted) { 
    this.emit('complete', file)
  }

  else if (data.type === 'file:cancel') {
    file.cancelled = true
    this.received[data.id] = file
    this.emit('cancel', file)
  }
}

PeerFileReceive.prototype.accept = function(file) {
  this.received[file.id].accepted = true
  this.connection.send({
    type: 'file:accept'
  })
}

PeerFileReceive.prototype.reject = function(file) {
  this.received[file.id].accepted = false
  this.connection.send({
    type: 'file:reject'
  })
}

PeerFileReceive.prototype.pause = function(file) {
  this.connection.send({
    type: 'file:pause'
  })
}

PeerFileReceive.prototype.resume = function(file) {
  this.connection.send({
    type: 'file:resume'
  })
}

PeerFileReceive.prototype.cancel = function(file) {
  this.connection.send({
    type: 'file:cancel'
  })
}

module.exports = PeerFileReceive
