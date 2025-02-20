// pages/api/pusher.js
import Pusher from 'pusher';


  
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true  // Add this for security
});

// Store votes in memory (or use a database in production)
let votes = { green: 0, yellow: 0, red: 0 };

export default async function handler(req, res) {
  // Add cors headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    console.log('Received request:', req.body);
    try {
      const { type, color } = req.body;
      
      if (type === 'vote' && color) {
        votes[color]++;
        await pusher.trigger('poll-channel', 'vote-update', votes);
      } 
      
      if (type === 'reset') {
        votes = { green: 0, yellow: 0, red: 0 };
        await pusher.trigger('poll-channel', 'vote-update', votes);
        await pusher.trigger('poll-channel', 'reset-cooldown', {});
      }

      res.status(200).json(votes);
    } catch (error) {
      console.error('Pusher error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}