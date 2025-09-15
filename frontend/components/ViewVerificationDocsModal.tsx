'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type PendingLandlord = {
  id: string;
  full_name: string;
  verification_documents: { identity: string, ownership: string };
};

type ModalProps = {
  landlord: PendingLandlord;
  onClose: () => void;
};

export default function ViewVerificationDocsModal({ landlord, onClose }: ModalProps) {
  const [docUrls, setDocUrls] = useState<{ identity: string, ownership: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateUrls = async () => {
      if (!landlord.verification_documents) {
        setLoading(false);
        return;
      }
      try {
        const { data: idData } = await supabase.storage.from('verification-documents').createSignedUrl(landlord.verification_documents.identity, 3600);
        const { data: ownerData } = await supabase.storage.from('verification-documents').createSignedUrl(landlord.verification_documents.ownership, 3600);
        
        if (idData?.signedUrl && ownerData?.signedUrl) {
          setDocUrls({ identity: idData.signedUrl, ownership: ownerData.signedUrl });
        }
      } catch (error) {
        console.error("Error generating signed URLs:", error);
      } finally {
        setLoading(false);
      }
    };
    generateUrls();
  }, [landlord]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        <h2 className="text-xl font-semibold mb-4">Verification Documents</h2>
        <p className="text-sm text-gray-600 mb-4">For: <span className="font-medium">{landlord.full_name}</span></p>

        {loading ? (
          <p>Generating secure links...</p>
        ) : docUrls ? (
          <div className="space-y-3">
            <a href={docUrls.identity} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors">
              View Proof of Identity
            </a>
            <a href={docUrls.ownership} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors">
              View Proof of Ownership
            </a>
            <p className="text-xs text-gray-500 text-center mt-2">Links are valid for 1 hour.</p>
          </div>
        ) : (
          <p className="text-red-600">Could not retrieve document links. The files may be missing or inaccessible.</p>
        )}
      </div>
    </div>
  );
}