'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SidePanel from './components/SidePanel';
import { useRouter } from 'next/navigation';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean;
};

type Chat = {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
};

type User = {
  id: string;
  username: string;
};

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<{ id: string; prompt: string }[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('Auth check response status:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('Auth check successful:', userData);
          setIsLoggedIn(true);
          setUser(userData);
          // Fetch user's chat history
          fetchUserChats(userData.id);
        } else {
          console.log('Auth check failed:', await response.text());
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const fetchUserChats = async (userId: string) => {
    try {
      const response = await fetch(`/api/chats?userId=${userId}`);
      if (response.ok) {
        const userChats = await response.json();
        // Transform the timestamps to Date objects
        const transformedChats = userChats.map((chat: Chat) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
          messages: chat.messages.map(message => ({
            ...message,
            timestamp: new Date(message.timestamp)
          }))
        }));
        setChats(transformedChats);
        
        // If there are chats, set the most recent one as current
        if (transformedChats.length > 0) {
          setCurrentChat(transformedChats[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  useEffect(() => {
    const processQueue = async () => {
      if (loading || queue.length === 0) return;

      setLoading(true);
      const currentRequest = queue[0];

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "phi3:mini",
            prompt: currentRequest.prompt,
            stream: true,
          }),
        });

        if (!response.body) {
          throw new Error("No response body received.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalResponse = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse the SSE data
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(line.slice(6));
                if (jsonData.response) {
                  finalResponse += jsonData.response;
                  setCurrentResponse(finalResponse);
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }

        // Add the final response to messages
        if (finalResponse) {
          setCurrentChat(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: [...prev.messages, {
                id: Math.random().toString(36).substr(2, 9),
                content: finalResponse,
                isUser: false,
                timestamp: new Date(),
              }],
              title: prev.messages.length === 0 ? prompt.slice(0, 30) + '...' : prev.title
            };
          });
        }
        setCurrentResponse('');

      } catch (error) {
        console.error('Error:', error);
        setCurrentChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, {
              id: Math.random().toString(36).substr(2, 9),
              content: 'Failed to get response. Please try again.',
              isUser: false,
              timestamp: new Date(),
              isError: true,
            }],
            title: prev.title
          };
        });
      } finally {
        setQueue(prev => prev.slice(1));
        setLoading(false);
      }
    };

    processQueue();
  }, [queue, loading]);

  const handleNewChat = async () => {
    // Save current chat if it exists and has messages
    if (currentChat && currentChat.messages.length > 0 && user) {
      try {
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: currentChat.title,
            userId: user.id,
            messages: currentChat.messages
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save chat');
        }

        // Refresh chat list after saving
        await fetchUserChats(user.id);
      } catch (error) {
        console.error('Failed to save chat:', error);
      }
    }

    // Create new chat
    const newChat: Chat = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Chat',
      timestamp: new Date(),
      messages: []
    };

    setCurrentChat(newChat);
    setCurrentResponse('');
  };

  const handleChatSelect = (chatId: string) => {
    const selected = chats.find(chat => chat.id === chatId);
    if (selected) {
      setCurrentChat(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const messageId = Math.random().toString(36).substr(2, 9);
    const newMessage: Message = {
      id: messageId,
      content: prompt,
      isUser: true,
      timestamp: new Date(),
    };

    // Create a new chat if there isn't one
    if (!currentChat) {
      handleNewChat();
    }

    // Update the current chat with the new message and title if it's the first message
    setCurrentChat(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
        title: prev.messages.length === 0 ? prompt : prev.title
      };
    });

    // If this is the first message, update the chat in the chats list too
    if (currentChat && currentChat.messages.length === 0) {
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === currentChat.id 
            ? { ...chat, title: prompt }
            : chat
        )
      );
    }

    setQueue(prev => [...prev, { id: messageId, prompt }]);
    setPrompt('');
  };

  return (
    <div className="flex min-h-screen">
      <SidePanel
        isLoggedIn={isLoggedIn}
        user={user}
        chats={chats}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        currentChatId={currentChat?.id}
      />
      
      <div className="flex-1 bg-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Chat Interface</h1>
            {isLoggedIn && (
              <button
                onClick={handleNewChat}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Start New Chat
              </button>
            )}
          </div>

          <div className="mb-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {currentChat?.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : message.isError
                        ? 'bg-red-100 text-red-700 rounded-bl-none'
                        : 'bg-white text-gray-800 rounded-bl-none'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}

            {/* Streaming response display */}
            {currentResponse && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-white text-gray-800 rounded-bl-none">
                  <p className="whitespace-pre-wrap">{currentResponse}</p>
                  <span className="text-xs opacity-70 mt-1 block animate-pulse">
                    Streaming...
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 border rounded-lg"
              rows={4}
              placeholder="Enter your message..."
            />

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}