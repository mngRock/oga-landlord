'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

type ModalProps = {
  tenancyId: string;
  onClose: () => void;
  onComplete: () => void;
};

export default function RenewTenancyModal({ tenancyId, onClose, onComplete }: ModalProps) {
  const [newEndDate, setNewEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndDate) {
      toast.error("Please select a new lease end date.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Sending renewal offer...');

    const { error } = await supabase.rpc('renew_tenancy', {
      old_tenancy_id: tenancyId,
      new_end_date: newEndDate,
    });

    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Renewal offer sent to tenant!', { id: toastId });
      onComplete();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <h2 className="text-xl font-semibold mb-4">Renew Tenancy Agreement</h2>
        <p className="text-sm text-gray-600 mb-4">Select a new end date for the lease. The tenant will be notified to review and accept the renewal.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">New Lease End Date</label>
            <input 
              type="date" 
              value={newEndDate} 
              onChange={(e) => setNewEndDate(e.target.value)} 
              className="w-full mt-1 px-3 py-2 border rounded-md" 
              required 
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-md disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Renewal Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}