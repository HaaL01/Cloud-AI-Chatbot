// components/SidePanel.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

type Chat = {
  id: string;
  title: string;
  timestamp: Date;
};

type User = {
  id: string;
  username: string;
};

export default function SidePanel({ 
  isLoggedIn, 
  user, 
  chats,
  onChatSelect,
  onNewChat,
  currentChatId
}: { 
  isLoggedIn: boolean;
  user: User | null;
  chats: Chat[];
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  currentChatId?: string;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Successfully logged out!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 p-4 flex flex-col">
      {!isLoggedIn ? (
        <button
          onClick={() => router.push('/auth')}
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          Login / Sign up
        </button>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Logout
            </button>
          </div>

          <div className="flex justify-between items-center mb-4">
            Chat History
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={`w-full p-2 text-left rounded-md hover:bg-gray-100 transition-colors ${
                    chat.id === currentChatId ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    {chat.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(chat.timestamp).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}