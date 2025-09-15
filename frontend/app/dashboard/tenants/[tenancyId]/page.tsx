'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import IssueNoticeModal from '@/components/IssueNoticeModal';
import RenewTenancyModal from '@/components/RenewTenancyModal';

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenancyId = params.tenancyId as string;

  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [landlordName, setLandlordName] = useState('');

  const fetchDetails = useCallback(async () => {
    if (!tenancyId) return;
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: landlordProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (landlordProfile) setLandlordName(landlordProfile.full_name || 'Your Landlord');
    }

    const { data, error } = await supabase.rpc('get_tenancy_details_by_id', {
      tenancy_id_arg: tenancyId
    });
    if (error) {
      console.error("Error fetching tenancy details:", error);
      toast.error("Could not load tenancy details.");
    } else if (data) {
      setDetails(data);
    }
    setLoading(false);
  }, [tenancyId]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const handleSendMessage = async () => {
    if (!details) return;
    const { tenant, property, tenancy } = details;
    const toastId = toast.loading('Opening conversation...');
    try {
      let { data: existingConvo } = await supabase.from('conversations').select('id').eq('landlord_id', tenancy.landlord_id).eq('tenant_id', tenant.id).eq('property_id', property.id).single();
      let conversationId = existingConvo?.id;
      if (!conversationId) {
        const { data: newConvo, error } = await supabase.from('conversations').insert({ landlord_id: tenancy.landlord_id, tenant_id: tenant.id, property_id: property.id }).select('id').single();
        if (error) throw error;
        conversationId = newConvo.id;
      }
      toast.dismiss(toastId);
      router.push(`/dashboard/messages/${conversationId}`);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    }
  };

  const handleCancelTenancy = async () => {
    if (!details) return;
    if (window.confirm('Are you sure you want to cancel this tenancy? This will also re-list the property as "available".')) {
        const toastId = toast.loading('Cancelling tenancy...');
        const { error } = await supabase.rpc('cancel_tenancy_and_relist_property', {
          tenancy_id_arg: details.tenancy.id
        });
        if (error) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        } else {
            toast.success('Tenancy cancelled and property re-listed.', { id: toastId });
            router.push('/dashboard/tenants');
        }
    }
  };

  const handleComplete = () => {
    setIsNoticeModalOpen(false);
    setIsRenewModalOpen(false);
    fetchDetails(); // Refresh the data on the page
  };

  if (loading) return <div className="p-6 text-center">Loading Tenant Details...</div>;
  if (!details) return notFound();

  const { tenancy, property, tenant, payments, maintenance } = details;

  return (
    <div className="p-6">
      {isNoticeModalOpen && (
        <IssueNoticeModal
          tenantId={tenant.id}
          landlordName={landlordName}
          onClose={() => setIsNoticeModalOpen(false)}
        />
      )}
      {isRenewModalOpen && (
        <RenewTenancyModal 
            tenancyId={tenancy.id} 
            onClose={() => setIsRenewModalOpen(false)} 
            onComplete={handleComplete} 
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{tenant.full_name}</h1>
        <p className="text-gray-600">Tenant at <Link href={`/dashboard/properties/${property.id}`} className="text-teal-600 hover:underline">{property.title}</Link></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Tenancy Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Rent</p><p className="font-medium">₦{new Intl.NumberFormat().format(tenancy.rent_amount)} / {tenancy.rent_frequency.replace('_', ' ')}</p></div>
              <div><p className="text-gray-500">Lease End</p><p className="font-medium">{new Date(tenancy.end_date).toLocaleDateString()}</p></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            {payments && payments.length > 0 ? (
                <ul className="divide-y text-sm"><li className="py-2 flex justify-between font-medium text-gray-500"><span>Date</span><span>Amount</span></li>{payments.map((p: any) => (<li key={p.id} className="py-2 flex justify-between"><span>{new Date(p.payment_date).toLocaleDateString()}</span><span className="font-semibold text-gray-800">₦{new Intl.NumberFormat().format(p.amount)}</span></li>))}</ul>
            ) : <p className="text-sm text-gray-500">No payments recorded for this tenant.</p>}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Maintenance History</h2>
            {maintenance && maintenance.length > 0 ? (
                 <ul className="divide-y text-sm"><li className="py-2 flex justify-between font-medium text-gray-500"><span>Issue</span><span>Status</span></li>{maintenance.map((m: any) => (<li key={m.id} className="py-2 flex justify-between"><span>{m.title}</span><span className="capitalize px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">{m.status}</span></li>))}</ul>
            ) : <p className="text-sm text-gray-500">No maintenance requests from this tenant.</p>}
          </div>
        </div>

        <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Actions</h2>
                <div className="space-y-3">
                    <button onClick={handleSendMessage} className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 flex items-center gap-2">
                        <i className="fas fa-comments w-4"></i> Send Message
                    </button>
                    <button onClick={() => setIsNoticeModalOpen(true)} className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 flex items-center gap-2">
                        <i className="fas fa-file-alt w-4"></i> Issue Notice
                    </button>
                    <button onClick={() => setIsRenewModalOpen(true)} className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 flex items-center gap-2">
                        <i className="fas fa-sync-alt w-4"></i> Renew Contract
                    </button>
                    <button onClick={handleCancelTenancy} className="w-full text-left px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm font-medium flex items-center gap-2">
                        <i className="fas fa-times-circle w-4"></i> Cancel Tenancy
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}