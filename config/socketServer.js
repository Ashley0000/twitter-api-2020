const { Message } = require('../models')
const { socketAuthenticated } = require('../middleware/auth')

const onlineUsers = []

module.exports = httpServer => {
  const io = require('socket.io')(httpServer, {
    cors: {
      origin: '*',
      // ['http://localhost:8080', 'https://guanyi608.github.io/']
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  })

  io.use(socketAuthenticated).on('connection', function (socket) {
    const user = socket.handshake.user.toJSON()
    console.log('user has log-in', user)
    const { name, id } = user

    socket.on('joinPublic', () => {
      const findUserId = onlineUsers.map(d => d.id).includes(id)
      if (findUserId === false) {
        onlineUsers.push(user)
      }

      socket.broadcast.emit('joinRoom', `${name}`)
      io.emit('totalUser', onlineUsers)
    })

    socket.on('publicChat', async msg => {
      Message.create({ UserId: id, chatRoomId: '5', message: msg })
      io.emit('publicChat', msg)
    })

    socket.on('leavePublic', () => {
      const userIdIndex = onlineUsers.map(d => { return d.id }).indexOf(id)
      onlineUsers.splice(userIdIndex, 1)

      io.emit('totalUser', onlineUsers)
      socket.broadcast.emit('leaveRoom', `${name}`)
    })
  })
}
