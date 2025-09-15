'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
import { User } from '@supabase/supabase-js';

type Message = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
};

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const isFetching = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || isFetching.current) return;
    isFetching.current = true;
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
    isFetching.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    fetchMessages().then(() => setLoading(false));

    // THE FIX: Use polling instead of real-time subscription
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000); // Check for new messages every 3 seconds

    // Cleanup function to stop polling when the user leaves the page
    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;
    const content = newMessage;
    setNewMessage(''); // Optimistically clear the input

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content,
    }).select().single();

    if (data) {
        // Optimistically add the new message to the UI immediately
        setMessages(currentMessages => [...currentMessages, data as Message]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 bg-gray-50">
      <div className="flex-grow overflow-y-auto mb-4 p-4 bg-white rounded-xl border space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading messages...</p>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.sender_id === user?.id ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button type="submit" className="bg-teal-600 text-white rounded-full px-6 py-2 hover:bg-teal-700">
          Send
        </button>
      </form>
    </div>
  );
}