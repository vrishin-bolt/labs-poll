"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import io from 'socket.io-client'; 

const STORAGE_KEY = 'poll_user_id';

const AdminView = ({ votes, total, resetAll }) => {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-gray-900 font-bold">Poll Results (Admin View)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex h-16 rounded-lg overflow-hidden">
            <div 
              className="bg-green-500 relative transition-all" 
              style={{width: `${total === 0 ? 33.33 : (votes.green / total) * 100}%`}}
            >
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold">
                {votes.green === 0 ?  "": votes.green}
              </span>
            </div>
            <div 
              className="bg-yellow-500 relative transition-all" 
              style={{width: `${total === 0 ? 33.33 : (votes.yellow / total) * 100}%`}}
            >
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold">
                {votes.yellow === 0 ?  "": votes.yellow}
              </span>
            </div>
            <div 
              className="bg-red-500 relative transition-all" 
              style={{width: `${total === 0 ? 33.33 : (votes.red / total) * 100}%`}}
            >
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold">
                {votes.red === 0 ?  "": votes.red}
              </span>
            </div>
          </div>

          <div className="text-center text-lg font-medium text-gray-900">
            Total responses: {total}
          </div>

          <Button 
            className="w-full bg-gray-600 hover:bg-gray-700 text-white"
            onClick={resetAll}
          >
            Reset Poll
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const StudentView = ({ onVote, cooldown }) => {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-gray-900">Quick Poll</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {cooldown > 0 && (
            <Alert variant="warning" className="mb-4 bg-yellow-50 text-gray-900 border-yellow-200">
              <span className="font-medium">You can vote again in {cooldown} seconds</span>
            </Alert>
          )}
          
          <div className="flex justify-between gap-4">
            <Button 
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={() => onVote('green')}
              disabled={cooldown > 0}
            >
              With you
            </Button>
            <Button 
              className="flex-1 bg-yellow-500 hover:bg-yellow-600"
              onClick={() => onVote('yellow')}
              disabled={cooldown > 0}
            >
              Somewhat
            </Button>
            <Button 
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={() => onVote('red')}
              disabled={cooldown > 0}
            >
              Not with you
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ClassroomPoll = () => {
  const [socket, setSocket] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState('');
  const [votes, setVotes] = useState({
    green: 0,
    yellow: 0,
    red: 0
  });
  
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Initialize socket connection
    console.log('Initializing socket connection...')
    const socketIo = io('http://localhost:3000', {
      path: '/api/socket'
    });

    socketIo.on('connect', () => {
      console.log('Connected to socket server')
    });

    socketIo.on('vote_update', (newVotes) => {
      console.log('Received vote update:', newVotes)
      setVotes(newVotes);
    });

    // Add this new listener
    socketIo.on('reset_cooldown', () => {
      setCooldown(0);  // Reset cooldown when admin resets
    });

    setSocket(socketIo);

    // Set admin status and user ID
    setIsAdmin(window.location.search.includes('admin=true'));
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUserId(stored);
    } else {
      const newId = `user-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEY, newId);
      setUserId(newId);
    }

    return () => {
      socketIo.disconnect();
    };
  }, []);
  
  const handleVote = (color) => {
    if (cooldown > 0 || !socket) return;
    
    console.log('Sending vote:', color)
    socket.emit('vote', { color, userId });
    setCooldown(10);
  };
  
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);
  
  
  const resetAll = () => {
    if (!isAdmin || !socket) return;
    socket.emit('reset');
  };
  
  const total = votes.green + votes.yellow + votes.red;
  
  return isAdmin ? (
    <AdminView 
      votes={votes}
      total={total}
      resetAll={resetAll}
    />
  ) : (
    <StudentView 
      onVote={handleVote}
      cooldown={cooldown}
    />
  );
};

export default ClassroomPoll;