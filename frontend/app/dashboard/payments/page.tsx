'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import { User } from '@supabase/supabase-js';

type Payment = {
  id: string;
  amount: number;
  payment_date: string;
  tenant_name: string;
  property_title: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { setLoading(false); return; }
    setUser(currentUser);

    // THE FIX: Call our new, reliable RPC function
    const { data, error } = await supabase.rpc('get_landlord_payments');
    
    if (error) {
      console.error("Error fetching payments:", error);
    } else if (data) {
      setPayments(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="p-6">
      {isModalOpen && user && (
        <RecordPaymentModal 
          onClose={() => setIsModalOpen(false)}
          onPaymentRecorded={fetchPayments}
          landlordId={user.id}
        />
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Payment History</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-teal-600 text-white flex items-center px-4 py-2 rounded-lg hover:bg-teal-700">
          <i className="fas fa-plus mr-2"></i> Record Payment
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10">Loading payments...</td></tr>
            ) : payments.length > 0 ? (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 text-sm">{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium">{payment.tenant_name || 'N/A'}</td>
                  <td className="px-6 py-4">{payment.property_title || 'N/A'}</td>
                  <td className="px-6 py-4 font-semibold text-green-700">₦{new Intl.NumberFormat().format(payment.amount)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-10">No payments have been recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}