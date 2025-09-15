'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import ViewRequestModal from '@/components/ViewRequestModal';

// --- TYPE DEFINITIONS ---
type Profile = { role: 'landlord' | 'renter' | 'admin'; };
type Tenancy = { property_id: string; landlord_id: string; properties: { title: string }; };
type MaintenanceRequest = {
  id: string; title: string; description: string; status: string; created_at: string;
  media_urls: {path: string, type: string}[] | null;
  tenant_name: string;
  property_title: string;
};

// --- ROUTER COMPONENT (Default Export) ---
export default function MaintenancePageRouter() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (userProfile) setProfile(userProfile as Profile);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) { return <div className="p-6">Loading...</div>; }
  if (profile?.role === 'landlord') { return <LandlordMaintenancePage />; }
  return <RenterMaintenancePage />;
}

// --- LANDLORD COMPONENT ---
function LandlordMaintenancePage() {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_landlord_maintenance_requests_with_media');
        if (error) { console.error("Error fetching requests:", error); }
        else if (data) { setRequests(data as any[]); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleStatusUpdate = async (requestId: string, newStatus: string) => {
        const { error } = await supabase.from('maintenance_requests').update({ status: newStatus }).eq('id', requestId);
        if (error) { toast.error(`Error: ${error.message}`); } 
        else { toast.success("Status updated!"); fetchRequests(); }
    };

    return (
        <div className="p-6">
            {selectedRequest && (
                <ViewRequestModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
            )}
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">Maintenance Requests</h1>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr><th className="px-6 py-3 text-left">Issue</th><th className="px-6 py-3 text-left">Tenant</th><th className="px-6 py-3 text-left">Property</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Actions</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-10">Loading...</td></tr>
                        ) : requests.length > 0 ? (
                            requests.map((req: any) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 font-medium">{req.title}</td>
                                    <td className="px-6 py-4 text-sm">{req.tenant_name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm">{req.property_title || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm"><span className={`capitalize px-2 py-1 text-xs rounded-full ${req.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{req.status}</span></td>
                                    <td className="px-6 py-4 text-sm flex items-center gap-4">
                                        <select onChange={(e) => handleStatusUpdate(req.id, e.target.value)} value={req.status} className="text-xs border-gray-300 rounded-md bg-white">
                                            <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="cancelled">Cancelled</option>
                                        </select>
                                        <button onClick={() => setSelectedRequest(req)} className="text-teal-600 hover:underline text-xs font-medium">View Details</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center py-10">No maintenance requests received yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- RENTER COMPONENT ---
function RenterMaintenancePage() {
  const [activeTenancies, setActiveTenancies] = useState<Tenancy[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenancy, setSelectedTenancy] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: tenancyData } = await supabase.from('tenancies').select(`property_id, landlord_id, properties ( title )`).eq('tenant_id', user.id).eq('is_active', true);
    if (tenancyData) {
      setActiveTenancies(tenancyData as any);
      if (tenancyData.length > 0) setSelectedTenancy(tenancyData[0].property_id);
    }
    const { data: requestsData } = await supabase.from('maintenance_requests').select(`id, title, status, created_at`).eq('tenant_id', user.id);
    if (requestsData) { setRequests(requestsData); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { setMediaFiles(prev => [...prev, ...Array.from(e.target.files!)]); } };
  const removeFile = (index: number) => { setMediaFiles(prev => prev.filter((_, i) => i !== index)); };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenancy) { toast.error("Please select the property for this request."); return; }
    const toastId = toast.loading('Submitting request...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("You must be logged in.", { id: toastId }); return; }

    try {
      const tenancy = activeTenancies.find(t => t.property_id === selectedTenancy);
      if (!tenancy) throw new Error("Selected tenancy not found.");

      const { data: requestData, error: insertError } = await supabase.from('maintenance_requests').insert({ title, description, property_id: tenancy.property_id, tenant_id: user.id, landlord_id: tenancy.landlord_id }).select('id').single();
      if (insertError) throw insertError;

      const requestId = requestData.id;
      if (mediaFiles.length > 0) {
        toast.loading('Uploading media...', { id: toastId });
        const uploadPromises = mediaFiles.map(file => {
          const filePath = `${requestId}/${file.name}`;
          return supabase.storage.from('maintenance-media').upload(filePath, file);
        });
        const uploadResults = await Promise.all(uploadPromises);
        
        // THE FIX: Save the secure path and type, not a public URL
        const mediaPayload = uploadResults.map((result, index) => {
          if (result.error) throw result.error;
          return { path: result.data.path, type: mediaFiles[index].type };
        });
        
        // This UPDATE will now succeed because of our new RLS policy
        await supabase.from('maintenance_requests').update({ media_urls: mediaPayload }).eq('id', requestId);
      }
      
      toast.success('Request submitted!', { id: toastId });
      setTitle(''); setDescription(''); setMediaFiles([]); fetchData();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Maintenance Requests</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Submit a New Request</h2>
            {activeTenancies.length > 0 ? (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Which Property?</label>
                    <select value={selectedTenancy} onChange={(e) => setSelectedTenancy(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md bg-white">
                        {activeTenancies.map(t => <option key={t.property_id} value={t.property_id}>{t.properties.title}</option>)}
                    </select>
                </div>
                <div><label className="block text-sm font-medium">Issue Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Leaky Kitchen Sink" className="w-full mt-1 px-3 py-2 border rounded-md" required /></div>
                <div><label className="block text-sm font-medium">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please provide details..." className="w-full mt-1 px-3 py-2 border rounded-md" rows={4} required></textarea></div>
                <div><label className="block text-sm font-medium">Add Photos/Videos</label><div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md"><div className="space-y-1 text-center"><i className="fas fa-camera text-4xl text-gray-300"></i><div className="flex text-sm"><label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-teal-600"><span>Upload files</span><input id="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*,video/*" /></label></div><p className="text-xs text-gray-500">PNG, JPG, MP4</p></div></div>{mediaFiles.length > 0 && (<div className="mt-4 grid grid-cols-3 gap-4">{mediaFiles.map((file, index) => (<div key={index} className="relative"><img src={URL.createObjectURL(file)} alt="preview" className="h-24 w-full object-cover rounded-md"/><button type="button" onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-5 w-5 text-xs">&times;</button></div>))}</div>)}</div>
                <div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md">Submit Request</button></div>
              </form>
            ) : ( <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">You must have an active tenancy to submit a request.</p> )}
          </div>
        </div>
        <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr><th className="px-6 py-3 text-left">Issue</th><th className="px-6 py-3 text-left">Date Submitted</th><th className="px-6 py-3 text-left">Status</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={3} className="text-center py-10">Loading...</td></tr>
                        ) : requests.length > 0 ? (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 font-medium">{req.title}</td>
                                    <td className="px-6 py-4 text-sm">{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm"><span className={`capitalize px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800`}>{req.status}</span></td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={3} className="text-center py-10">You have not submitted any maintenance requests.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}