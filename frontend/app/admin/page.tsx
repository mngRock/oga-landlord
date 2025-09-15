'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

type PendingLandlord = {
  id: string; full_name: string; email: string;
  verification_documents: { identity: string, ownership: string };
};

export default function AdminVerificationPage() {
  const [pendingLandlords, setPendingLandlords] = useState<PendingLandlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [docUrls, setDocUrls] = useState<Record<string, {identity: string, ownership: string}>>({});

  const fetchPendingLandlords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_pending_verifications');
    if (error) { console.error("Error:", error); }
    else if (data) { setPendingLandlords(data); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPendingLandlords(); }, [fetchPendingLandlords]);

  const handleDecision = async (landlordId: string, decision: 'verified' | 'rejected') => {
    const { error } = await supabase.from('profiles').update({ verification_status: decision }).eq('id', landlordId);
    if (error) { alert(`Error: ${error.message}`); } 
    else { alert(`Landlord has been ${decision}.`); fetchPendingLandlords(); }
  };

  const generateDocUrls = async (landlord: PendingLandlord) => {
    if (docUrls[landlord.id] || !landlord.verification_documents) return;
    const { data: idData } = await supabase.storage.from('verification-documents').createSignedUrl(landlord.verification_documents.identity, 3600);
    const { data: ownerData } = await supabase.storage.from('verification-documents').createSignedUrl(landlord.verification_documents.ownership, 3600);
    if (idData?.signedUrl && ownerData?.signedUrl) {
        setDocUrls(prev => ({ ...prev, [landlord.id]: { identity: idData.signedUrl, ownership: ownerData.signedUrl } }));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Verification Requests</h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr><th className="px-6 py-3 text-left">Landlord</th><th className="px-6 py-3 text-left">Email</th><th className="px-6 py-3 text-left">Documents</th><th className="px-6 py-3 text-left">Actions</th></tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10">Loading...</td></tr>
            ) : pendingLandlords.length > 0 ? (
              pendingLandlords.map((landlord) => (
                <tr key={landlord.id}>
                  <td className="px-6 py-4 font-medium">{landlord.full_name}</td>
                  <td className="px-6 py-4 text-sm">{landlord.email}</td>
                  <td className="px-6 py-4">
                    <div className="relative group">
                      <button onMouseEnter={() => generateDocUrls(landlord)} className="text-sm text-teal-600 hover:underline">View Documents</button>
                      {docUrls[landlord.id] && (
                        <div className="absolute z-10 hidden group-hover:block bg-white border shadow-lg rounded-md p-2 text-left text-sm whitespace-nowrap">
                          <a href={docUrls[landlord.id].identity} target="_blank" rel="noopener noreferrer" className="block hover:text-teal-600">Proof of ID</a>
                          <a href={docUrls[landlord.id].ownership} target="_blank" rel="noopener noreferrer" className="block hover:text-teal-600">Proof of Ownership</a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => handleDecision(landlord.id, 'verified')} className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md">Approve</button>
                    <button onClick={() => handleDecision(landlord.id, 'rejected')} className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md">Reject</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-10">No pending verification requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}