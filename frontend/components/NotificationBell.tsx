'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

type Notification = {
  id: string;
  message: string;
  is_read: boolean;
  link_to: string | null;
  created_at: string;
};

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      // Fetch initial notifications and the unread count
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Set up a real-time listener for new notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          // Add the new notification to the top of the list and update the count
          setNotifications(current => [payload.new as Notification, ...current]);
          setUnreadCount(current => current + 1);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleBellClick = async () => {
    setIsOpen(!isOpen);
    // If opening the panel and there are unread notifications, mark them as read
    if (!isOpen && unreadCount > 0) {
      setUnreadCount(0); // Optimistically update the UI
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    }
  };

  return (
    <div className="relative">
      <button onClick={handleBellClick} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 relative">
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border overflow-hidden z-20">
          <div className="p-3 font-semibold border-b">Notifications</div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(n => (
                <li key={n.id}>
                  <Link href={n.link_to || '#'} onClick={() => setIsOpen(false)} className={`block p-3 hover:bg-gray-50 ${!n.is_read ? 'bg-teal-50' : ''}`}>
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </Link>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-sm text-gray-500">You have no notifications.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}