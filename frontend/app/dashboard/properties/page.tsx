'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PropertyCard from '@/components/PropertyCard';
import AddPropertyFlow from '@/components/AddPropertyFlow';
import { User } from '@supabase/supabase-js';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      setUser(currentUser);
      const { data, error } = await supabase.rpc('get_my_properties');
      if (error) {
        console.error("Error fetching properties:", error);
      } else if (data) {
        setProperties(data);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);
  
  const handleFlowComplete = () => {
    setIsModalOpen(false);
    fetchProperties();
  };

  return (
    <div className="p-6">
      {isModalOpen && user && (
        <AddPropertyFlow 
          onClose={() => setIsModalOpen(false)} 
          userId={user.id}
          onComplete={handleFlowComplete}
        />
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Properties</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-teal-600 text-white flex items-center px-4 py-2 rounded-lg hover:bg-teal-700">
          <i className="fas fa-plus mr-2"></i> Add New Property
        </button>
      </div>
      {loading ? (
        <div className="text-center py-10">Loading your properties...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.length > 0 ? (
            properties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} linkTo="manage" />
            ))
          ) : (
            <div className="md:col-span-3 text-center py-10 bg-white rounded-xl border">
                <p className="text-gray-500">You haven't added any properties yet.</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add New Property" to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}