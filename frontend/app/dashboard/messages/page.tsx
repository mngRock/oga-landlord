'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

type Conversation = {
  id: string;
  other_user_name: string;
  property_title: string;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_my_conversations');
    
    if (error) { 
      console.error("Error fetching conversations:", error); 
      setConversations([]);
    } else if (data) { 
      setConversations(data); 
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Messages</h1>
      <div className="bg-white rounded-xl shadow-sm border">
        <ul className="divide-y divide-gray-200">
          {loading ? ( <li className="p-4 text-center text-gray-500">Loading conversations...</li> ) 
           : conversations.length > 0 ? (
            conversations.map((convo) => (
              <li key={convo.id}>
                <Link href={`/dashboard/messages/${convo.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                  <p className="font-semibold text-gray-800">{convo.other_user_name || 'User'}</p>
                  <p className="text-sm text-gray-500">{convo.property_title || 'Enquiry'}</p>
                </Link>
              </li>
            ))
          ) : ( <li className="p-4 text-center text-gray-500">You have no active conversations.</li> )}
        </ul>
      </div>
    </div>
  );
}