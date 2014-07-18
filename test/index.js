var run = require('tape')
var fs = require('fs')
var send = require('../send')
var receive = require('../receive')
var fauxnnection = require('./lib/fauxnnection')

var file = new Blob([fs.readFileSync('./test/fixtures/sample.txt', 'utf-8')], {
  type: 'text/plain'
})

// Accept
run('receiver can accept', function(test) {
  var connection = fauxnnection()
  test.plan(2)

  receive(connection)
    .on('incoming', function(file) {
      test.pass('got incoming file')
      this.accept(file)
    })

  send(connection, file)
    .on('accept', function() { test.pass('it was accepted') }) 
    .on('reject', function() { test.fail('it was rejected') }) 
})

// Reject
run('receiver can reject', function(test) {
  var connection = fauxnnection()
  test.plan(2)

  receive(connection)
    .on('incoming', function(file) {
      test.pass('got incoming file')
      this.reject(file)
    })

  send(connection, file)
    .on('reject', function() { test.pass('it was rejected') }) 
    .on('accept', function() { test.fail('it was accepted') })
})

// RecePause/Resume
run('receiver can pause and resume', function(test) {
  var connection = fauxnnection()
  test.plan(2)

  var timeout = null
  var beenPaused = false

  receive(connection)
    .on('incoming', function(file) {
      this.accept(file)
    })
    .on('progress', function(file, bytesReceived) {
      if (!beenPaused) {
        if (timeout !== null) {
          test.fail('it didn’t pause')
          return
        }

        this.pause(file)
        timeout = setTimeout(function() {
          beenPaused = true
          test.pass('it paused')
          this.resume(file) 
        }.bind(this), 100)
      }
    })
    .on('complete', function(file) {
      var blob = new Blob(file.data, { type: file.type })
      test.equal(blob.size, file.size, 'it resumed')
    })

  send(connection, file)
})

run('sender can pause and resume', function(test) {
  var connection = fauxnnection()
  test.plan(2)

  var timeout = null
  var beenPaused = false

  receive(connection)
    .on('incoming', function(file) {
      this.accept(file)
    })
    .on('complete', function(file) {
      var blob = new Blob(file.data, { type: file.type })
      test.equal(blob.size, file.size, 'it resumed')
    })

  send(connection, file)
    .on('progress', function(file, bytesReceived) {
      if (!beenPaused) {
        if (timeout !== null) {
          test.fail('it didn’t pause')
          return
        }

        this.pause(file)
        timeout = setTimeout(function() {
          beenPaused = true
          test.pass('it paused')
          this.resume(file) 
        }.bind(this), 100)
      }
    })
})

// Cancel
run('receiver can cancel', function(test) {
  var connection = fauxnnection()
  test.plan(2)

  receive(connection)
    .on('incoming', function(file) {
      this.accept(file)
    })
    .on('progress', function(file) {
      test.pass('progress ran once')
      this.cancel(file)
    })

  send(connection, file)
    .on('cancel', function(file) {
      test.pass('it was cancelled')
    })
})

run('sender can cancel', function(test) {
  var connection = fauxnnection()
  test.plan(2)

  receive(connection)
    .on('incoming', function(file) {
      this.accept(file)
    })
    .on('cancel', function(file) {
      test.pass('it was cancelled')
    })

  send(connection, file)
    .on('progress', function(file) {
      test.pass('progress ran once')
      this.cancel(file)
    })
})
