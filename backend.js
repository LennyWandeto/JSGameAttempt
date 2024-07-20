const express = require('express')
const app = express()

const SPEED = 10
// Socket setupp!!!
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 4000 })

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {}
const backEndProjectiles = {}
let backendProjectileId = 0

io.on('connection', (socket) => {
  console.log('a user has connected')
  backEndPlayers[socket.id] = {
    x: 500 * Math.random(),
    y: 500 * Math.random(),
    color: `hsl(${360 * Math.random()}, 100%, 50%)`,
    sequenceNumber: 0
  }
  io.emit('updatePlayers', backEndPlayers)

  socket.on('initCanvas', ({width, height})=>{
    backEndPlayers[socket.id].canvas = {
      width,
      height
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })
  socket.on('keydown', ({keycode, sequenceNumber}) => {
    backEndPlayers[socket.id].sequenceNumber = sequenceNumber + 1
    switch (keycode) {
      case 'ArrowUp':
        backEndPlayers[socket.id].y -= SPEED;
        break;
      case 'ArrowDown':
        backEndPlayers[socket.id].y += SPEED;
        break;
      case 'ArrowLeft':
        backEndPlayers[socket.id].x -= SPEED;
        break;
      case 'ArrowRight':
        backEndPlayers[socket.id].x += SPEED;
        break;
    }
  })
  socket.on('shoot', ({x, y, angle})=>{
    backendProjectileId++;
    backEndProjectiles[backendProjectileId] = {
      x,
      y,
      angle,
      playerId: socket.id,
      radius: 5,
      color: 'white',
      velocity: {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
      }
    }
  })
})

// backend ticker
setInterval(() => {

  // update projectile position
  for (const id in backEndProjectiles){
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

    // remove projectiles if they go off screen
    const PROJECTILE_RADIUS = 5
    if(backEndProjectiles[id].x - PROJECTILE_RADIUS >= backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.width ||
      backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 ||
      backEndProjectiles[id].y - PROJECTILE_RADIUS >= backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.height ||
      backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0  // remove projectiles that go off screen
    ){
      delete backEndProjectiles[id]
    }
  }
  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndPlayers)
}, 15)
server.listen(port, () => {
  console.log(`Example app listening on port ${port}: http://localhost:${port}`)
})
