'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { type Fee, type UnitData, type InspectionSchedule } from '@/lib/types';
import toast from 'react-hot-toast';
import { nigerianStatesAndLGAs, nigerianStates } from '@/lib/locations';

type UnitFormProps = { onSave: (unitData: UnitData) => void; onClose: () => void; isStandalone: boolean; initialData?: any; };
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const commonDocs = ['National ID', 'Work ID', 'Proof of Income', 'Reference Letter'];

export default function UnitForm({ onSave, onClose, isStandalone, initialData }: UnitFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [lgasForState, setLgasForState] = useState<string[]>([]);
  const [rentAmount, setRentAmount] = useState('');
  const [rentFrequency, setRentFrequency] = useState('');
  const [additionalFees, setAdditionalFees] = useState<Fee[]>([]);
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [customDoc, setCustomDoc] = useState('');
  const [schedule, setSchedule] = useState<InspectionSchedule>({ days: [], startTime: '09:00', endTime: '17:00' });
  
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ url: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state && nigerianStatesAndLGAs[state as keyof typeof nigerianStatesAndLGAs]) {
        setLgasForState(nigerianStatesAndLGAs[state as keyof typeof nigerianStatesAndLGAs]);
    } else {
        setLgasForState([]);
    }
  }, [state]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setBedrooms(initialData.bedrooms?.toString() || '1');
      setBathrooms(initialData.bathrooms?.toString() || '1');
      setAddress(initialData.address || '');
      setCity(initialData.city || '');
      setState(initialData.state || '');
      if (initialData.state) {
        setLgasForState(nigerianStatesAndLGAs[initialData.state as keyof typeof nigerianStatesAndLGAs] || []);
      }
      setLga(initialData.lga || '');
      setRentAmount(initialData.rent_amount?.toString() || '');
      setRentFrequency(initialData.rent_frequency || '');
      setAdditionalFees(initialData.additional_fees?.map((fee: any) => ({name: fee.name, amount: fee.amount.toString()})) || []);
      setRequiredDocs(initialData.required_documents || []);
      setSchedule(initialData.inspection_availability || { days: [], startTime: '09:00', endTime: '17:00' });
      const normalizedMedia = (initialData.media_urls || []).map((item: any) => typeof item === 'string' ? { url: item, type: 'image/jpeg' } : item);
      setExistingMedia(normalizedMedia);
    }
  }, [initialData]);

  const handleSave = () => {
    if (loading) return;
    if (!title || !rentAmount || !rentFrequency || (isStandalone && (!address || !city || !state || !lga))) {
      toast.error('Please fill out all required fields, including State and LGA.'); return;
    }
    const unitData: UnitData = { 
        title, description, bedrooms, bathrooms, rentAmount, rentFrequency, 
        additionalFees, newMediaFiles, existingMedia, 
        requiredDocuments: requiredDocs, inspectionAvailability: schedule, lga
    };
    if (isStandalone) { unitData.address = address; unitData.city = city; unitData.state = state; }
    setLoading(true);
    onSave(unitData);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { setNewMediaFiles(prev => [...prev, ...Array.from(e.target.files!)]); } };
  const removeNewFile = (index: number) => { setNewMediaFiles(prev => prev.filter((_, i) => i !== index)); };
  const handleDeleteExistingMedia = (index: number) => { setExistingMedia(prev => prev.filter((_, i) => i !== index)); };
  const addFee = () => setAdditionalFees([...additionalFees, { name: '', amount: '' }]);
  const updateFee = (index: number, field: keyof Fee, value: string) => { const newFees = [...additionalFees]; newFees[index][field] = value; setAdditionalFees(newFees); };
  const removeFee = (index: number) => setAdditionalFees(additionalFees.filter((_, i) => i !== index));
  const handleDayToggle = (day: string) => { setSchedule(prev => { const newDays = prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]; return { ...prev, days: newDays.sort((a, b) => weekDays.indexOf(a) - weekDays.indexOf(b)) }; }); };
  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => { setSchedule(prev => ({ ...prev, [field]: value })); };
  const handleDocToggle = (doc: string) => { setRequiredDocs(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]); };
  const addCustomDoc = () => { if (customDoc && !requiredDocs.includes(customDoc)) { setRequiredDocs([...requiredDocs, customDoc]); setCustomDoc(''); } };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative my-8">
        <h2 className="text-xl font-semibold mb-4 text-center">{isStandalone ? (initialData ? 'Edit Property Details' : 'Add Single Property Details') : 'Add Unit Details'}</h2>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
            <input type="text" placeholder={isStandalone ? "Property Title (e.g., 4-Bedroom Duplex)" : "Unit Title (e.g., Flat 3B)"} value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full px-3 py-2 border rounded-md" required />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="block w-full px-3 py-2 border rounded-md" rows={3}></textarea>
            {isStandalone && (<> 
                <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="block w-full px-3 py-2 border rounded-md" required={isStandalone} /> 
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={state} onChange={(e) => { setState(e.target.value); setLga(''); }} className="block w-full px-3 py-2 border rounded-md bg-white" required={isStandalone}>
                        <option value="" disabled>Select State</option>
                        {nigerianStates.map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={lga} onChange={(e) => setLga(e.target.value)} className="block w-full px-3 py-2 border rounded-md bg-white" required={isStandalone} disabled={!state}>
                        <option value="" disabled>Select LGA</option>
                        {lgasForState.map((l: string) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <input type="text" placeholder="City / Area" value={city} onChange={(e) => setCity(e.target.value)} className="block w-full px-3 py-2 border rounded-md" required={isStandalone} />
                </div>
            </> )}
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm">Bedrooms</label><input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="block w-full px-3 py-2 border rounded-md" required /></div><div><label className="text-sm">Bathrooms</label><input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="block w-full px-3 py-2 border rounded-md" required /></div></div>
            <div className="grid grid-cols-2 gap-4"><input type="number" placeholder="Rent Amount" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} className="block w-full px-3 py-2 border rounded-md" required /><select value={rentFrequency} onChange={(e) => setRentFrequency(e.target.value)} className="block w-full px-3 py-2 border rounded-md bg-white" required><option value="" disabled>Select Frequency</option><option value="per_year">per Year</option><option value="per_month">per Month</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700">Additional Fees</label>{additionalFees.map((fee, index) => (<div key={index} className="flex items-center gap-2 mt-2"><input type="text" placeholder="Fee Name" value={fee.name} onChange={(e) => updateFee(index, 'name', e.target.value)} className="block w-full px-3 py-2 border rounded-md" /><input type="number" placeholder="Amount" value={fee.amount} onChange={(e) => updateFee(index, 'amount', e.target.value)} className="block w-full px-3 py-2 border rounded-md" /><button type="button" onClick={() => removeFee(index)} className="text-red-500 p-2">&times;</button></div>))}<button type="button" onClick={addFee} className="mt-2 text-sm text-teal-600">+ Add Fee</button></div>
            <hr />
            <div><label className="block text-sm font-medium text-gray-700">Required Documents</label><div className="mt-2 grid grid-cols-2 gap-2">{commonDocs.map(doc => (<label key={doc} className="flex items-center space-x-2"><input type="checkbox" checked={requiredDocs.includes(doc)} onChange={() => handleDocToggle(doc)} className="rounded text-teal-600" /><span className="text-sm">{doc}</span></label>))}</div><div className="mt-2 flex items-center gap-2"><input type="text" placeholder="Add custom document" value={customDoc} onChange={(e) => setCustomDoc(e.target.value)} className="block w-full px-3 py-2 border rounded-md" /><button type="button" onClick={addCustomDoc} className="px-4 py-2 bg-gray-200 text-sm rounded-md">Add</button></div></div>
            <div><label className="block text-sm font-medium text-gray-700">Inspection Availability</label><div className="mt-2 flex items-center gap-4 flex-wrap"><div className="flex-grow"><div className="flex justify-between gap-1">{weekDays.map(day => (<button type="button" key={day} onClick={() => handleDayToggle(day)} className={`px-3 py-1 text-sm rounded-full border ${schedule.days.includes(day) ? 'bg-teal-600 text-white' : 'bg-white'}`}>{day}</button>))}</div></div><div className="flex items-center gap-2"><input type="time" value={schedule.startTime} onChange={e => handleTimeChange('startTime', e.target.value)} className="px-2 py-1 border rounded-md" /><span className="text-gray-500">-</span><input type="time" value={schedule.endTime} onChange={e => handleTimeChange('endTime', e.target.value)} className="px-2 py-1 border rounded-md" /></div></div></div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Property Media</label>
              {existingMedia.length > 0 && (<div className="mt-2 grid grid-cols-3 gap-4 border-b pb-4">{existingMedia.map((media, index) => (<div key={index} className="relative group"><img src={media.type.startsWith('video') ? 'https://placehold.co/400x400/16a34a/ffffff?text=Video' : media.url} alt="existing media" className="h-24 w-full object-cover rounded-md"/><button type="button" onClick={() => handleDeleteExistingMedia(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">&times;</button></div>))}</div>)}
              <div className="mt-4 border-2 border-dashed rounded-md p-6 text-center"><label htmlFor="file-upload" className="cursor-pointer text-teal-600"><span>Upload new photos or videos</span><input id="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*,video/mp4" /></label></div>
              {newMediaFiles.length > 0 && (<div className="mt-4 grid grid-cols-3 gap-4">{newMediaFiles.map((file, index) => (<div key={index} className="relative"><img src={URL.createObjectURL(file)} alt="preview" className="h-24 w-full object-cover rounded-md"/><button type="button" onClick={() => removeNewFile(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 text-xs">&times;</button></div>))}</div>)}
            </div>
        </div>
        <div className="flex justify-end pt-4 space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button type="button" onClick={handleSave} disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-md disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}