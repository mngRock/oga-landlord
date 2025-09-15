'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UnitForm from './UnitForm';
import { type UnitData, type Fee } from '@/lib/types';
import toast from 'react-hot-toast';
import { nigerianStates, nigerianStatesAndLGAs } from '@/lib/locations';

type BuildingFormProps = { 
  userId: string; 
  onComplete: () => void; 
  initialData?: any; 
};

export default function BuildingForm({ userId, onComplete, initialData }: BuildingFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [lgasForState, setLgasForState] = useState<string[]>([]);
  
  const [units, setUnits] = useState<UnitData[]>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state) {
      setLgasForState(nigerianStatesAndLGAs[state as keyof typeof nigerianStatesAndLGAs] || []);
    } else {
      setLgasForState([]);
    }
  }, [state]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setAddress(initialData.address || '');
      setCity(initialData.city || '');
      setState(initialData.state || '');
      if (initialData.state) {
        setLgasForState(nigerianStatesAndLGAs[initialData.state as keyof typeof nigerianStatesAndLGAs] || []);
      }
      setLga(initialData.lga || '');
    }
  }, [initialData]);

  const handleUnitAdded = (unitData: UnitData) => {
    setUnits([...units, unitData]);
    setIsUnitModalOpen(false);
  };

  const removeUnit = (index: number) => {
    setUnits(units.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!initialData && units.length === 0) {
      toast.error('Please add at least one unit to the building.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(initialData ? 'Updating building...' : 'Saving building...');

    try {
      const buildingPayload = { name, address, city, state, lga, landlord_id: userId };

      if (initialData) {
        const { error } = await supabase.from('buildings').update(buildingPayload).eq('id', initialData.id);
        if (error) throw error;
        toast.success('Building updated successfully!', { id: toastId });
      } else {
        const { data: buildingData, error: buildingError } = await supabase.from('buildings').insert(buildingPayload).select('id').single();
        if (buildingError) throw buildingError;
        const buildingId = buildingData.id;
        
        const unitsToInsert = await Promise.all(units.map(async (unit) => {
            const media_urls = await Promise.all(unit.newMediaFiles.map(async (file) => {
                const fileName = `${userId}/unit-${Date.now()}-${Math.random()}-${file.name}`;
                const { data, error } = await supabase.storage.from('property-images').upload(fileName, file);
                if (error) throw error;
                return { url: supabase.storage.from('property-images').getPublicUrl(data.path).data.publicUrl, type: file.type };
            }));
            return {
                title: unit.title, description: unit.description, bedrooms: parseInt(unit.bedrooms), bathrooms: parseInt(unit.bathrooms), rent_amount: parseInt(unit.rentAmount), rent_frequency: unit.rentFrequency,
                additional_fees: unit.additionalFees.filter(f => f.name && f.amount).map(f => ({...f, amount: parseInt(f.amount)})),
                required_documents: unit.requiredDocuments, inspection_availability: unit.inspectionAvailability,
                landlord_id: userId, building_id: buildingId, media_urls, status: 'available', lga: unit.lga
            };
        }));
        
        if (unitsToInsert.length > 0) {
            const { error: unitsError } = await supabase.from('properties').insert(unitsToInsert);
            if (unitsError) throw unitsError;
        }
        
        toast.success('Building and units saved successfully!', { id: toastId });
      }
      onComplete();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {isUnitModalOpen && (
        <UnitForm onSave={handleUnitAdded} onClose={() => setIsUnitModalOpen(false)} isStandalone={false} />
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold mb-4 text-center">{initialData ? 'Edit Building Details' : 'Add Building & Units'}</h2>
        
        <input type="text" placeholder="Building Name (e.g., Peace Court)" value={name} onChange={(e) => setName(e.target.value)} className="block w-full px-3 py-2 border rounded-md" required />
        <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="block w-full px-3 py-2 border rounded-md" required />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={state} onChange={(e) => { setState(e.target.value); setLga(''); }} className="block w-full px-3 py-2 border rounded-md bg-white" required>
                <option value="" disabled>Select State</option>
                {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={lga} onChange={(e) => setLga(e.target.value)} className="block w-full px-3 py-2 border rounded-md bg-white" required disabled={!state}>
                <option value="" disabled>Select LGA</option>
                {lgasForState.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <input type="text" placeholder="City / Area" value={city} onChange={(e) => setCity(e.target.value)} className="block w-full px-3 py-2 border rounded-md" required />
        </div>
        
        {!initialData && (
          <div className="space-y-2 pt-4">
            <label className="block text-sm font-medium text-gray-700">Units in this Building</label>
            {units.map((unit, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                <p className="text-sm font-medium">{unit.title}</p>
                <button type="button" onClick={() => removeUnit(index)} className="text-red-500 font-bold hover:text-red-700">&times;</button>
              </div>
            ))}
            {units.length === 0 && <p className="text-xs text-gray-500">No units added yet.</p>}
            <button type="button" onClick={() => setIsUnitModalOpen(true)} className="w-full mt-2 text-sm text-teal-600 border-2 border-dashed rounded-md p-2 hover:bg-teal-50">
              + Add a Unit
            </button>
          </div>
        )}
        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-teal-400">
            {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Save Building and All Units')}
          </button>
        </div>
      </form>
    </div>
  );
}