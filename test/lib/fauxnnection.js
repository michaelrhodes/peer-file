var emitter = require('emitter-component')

var Fauxnnection = function() {
  if (!(this instanceof Fauxnnection)) {
    return new Fauxnnection
  }
}

emitter(Fauxnnection.prototype)

Fauxnnection.prototype.send = function(data) {
  this.emit('data', data)
}

module.exports = Fauxnnection
