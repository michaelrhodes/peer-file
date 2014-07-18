var run = require('tape')
var send = require('../send')
var receive = require('../receive')
var fauxnnection = require('./lib/fauxnnection')

var file = new Blob(['Hello'], {
  type: 'text/plain'
})

// Accept
run('can accept', function(test) {
  var connection = fauxnnection()
  test.plan(2)

  receive(connection)
    .on('incoming', function(file) {
      test.pass(true, 'got incoming file')
      setTimeout(this.accept.bind(this, file))
    })

  send(connection, file)
    .on('accept', function() { test.pass(true, 'accepted') }) 
    .on('reject', function() { test.fail(false, 'rejected') }) 
})

// Reject
run('can reject', function(test) {
  var connection = fauxnnection()
  test.plan(2)

  receive(connection)
    .on('incoming', function(file) {
      test.pass(true, 'got incoming file')
      setTimeout(this.reject.bind(this, file))
    })

  send(connection, file)
    .on('reject', function() { test.pass(true, 'rejected') }) 
    .on('accept', function() { test.fail(false, 'accepted') })
})
