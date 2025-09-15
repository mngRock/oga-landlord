'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

type ModalProps = {
  tenantId: string;
  landlordName: string;
  onClose: () => void;
};

export default function IssueNoticeModal({ tenantId, landlordName, onClose }: ModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendNotice = async () => {
    if (message.trim() === '') {
      toast.error("Please enter a message for the notice.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Sending notice...');

    const { error } = await supabase.from('notifications').insert({
      user_id: tenantId,
      message: `You have received a new notice from your landlord, ${landlordName}: "${message}"`,
      link_to: '/dashboard/my-rental', // Or a future dedicated notices page
    });

    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Notice sent to tenant successfully.', { id: toastId });
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <h2 className="text-xl font-semibold mb-4">Issue Official Notice</h2>
        <p className="text-sm text-gray-600 mb-4">The tenant will receive this message as an official notification.</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g., Notice of upcoming property inspection on Monday..."
          className="w-full h-24 p-2 border rounded-md focus:ring-2 focus:ring-teal-500"
          required
        ></textarea>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
          <button onClick={handleSendNotice} disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-md">
            {loading ? 'Sending...' : 'Send Notice'}
          </button>
        </div>
      </div>
    </div>
  );
}
