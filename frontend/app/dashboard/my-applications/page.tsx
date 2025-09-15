'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import DocumentUploadModal from '@/components/DocumentUploadModal';
import { type Application } from '@/lib/types';

// This type now correctly matches the output of our database function
type ApplicationFromRPC = Omit<Application, 'properties' | 'profiles' | 'submitted_documents'> & {
  property_title: string;
  property_id: string;
  property_required_docs: string[] | null;
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationFromRPC[]>([]);
  const [selectedApp, setSelectedApp] = useState<ApplicationFromRPC | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_my_applications');
    if (error) { console.error("Error fetching applications:", error); setApplications([]); } 
    else if (data) { setApplications(data); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleCancelApplication = async (appId: string) => {
    if (window.confirm('Are you sure you want to cancel this application?')) {
      const { error } = await supabase.from('applications').delete().eq('id', appId);
      if (error) { alert(`Error: ${error.message}`); } 
      else { alert('Application cancelled.'); fetchApplications(); }
    }
  };

  return (
    <div className="p-6">
      {selectedApp && (
        <DocumentUploadModal
          application={{
            id: selectedApp.id,
            status: selectedApp.status,
            created_at: selectedApp.created_at,
            inspection_datetime: selectedApp.inspection_datetime,
            submitted_documents: null,
            properties: { 
              id: selectedApp.property_id,
              title: selectedApp.property_title,
              required_documents: selectedApp.property_required_docs,
              // These are required by the type but not used in this modal
              rent_amount: 0,
              rent_frequency: '',
            },
            profiles: null,
          }}
          onClose={() => setSelectedApp(null)}
          onUploadComplete={() => { fetchApplications(); setSelectedApp(null); }}
        />
      )}

      <h1 className="text-2xl font-semibold text-gray-800 mb-6">My Applications</h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Property</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Date Applied</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Status / Action</th><th className="px-6 py-3"></th></tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10">Loading...</td></tr>
            ) : applications.length > 0 ? (
              applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-6 py-4 text-sm font-medium"><Link href={`/find-properties/${app.property_id}`} className="text-teal-600 hover:underline">{app.property_title || 'N/A'}</Link></td>
                  <td className="px-6 py-4 text-sm">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    {/* THE FIX: Correctly render the different states */}
                    {app.status === 'inspection_scheduled' && app.inspection_datetime ? (
                      <div className="text-xs">
                        <p className="font-semibold">Inspection Confirmed:</p>
                        <p>{new Date(app.inspection_datetime).toLocaleString()}</p>
                      </div>
                    ) : app.status === 'documents_requested' ? (
                       <button onClick={() => setSelectedApp(app)} className="text-sm bg-teal-600 text-white px-3 py-1 rounded-md">Upload Documents</button>
                    ) : (
                       <span className="capitalize">{app.status.replace(/_/g, ' ')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">{['received', 'inspection_scheduled'].includes(app.status) && (<button onClick={() => handleCancelApplication(app.id)} className="text-red-500 hover:text-red-700 text-xs">Cancel</button>)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-10">You have no active applications.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}