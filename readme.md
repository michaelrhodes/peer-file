# peer-file
peer-file is a little library for doing p2p file transfers over webrtc. 

[![Browser support](https://ci.testling.com/michaelrhodes/peer-file.png)](https://ci.testling.com/michaelrhodes/peer-file)

## Install
```sh
$ npm install peer-file 
```

### Usage
``` html
<script src="/lib/peer.js"></script>
<script src="build.js"></script>
```
``` js
var send = require('peer-file/send')
var receive = require('peer-file/receive')
var peer = new Peer('some-id')

peer.on('connection', function(connection) {
  connection.on('open', function() {

    // Receive
    receive(connection)
      .on('incoming', function(file) {
        this.accept(file) || this.reject(file)
      })
      .on('progress', function(file, bytesReceived) {
        Math.ceil(bytesReceived / file.size * 100)
      })
      .on('complete', function(file) {
        new Blob(file.data, { type: file.type })
      })

    // Send
    var file = input.files[0]
    send(connection, file)
      .on('progress', function(bytesSent) {
        Math.ceil(bytesSent / file.size * 100)
      })
  })
})
```

peer-file was developed using [peerjs](https://github.com/peers/peerjs), however it isn’t bound to that library. So long as the provided connection object emits data events, has a send method, and can handle JSON, it could be substituted.

### Complete API
```js
// Single use
peerfile.send(connection, file)
  .on('accept', function() {})
  .on('reject', function() {})
  .on('progress', function(bytesSent) {})
  .on('complete', function() {})
  .on('cancel', function() {})
  .pause()
  .resume()
  .cancel()

// Long running
peerfile.receive(connection)
  .on('incoming', function(file) {})
  .on('progress', function(file, bytesReceived) {})
  .on('complete', function(file) {})
  .on('cancel', function(file) {})
  .accept(file)
  .reject(file)
  .pause(file)
  .resume(file)
  .cancel(file)
```

### License
[MIT](http://opensource.org/licenses/MIT)
