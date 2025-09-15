'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import AddPropertyFlow from '@/components/AddPropertyFlow';
import toast from 'react-hot-toast';
import LandlordPropertyDetailView from '@/components/LandlordPropertyDetailView';
import OnboardTenantModal from '@/components/OnboardTenantModal';

export default function ManagePropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

  const fetchProperty = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select(`*, profiles(*), buildings(*)`)
        .eq('id', propertyId)
        .single();

      if (fetchError) throw fetchError;
      
      if (data) {
        setProperty(data);
      } else {
        setError("Property not found.");
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError("Failed to load property details.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { fetchProperty(); }, [fetchProperty]);

  const handleDelete = async () => {
    if (!property) return;
    if (window.confirm('Are you sure you want to permanently delete this property and all its associated data? This action cannot be undone.')) {
      const toastId = toast.loading('Deleting property...');
      try {
        if (property.media_urls && property.media_urls.length > 0) {
          const pathsToDelete = property.media_urls.map((item: any) => {
            const url = typeof item === 'string' ? item : item.url;
            return url.split('/property-images/')[1];
          }).filter(Boolean);

          if(pathsToDelete.length > 0) {
            await supabase.storage.from('property-images').remove(pathsToDelete);
          }
        }
        await supabase.from('properties').delete().eq('id', property.id);
        toast.success('Property deleted successfully.', { id: toastId });
        router.push('/dashboard/properties');
        router.refresh();
      } catch (err: any) {
        toast.error(`Error deleting property: ${err.message}`, { id: toastId });
      }
    }
  };

  const handleComplete = () => {
    setIsEditModalOpen(false);
    setIsOnboardModalOpen(false);
    fetchProperty();
  };
  
  if (loading) return <div className="p-6 text-center">Loading Property Details...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!property) return notFound();

  return (
    <div className="p-6">
      {isEditModalOpen && (
        <AddPropertyFlow 
            onClose={() => setIsEditModalOpen(false)} 
            userId={property.landlord_id} 
            onComplete={handleComplete} 
            editData={property} 
        />
      )}
      {isOnboardModalOpen && (
        <OnboardTenantModal
            propertyId={property.id}
            onClose={() => setIsOnboardModalOpen(false)}
            onComplete={handleComplete}
        />
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Property</h1>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setIsOnboardModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
            <i className="fas fa-user-plus"></i> Onboard Tenant
          </button>
          <button onClick={() => setIsEditModalOpen(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2 text-sm">
            <i className="fas fa-edit"></i> Edit
          </button>
          <button onClick={handleDelete} className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center gap-2 text-sm">
            <i className="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <LandlordPropertyDetailView property={property} />
      </div>
    </div>
  );
}