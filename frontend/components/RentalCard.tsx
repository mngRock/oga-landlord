'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function RentalCard({ rentalDetails, onUpdate }: { rentalDetails: any, onUpdate: () => void }) {
  const { tenancy, property, landlord, payments } = rentalDetails;
  const [agreementUrl, setAgreementUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (tenancy?.contract_url) {
      const generateUrl = async () => {
        const { data } = await supabase.storage.from('tenancy-agreements').createSignedUrl(tenancy.contract_url, 3600);
        if (data) setAgreementUrl(data.signedUrl);
      };
      generateUrl();
    }
  }, [tenancy?.contract_url]);
  
  const handleAcceptAgreement = async () => {
    if (!tenancy) return;
    const toastId = toast.loading('Accepting agreement...');
    const { error } = await supabase
      .from('tenancies')
      .update({ is_active: true })
      .eq('id', tenancy.id);

    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Agreement accepted! Your tenancy is now active.', { id: toastId });
      onUpdate();
    }
  };

  const handleMessageLandlord = async () => {
    const toastId = toast.loading('Opening conversation...');
    try {
      let { data: existingConvo } = await supabase.from('conversations')
        .select('id')
        .eq('landlord_id', landlord.id)
        .eq('tenant_id', tenancy.tenant_id)
        .eq('property_id', property.id)
        .single();

      let conversationId = existingConvo?.id;

      if (!conversationId) {
        const { data: newConvo, error } = await supabase.from('conversations').insert({
          landlord_id: landlord.id,
          tenant_id: tenancy.tenant_id,
          property_id: property.id
        }).select('id').single();
        if (error) throw error;
        conversationId = newConvo.id;
      }
      
      toast.dismiss(toastId);
      router.push(`/dashboard/messages/${conversationId}`);

    } catch (error: any) {
        toast.error(`Error: ${error.message}`, { id: toastId });
    }
  };

  // UI for a pending agreement
  if (!tenancy.is_active) {
    return (
      <div className="bg-white rounded-xl border-2 border-teal-500 p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-teal-700">Action Required: Review Your Tenancy Agreement</h2>
        <p className="text-gray-600 mt-2 mb-4">Your landlord has prepared the agreement for <strong>{property.title}</strong>. Please review the document carefully before accepting.</p>
        {agreementUrl ? (
            <a href={agreementUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors">
                <i className="fas fa-file-pdf mr-2"></i>View Agreement PDF
            </a>
        ) : <p className="text-sm text-gray-500">Generating secure link...</p>}
        
        <div className="mt-6 border-t pt-4">
            <p className="text-xs text-gray-500 mb-2">By clicking "Accept & Finalize", you agree to the terms outlined in the document.</p>
            <button onClick={handleAcceptAgreement} className="w-full md:w-auto bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-transform hover:scale-105">
                Accept & Finalize Agreement
            </button>
        </div>
      </div>
    );
  }

  // UI for an active tenancy
  return (
    <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6">
            <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold mb-4">{property.title}</h2>
                <button onClick={handleMessageLandlord} className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">Message Landlord</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div><p className="text-gray-500">Address</p><p className="font-medium">{property.address}, {property.city}</p></div>
                <div><p className="text-gray-500">Landlord</p><p className="font-medium">{landlord.full_name}</p></div>
                <div><p className="text-gray-500">Lease End</p><p className="font-medium">{new Date(tenancy.end_date).toLocaleDateString()}</p></div>
            </div>
        </div>
        <div className="px-6 pb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-4">Payment History</h3>
            <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-medium">Date</th><th className="px-4 py-2 text-left text-xs font-medium">Amount</th><th className="px-4 py-2 text-left text-xs font-medium">Method</th></tr></thead>
                    <tbody className="divide-y">
                        {payments && payments.length > 0 ? (
                            payments.map((p: any) => (
                                <tr key={p.id}><td className="px-4 py-2 text-sm">{new Date(p.payment_date).toLocaleDateString()}</td><td className="px-4 py-2 text-sm font-medium">₦{new Intl.NumberFormat().format(p.amount)}</td><td className="px-4 py-2 text-sm capitalize">{p.method.replace('_', ' ')}</td></tr>
                            ))
                        ) : ( <tr><td colSpan={3} className="text-center py-6 text-gray-500 text-sm">No payments recorded.</td></tr> )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}