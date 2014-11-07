var send = require('peer-file/send')
var receive = require('peer-file/receive')
var state = require('history-state')({ hash: true })
var peer = require('peerjs')(null, { key: '5eqjv36bbwamunmi' })
var label, input, p, you

peer.on('open', function(id) {
  you = id

  p = document.createElement('p')
  label = document.createElement('label')
  input = document.createElement('input')
  input.type = 'file'
  input.id = 'id-' + you
  input.style.display = 'none'
  label.setAttribute('for', input.id)

  if (!location.hash) {
    var url = location.href.replace(/^([^#]+).*$/,
      function(match, $1) {
        return $1 + '#' + you
      })

    p.innerHTML = 'Give this URL to someone: ' + url.link(url)
    document.body.appendChild(p)
  }

  document.body.appendChild(label)
  document.body.appendChild(input)
})

var init = function(connection) {
  connection.on('open', function() {
    label.textContent = 'Send a file to ' + connection.id
    p.style.display = 'none'
    input.style.display = 'block'


    // Receive
    receive(connection)
      .on('incoming', function(file) {
        confirm('About to download “' + file.name + '”') ?
          this.accept(file) :
          this.reject(file)
      })
      .on('progress', function(file, bytesReceived) {
        var percentage = Math.ceil(bytesReceived / file.size * 100)
        document.title = 'Downloaded ' + percentage + '% of ' + file.name
      })
      .on('complete', function(file) {
        var anchor = document.createElement('a')
        var binary = new Blob(file.data, { type: file.type })
        anchor.href = URL.createObjectURL(binary)
        anchor.download =
        anchor.textContent = file.name
        document.body.appendChild(anchor)
      })

    // Send 
    input.onchange = function() {
      var file = input.files[0]
      send(connection, file)
        .on('progress', function(bytesSent) {
          var percentage = Math.ceil(bytesSent / file.size * 100)
          document.title = 'Sent ' + percentage + '% of ' + file.name
        })
    }
  })
}

peer.on('connection', init)

state.on('change', function() {
  var id = location.hash.replace(/^#/, '')
  if (id && id !== you) {
    init(peer.connect(id))
  }
})
