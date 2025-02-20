import { Server } from 'socket.io';

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('Creating new Socket.io server...');
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      transports: ['websocket'],
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    let votes = { green: 0, yellow: 0, red: 0 }

    io.on('connection', (socket) => {
      socket.emit('vote_update', votes)

      socket.on('vote', (data) => {
        console.log('Received vote:', data)
        const { color } = data  // We don't need userId anymore
        votes[color]++
        io.emit('vote_update', votes)
      });

      socket.on('reset', () => {
        console.log('Resetting votes...')
        votes = { green: 0, yellow: 0, red: 0 }
        io.emit('vote_update', votes)
        io.emit('reset_cooldown') // Add this new event
      });
    })

    res.socket.server.io = io;
  }

  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default ioHandler;