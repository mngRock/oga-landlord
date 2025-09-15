'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

type TenantOption = {
  tenant_id: string;
  full_name: string;
  property_id: string;
  property_title: string;
};

type ModalProps = {
  onClose: () => void;
  onPaymentRecorded: () => void;
  landlordId: string;
};

export default function RecordPaymentModal({ onClose, onPaymentRecorded, landlordId }: ModalProps) {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  
  // Form state
  const [selectedTenancy, setSelectedTenancy] = useState(''); // Will store "tenantId|propertyId"
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('bank_transfer');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      // THE FIX: Call our new, reliable RPC function
      const { data, error } = await supabase.rpc('get_my_active_tenants');
      
      if (error) {
        console.error("Error fetching tenants for payment:", error);
        toast.error("Could not load your tenants list.");
      } else if (data) {
        setTenants(data);
      }
      setLoading(false);
    };
    fetchTenants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenancy || !amount || !paymentDate) {
      toast.error("Please fill out all fields.");
      return;
    }
    const toastId = toast.loading('Recording payment...');

    const [tenantId, propertyId] = selectedTenancy.split('|');

    const { error } = await supabase.from('payments').insert({
      tenant_id: tenantId,
      property_id: propertyId,
      landlord_id: landlordId,
      amount: parseInt(amount, 10),
      payment_date: paymentDate,
      method: method,
    });

    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Payment recorded!', { id: toastId });
      onPaymentRecorded();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <h2 className="text-xl font-semibold mb-4">Record New Payment</h2>
        {loading ? (
          <p>Loading tenants...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Tenant & Property</label>
              <select value={selectedTenancy} onChange={(e) => setSelectedTenancy(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md bg-white" required>
                <option value="" disabled>Select a tenant...</option>
                {tenants.map(t => 
                  <option key={`${t.tenant_id}-${t.property_id}`} value={`${t.tenant_id}|${t.property_id}`}>
                    {t.full_name} ({t.property_title})
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Amount (₦)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Payment Date</label>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md bg-white">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md">Record Payment</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
