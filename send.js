var uuid = require('uuid')
var read = require('filereader-stream')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter

var PeerFileSend = function(connection, file) {
  if (!(this instanceof PeerFileSend)) {
    return new PeerFileSend(connection, file)
  }

  this.id = uuid.v4()
  this.connection = connection
  this.file = file
  this.chunkSize = 40 * 1000
  this.totalChunks = Math.ceil(this.file.size / this.chunkSize)
  this.stream = null

  this.handle = this.handle.bind(this)
  this.connection.on('data', this.handle)

  this.connection.send({
    type: 'file:start',
    id: this.id,
    meta: {
      name: this.file.name,
      type: this.file.type,
      size: this.file.size,
      chunkSize: this.chunkSize,
      totalChunks: this.totalChunks
    }
  })
}

inherits(PeerFileSend, EventEmitter)

PeerFileSend.prototype.handle = function(data) {
  var acceptable = /^file:(accept|reject|pause|resume|cancel)$/
  var type = data.type || ''
  var action = (type.match(acceptable) || [])[1]

  if (action) {
    this[action]()
  }
}

PeerFileSend.prototype.pause = function() {
  if (this.stream && !this.stream.paused) {
    this.stream.pause()
    this.emit('pause')
  }

  return this
}

PeerFileSend.prototype.resume = function() {
  if (this.stream && this.stream.paused) {
    this.stream.resume()
    this.emit('resume')
  }

  return this
}

PeerFileSend.prototype.accept = function() {
  this.emit('accept')

  this.stream = read(this.file, {
    chunkSize: this.chunkSize
  })

  this.stream.pipe({
    write: function(chunk) {
      this.connection.send({
        type: 'file:chunk',
        id: this.id,
        chunk: chunk
      })
    }.bind(this),

    end: function() {
      // Stop listening to receiver.
      this.connection.removeListener('data', this.handle)

      // Tell receiver that this is the end.
      this.connection.send({
        type: 'file:end',
        id: this.id
      })

      this.emit('complete')
    }.bind(this)
  })

  // An error is thrown if the transfer is cancelled,
  // so we can probably just noop this.
  this.stream.on('error', function() {})

  this.stream.on('progress', function(completed) {
    this.emit('progress', completed)
  }.bind(this))

  return this
}

PeerFileSend.prototype.reject = function() {
  // In the event that an accepted transfer
  // is later rejected, kill the stream.
  this.stream ?
    this.cancel() :
    this.emit('reject')

  return this
}

PeerFileSend.prototype.cancel = function() {
  setTimeout(function() {
    if (this.stream) {
      this.stream.abort()
      this.stream = null
    }

    this.connection.send({
      type: 'file:cancel',
      id: this.id    
    })

    this.emit('cancel')
  }.bind(this))

  return this
}

module.exports = PeerFileSend
