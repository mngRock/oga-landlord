'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

type ModalProps = {
  propertyId: string;
  onClose: () => void;
  onComplete: () => void;
};

export default function OnboardTenantModal({ propertyId, onClose, onComplete }: ModalProps) {
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantEmail || !rentAmount || !startDate || !endDate) {
      toast.error("Please fill out all fields.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Sending invitation...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be logged in to perform this action.");

      // This calls our new, secure Edge Function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/onboard-tenant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            propertyId: propertyId,
            tenantEmail: tenantEmail,
            tenantName: tenantName,
            rentAmount: parseInt(rentAmount),
            startDate: startDate,
            endDate: endDate
          }),
        }
      );
      
      const result = await response.json();
      if (!response.ok) {
        // Throw the error message from the Edge Function's response
        throw new Error(result.error || "An unknown error occurred.");
      }

      toast.success('Invitation sent to tenant! They will be prompted to confirm the details.', { id: toastId });
      onComplete();

    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <h2 className="text-xl font-semibold mb-4">Onboard Existing Tenant</h2>
        <p className="text-sm text-gray-600 mb-4">Enter your tenant's details. We will invite them to the platform to confirm the tenancy agreement.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant's Full Name</label>
              <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant's Email</label>
              <input type="email" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rent Amount (per year)</label>
            <input type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Lease Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lease End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-md disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}