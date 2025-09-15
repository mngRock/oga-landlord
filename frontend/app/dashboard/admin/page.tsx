'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ViewVerificationDocsModal from '@/components/ViewVerificationDocsModal';

type PendingLandlord = {
  id: string;
  full_name: string;
  email: string;
  verification_documents: { identity: string, ownership: string };
};

export default function AdminPage() {
  const [pendingLandlords, setPendingLandlords] = useState<PendingLandlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLandlord, setSelectedLandlord] = useState<PendingLandlord | null>(null);
  const router = useRouter();

  const fetchPendingLandlords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_pending_verifications');
    if (error) { 
      toast.error("Could not fetch verification requests.");
      console.error("Error fetching pending landlords:", error);
    } else if (data) { 
      setPendingLandlords(data); 
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') {
          // If a non-admin somehow reaches this page, redirect them.
          router.push('/dashboard');
        } else {
          fetchPendingLandlords();
        }
      }
    };
    checkAdmin();
  }, [fetchPendingLandlords, router]);

  const handleDecision = async (landlordId: string, decision: 'verified' | 'rejected') => {
    const toastId = toast.loading(`Updating status to ${decision}...`);
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: decision })
      .eq('id', landlordId);
    
    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success(`Landlord has been ${decision}.`, { id: toastId });
      fetchPendingLandlords(); // Refresh the list of pending landlords
    }
  };

  return (
    <div className="p-6">
      {selectedLandlord && (
        <ViewVerificationDocsModal 
          landlord={selectedLandlord}
          onClose={() => setSelectedLandlord(null)}
        />
      )}
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Admin - Verification Requests</h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Landlord</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10">Loading pending requests...</td></tr>
            ) : pendingLandlords.length > 0 ? (
              pendingLandlords.map((landlord) => (
                <tr key={landlord.id}>
                  <td className="px-6 py-4 font-medium">{landlord.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{landlord.email}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedLandlord(landlord)} className="text-sm text-teal-600 hover:underline">
                      View Documents
                    </button>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => handleDecision(landlord.id, 'verified')} className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200">Approve</button>
                    <button onClick={() => handleDecision(landlord.id, 'rejected')} className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200">Reject</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-10 text-gray-500">No pending verification requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}