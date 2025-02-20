"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import PusherClient from 'pusher-js';

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
  const [pusher, setPusher] = useState(null);
  const [votes, setVotes] = useState({ green: 0, yellow: 0, red: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  useEffect(() => {
    // Debug environment variables
    console.log("Pusher Key:", process.env.NEXT_PUBLIC_PUSHER_KEY);
    console.log("Pusher Cluster:", process.env.NEXT_PUBLIC_PUSHER_CLUSTER);

    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      console.error("Pusher environment variables are missing!");
      return;
    }

    // Only create Pusher client if we haven't already
    if (!pusher) {
      const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });

      setPusher(pusherClient);
      
      const channel = pusherClient.subscribe('poll-channel');
      
      channel.bind('vote-update', (newVotes) => {
        setVotes(newVotes);
      });

      channel.bind('reset-cooldown', () => {
        setCooldown(0);
      });

      return () => {
        pusherClient.unsubscribe('poll-channel');
        pusherClient.disconnect();
      };
    }
  }, []); // No dependencies since we only want this to run once

  // Set admin status in a separate useEffect
  useEffect(() => {
    setIsAdmin(window.location.search.includes('admin=true'));
  }, []);

  const handleVote = async (color) => {
    if (cooldown > 0) return;
    
    try {
      const response = await fetch('/api/pusher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'vote', color })
      });
      
      if (!response.ok) throw new Error('Vote failed');
      
      setCooldown(10);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const resetAll = async () => {
    if (!isAdmin) return;
    
    try {
      const response = await fetch('/api/pusher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reset' })
      });
      
      if (!response.ok) throw new Error('Reset failed');
    } catch (error) {
      console.error('Error resetting:', error);
    }
  };
  
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);
  

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