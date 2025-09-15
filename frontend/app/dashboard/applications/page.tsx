'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ReviewApplicationModal from '@/components/ReviewApplicationModal';
import { type Application } from '@/lib/types';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    
    // This query is now more robust and fetches all necessary data
    const { data, error } = await supabase
      .from('properties')
      .select(`
        id, title, rent_amount, rent_frequency, required_documents,
        applications (
          *, 
          profiles ( id, full_name )
        )
      `)
      .eq('landlord_id', user.id);

    if (error) { 
      console.error("Error fetching applications:", error); 
      setApplications([]); 
    } else {
      const formattedApps = data
        ?.flatMap(property => 
          property.applications.map((app: any) => ({ 
            ...app, 
            properties: { 
              id: property.id,
              title: property.title,
              rent_amount: property.rent_amount,
              rent_frequency: property.rent_frequency,
              required_documents: property.required_documents
            } 
          }))
        ) || [];
      setApplications(formattedApps);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  return (
    <div className="p-6">
      {selectedApp && (
        <ReviewApplicationModal 
          application={selectedApp} 
          onClose={() => setSelectedApp(null)} 
          onUpdate={fetchApplications} 
        />
      )}
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Applications</h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Applicant</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date Applied</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10">Loading applications...</td></tr>
            ) : applications.length > 0 ? (
              applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{app.properties?.title || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{app.profiles?.full_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="capitalize px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{app.status.replace(/_/g, ' ')}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <button onClick={() => setSelectedApp(app)} className="text-teal-600 hover:text-teal-900">Review</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">No applications received yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}