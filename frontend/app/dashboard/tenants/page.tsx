'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

// This type matches the output of our get_my_tenants database function
type Tenant = {
  tenancy_id: string; // The unique ID for the tenancy record itself
  tenant_id: string;  // The ID of the tenant's profile
  full_name: string;
  phone_number: string | null;
  property_title: string;
  tenancy_end_date: string;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    // Call our custom database function to securely fetch the tenant list
    const { data, error } = await supabase.rpc('get_my_tenants');

    if (error) {
      console.error("Error fetching tenants:", error);
    } else if (data) {
      setTenants(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">My Tenants</h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lease End Date</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10">Loading tenants...</td></tr>
            ) : tenants.length > 0 ? (
              tenants.map((tenant) => (
                <tr key={tenant.tenancy_id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{tenant.full_name}</td>
                  <td className="px-6 py-4 text-gray-700">{tenant.property_title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{tenant.phone_number || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(tenant.tenancy_end_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    {/* THE FIX: Link to the unique tenancy_id */}
                    <Link href={`/dashboard/tenants/${tenant.tenancy_id}`} className="text-teal-600 hover:underline text-sm font-medium">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">You have no active tenants.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}