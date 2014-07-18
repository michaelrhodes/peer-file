var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter

var Fauxnnection = function() {
  if (!(this instanceof Fauxnnection)) {
    return new Fauxnnection
  }
}

inherits(Fauxnnection, EventEmitter)

Fauxnnection.prototype.send = function(data) {
  this.emit('data', data)
}

module.exports = Fauxnnection
