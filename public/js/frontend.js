const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()




 
const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

const x = canvas.width / 2
const y = canvas.height / 2


// const player = new Player(x, y, 10, 'white')
const frontEndPlayers = {}

const frontEndProjectiles = {}

socket.on('connect', ()=>{
  socket.emit('initCanvas', {width: canvas.width, height: canvas.height})
})

socket.on('updateProjectiles', (backEndProjectiles)=>{
  for (const id in backEndProjectiles){
    const backEndProjectile = backEndProjectiles[id]
    if (!frontEndProjectiles[id]){
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x,
        y: backEndProjectile.y,
        radius: backEndProjectile.radius,
        color: frontEndPlayers[backEndProjectile.playerId]?.color,
        velocity: backEndProjectile.velocity
      })
    }else{
      frontEndProjectiles[id].x = backEndProjectile.x
      frontEndProjectiles[id].y = backEndProjectile.y
      frontEndProjectiles[id].velocity.x = backEndProjectile.velocity.x
      frontEndProjectiles[id].velocity.y = backEndProjectile.velocity.y
    }
  }
  for (const frontEndProjectileId in frontEndProjectiles){
    if (!backEndProjectiles[frontEndProjectileId]){
      delete frontEndProjectiles[frontEndProjectileId]
    }
  }
})

socket.on('updatePlayers', (backendPlayers) => {
  for (const id in backendPlayers) {
    const backendPlayer = backendPlayers[id]

    if (!frontEndPlayers[id]){
      frontEndPlayers[id] = new Player({
        x: backendPlayer.x,
        y: backendPlayer.y,
        radius: 10, 
        color: backendPlayer.color
      })
    }
    else{
      if (id === socket.id){
        // for the single player only

        // if a player already exists
        frontEndPlayers[id].x = backendPlayer.x
        frontEndPlayers[id].y = backendPlayer.y
  
        const lastBackendInputIndex = playerinputs.findIndex(input =>{
          return backendPlayer.sequenceNumber === input.sequenceNumber
        })
        if(lastBackendInputIndex > -1){
          playerinputs.splice(0, lastBackendInputIndex + 1)
        }
        playerinputs.forEach(input =>{
          frontEndPlayers[id].x += input.dx
          frontEndPlayers[id].y += input.dy
        });
      }else{
        // for all other players
        frontEndPlayers[id].x = backendPlayer.x
        frontEndPlayers[id].y = backendPlayer.y

        gsap.to(frontEndPlayers[id],{
          x: backendPlayer.x,
          y: backendPlayer.y,
          duration: 0.015,
          ease: 'elastic.inOut(1, 0.3)'
        })
      }
    }
  }
  for (const id in frontEndPlayers){
    if (!backendPlayers[id]){
      delete frontEndPlayers[id]
    }
  }
})


let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)

for (const id in frontEndPlayers){
  const player = frontEndPlayers[id]
  player.draw()
}

for (const id in frontEndProjectiles){
  const frontEndProjectile = frontEndProjectiles[id]
  frontEndProjectile.draw()
}
  // for (let i = frontEndProjectiles.length - 1; i >= 0; i--){
  //   const frontEndProjectile = frontEndProjectiles[i]
  //   frontEndProjectile.update()

  // }

}

animate()

const keys = {
  up:{
    pressed: false
  },
  left:{
    pressed: false
  },
  down:{
    pressed: false
  },
  right:{
    pressed: false
  }
}

const SPEED = 10
const playerinputs = []
let sequenceNumber = 0

setInterval(() => {
  if (keys.up.pressed){
    playerinputs.push({sequenceNumber, dx: 0, dy: -SPEED})
    frontEndPlayers[socket.id].y -= SPEED
    socket.emit('keydown', {keycode: 'ArrowUp', sequenceNumber})
  }
  if (keys.down.pressed){
    playerinputs.push({sequenceNumber, dx: 0, dy: SPEED})
    frontEndPlayers[socket.id].y += SPEED
    socket.emit('keydown', {keycode: 'ArrowDown', sequenceNumber})
  }
  if (keys.left.pressed){
    playerinputs.push({sequenceNumber, dx: -SPEED, dy: 0})
    frontEndPlayers[socket.id].x -= SPEED
    socket.emit('keydown', {keycode: 'ArrowLeft', sequenceNumber})
  }
  if (keys.right.pressed){
    playerinputs.push({sequenceNumber, dx: SPEED, dy: 0})
    frontEndPlayers[socket.id].x += SPEED
    socket.emit('keydown', {keycode: 'ArrowRight', sequenceNumber})
  }
})

window.addEventListener('keydown', (e)=>{
  if (!frontEndPlayers[socket.id]) return 
  switch(e.code){
    case 'ArrowUp':
      keys.up.pressed = true
      break;
    case 'ArrowDown':
      keys.down.pressed = true
      break;
    case 'ArrowLeft':
      keys.left.pressed = true
      break;
    case 'ArrowRight':
      keys.right.pressed = true
      break;

  }
})

window.addEventListener('keyup', (e)=>{
  if (!frontEndPlayers[socket.id]) return 
  switch(e.code){
    case 'ArrowUp':
      keys.up.pressed = false
      break;
    case 'ArrowDown':
      keys.down.pressed = false
      break;
    case 'ArrowLeft':
      keys.left.pressed = false
      break;
    case 'ArrowRight':
      keys.right.pressed = false
      break;
  }
})
