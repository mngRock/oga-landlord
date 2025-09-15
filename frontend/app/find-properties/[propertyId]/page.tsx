'use client'

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

// Dynamically import the gallery to prevent server-side rendering issues
const PropertyDetailView = dynamic(() => import('@/components/PropertyDetailView'), {
  ssr: false,
  loading: () => <div className="p-6"><div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div></div>
});

// A self-contained modal component for applying with a message
function ApplyModal({ onClose, onSubmit, loading }: { onClose: () => void, onSubmit: (message: string) => void, loading: boolean }) {
    const [message, setMessage] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Apply for Property</h2>
                <p className="text-sm text-gray-600 mb-4">Send an optional introductory message to the landlord with your application.</p>
                <textarea 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    placeholder="Hello, I'm very interested in this property..." 
                    className="w-full h-24 p-2 border rounded-md focus:ring-2 focus:ring-teal-500"
                ></textarea>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={() => onSubmit(message)} disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50">
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<'guest' | 'applicant' | 'tenant'>('guest');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!propertyId) return;
      setLoading(true);

      const { data: propertyData } = await supabase.from('properties').select(`*, landlord_id, profiles(*), buildings(*)`).eq('id', propertyId).single();
      
      if (propertyData) {
        setProperty(propertyData);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if the user is the current tenant first
          const { data: tenancy } = await supabase.from('tenancies').select('id').eq('tenant_id', user.id).eq('property_id', propertyId).eq('is_active', true).maybeSingle();
          if (tenancy) {
            setUserStatus('tenant');
          } else {
            // If not a tenant, check for an existing application
            const { data: application } = await supabase.from('applications').select('id').eq('renter_id', user.id).eq('property_id', propertyId).maybeSingle();
            if (application) {
              setUserStatus('applicant');
            } else {
              setUserStatus('guest');
            }
          }
        } else {
          setUserStatus('guest');
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [propertyId]);

  const handleApply = async (message: string) => {
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error('You must be logged in to apply.'); router.push('/'); return; }
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role !== 'renter') { toast.error('Only renters can apply for properties.'); setIsSubmitting(false); return; }

    const toastId = toast.loading('Submitting application...');
    
    const { data: newConversationId, error } = await supabase.rpc('create_application_with_message', {
      property_id_arg: propertyId,
      initial_message: message
    });

    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
      setIsSubmitting(false);
    } else {
      toast.success('Application and message sent!', { id: toastId });
      router.push(`/dashboard/messages/${newConversationId}`);
    }
  };

  const handleMessageLandlord = async () => {
    const toastId = toast.loading('Opening conversation...');
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !property) return;
      
        let { data: existingConvo } = await supabase.from('conversations')
        .select('id').eq('landlord_id', property.landlord_id).eq('tenant_id', user.id).eq('property_id', property.id).single();

        let conversationId = existingConvo?.id;

        if (!conversationId) {
            const { data: newConvo, error } = await supabase.from('conversations').insert({
                landlord_id: property.landlord_id, tenant_id: user.id, property_id: property.id
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

  const renderActionButtons = () => {
    switch(userStatus) {
        case 'tenant':
            return <button onClick={handleMessageLandlord} className="w-full max-w-xs mx-auto py-3 px-4 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700">Message Landlord</button>;
        case 'applicant':
            return <button disabled className="w-full max-w-xs mx-auto py-3 px-4 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed">Already Applied</button>;
        case 'guest':
        default:
            return <button onClick={() => setIsApplyModalOpen(true)} className="w-full max-w-xs mx-auto py-3 px-4 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700">Apply & Message Landlord</button>;
    }
  }

  if (loading) return <div className="p-6">Loading details...</div>;
  if (!property) return notFound();

  return (
    <div className="bg-gray-50 min-h-screen">
      {isApplyModalOpen && <ApplyModal onClose={() => setIsApplyModalOpen(false)} onSubmit={handleApply} loading={isSubmitting} />}
      <header className="bg-white shadow-sm p-4"><h1 className="text-xl font-bold text-teal-700">Oga Landlord</h1></header>
      <main className="max-w-4xl mx-auto p-6">
        <PropertyDetailView property={property} />
        <div className="mt-6 bg-white p-6 rounded-xl shadow-md border text-center">
            <h3 className="text-lg font-medium">Interested?</h3>
            <p className="text-sm text-gray-500 mb-4">This property is managed by {property.profiles?.full_name || 'the landlord'}.</p>
            {renderActionButtons()}
        </div>
      </main>
    </div>
  );
}