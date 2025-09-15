'use client'

import { useState } from 'react';
import UnitForm from './UnitForm';
import BuildingForm from './BuildingForm';
import { supabase } from '@/lib/supabaseClient';
import { type UnitData, type Fee } from '@/lib/types';
import toast from 'react-hot-toast';

type AddPropertyFlowProps = {
  onClose: () => void;
  userId: string;
  onComplete: () => void;
  editData?: any;
};

export default function AddPropertyFlow({ onClose, userId, onComplete, editData }: AddPropertyFlowProps) {
  const [step, setStep] = useState(() => {
    if (!editData) return 'select_type';
    return editData.rent_amount ? 'single_form' : 'building_form';
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveSingleUnit = async (unitData: UnitData) => {
    setLoading(true);
    const toastId = toast.loading('Saving property...');
    
    try {
      const { newMediaFiles, existingMedia, ...restOfUnitData } = unitData;

      const newUploadedUrls = await Promise.all(
        newMediaFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;
          const { data, error } = await supabase.storage.from('property-images').upload(fileName, file);
          if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);
          return { url: supabase.storage.from('property-images').getPublicUrl(data.path).data.publicUrl, type: file.type };
        })
      );

      if (editData && editData.media_urls) {
        const originalUrls = editData.media_urls.map((item: any) => typeof item === 'string' ? item : item.url);
        const keptUrls = existingMedia.map((item: any) => item.url);
        const urlsToDelete = originalUrls.filter((url: string) => !keptUrls.includes(url));
        
        if (urlsToDelete.length > 0) {
          const pathsToDelete = urlsToDelete.map((url: string) => url.split('/property-images/')[1]);
          await supabase.storage.from('property-images').remove(pathsToDelete);
        }
      }

      const finalMediaUrls = [...existingMedia, ...newUploadedUrls];
      
      const propertyToSave: any = {
        title: restOfUnitData.title,
        description: restOfUnitData.description,
        bedrooms: parseInt(restOfUnitData.bedrooms),
        bathrooms: parseInt(restOfUnitData.bathrooms),
        address: restOfUnitData.address,
        city: restOfUnitData.city,
        state: restOfUnitData.state,
        lga: restOfUnitData.lga, // THE FIX: Add the lga property
        rent_amount: parseInt(restOfUnitData.rentAmount),
        rent_frequency: restOfUnitData.rentFrequency,
        additional_fees: unitData.additionalFees.map((f: Fee) => ({...f, amount: parseInt(f.amount)})),
        required_documents: unitData.requiredDocuments,
        inspection_availability: unitData.inspectionAvailability,
        landlord_id: userId,
        media_urls: finalMediaUrls,
      };
      
      if (editData) {
        const { error } = await supabase.from('properties').update(propertyToSave).eq('id', editData.id);
        if (error) throw error;
        toast.success('Property updated successfully!', { id: toastId });
      } else {
        propertyToSave.status = 'available';
        const { error } = await supabase.from('properties').insert([propertyToSave]);
        if (error) throw error;
        toast.success('Property created successfully!', { id: toastId });
      }
      onComplete();

    } catch (error: any) {
      toast.error(`An error occurred: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 'select_type':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-center">What are you listing?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setStep('single_form')} className="p-6 border rounded-lg hover:bg-teal-50 hover:border-teal-500 transition-colors text-center"><i className="fas fa-home text-3xl text-teal-600 mb-2"></i><h3 className="font-semibold">Single Unit Property</h3><p className="text-sm text-gray-500">A standalone house, duplex, etc.</p></button>
              <button onClick={() => setStep('building_form')} className="p-6 border rounded-lg hover:bg-teal-50 hover:border-teal-500 transition-colors text-center"><i className="fas fa-building text-3xl text-teal-600 mb-2"></i><h3 className="font-semibold">Multi-Unit Building</h3><p className="text-sm text-gray-500">A block of flats, an estate, etc.</p></button>
            </div>
          </div>
        );
      case 'single_form':
        return <UnitForm onSave={handleSaveSingleUnit} onClose={onClose} isStandalone={!editData?.building_id} initialData={editData} />;
      case 'building_form':
        return <BuildingForm userId={userId} onComplete={onComplete} initialData={editData} />;
      default:
        return <div>Invalid step. <button onClick={() => setStep('select_type')}>Go Back</button></div>;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative my-8 h-max">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl">&times;</button>
        <div className="relative">
            {renderStep()}
            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                        <i className="fas fa-spinner fa-spin text-3xl text-teal-600"></i>
                        <p className="text-lg font-semibold mt-2">{message}</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

