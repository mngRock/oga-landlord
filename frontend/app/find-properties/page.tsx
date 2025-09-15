'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PropertyCard from '@/components/PropertyCard';
import { nigerianStatesAndLGAs, nigerianStates } from '@/lib/locations';

export default function FindPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State for our filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minBeds, setMinBeds] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  const [lgasForState, setLgasForState] = useState<string[]>([]);

  // Effect to update LGAs when state changes
  useEffect(() => {
    if (selectedState && nigerianStatesAndLGAs[selectedState as keyof typeof nigerianStatesAndLGAs]) {
      setLgasForState(nigerianStatesAndLGAs[selectedState as keyof typeof nigerianStatesAndLGAs]);
      setSelectedLga(''); // Reset LGA selection when state changes
    } else {
      setLgasForState([]);
    }
  }, [selectedState]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase.rpc('search_properties', {
      location_query: searchQuery || null,
      min_price: minPrice ? parseInt(minPrice) : null,
      max_price: maxPrice ? parseInt(maxPrice) : null,
      min_beds: minBeds ? parseInt(minBeds) : null,
      state_query: selectedState || null,
      lga_query: selectedLga || null,
    });

    if (error) { 
      console.error('Error searching properties:', error); 
    } else if (data) { 
      setProperties(data); 
    }
    setLoading(false);
  }, [searchQuery, minPrice, maxPrice, minBeds, selectedState, selectedLga]);

  useEffect(() => {
    // Debounce the fetch call to prevent too many requests while typing
    const debounce = setTimeout(() => {
      fetchProperties();
    }, 500); // 500ms delay

    return () => clearTimeout(debounce);
  }, [fetchProperties]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-teal-700">Oga Landlord - Find a Home</h1>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Find Your Next Home</h1>
          <p className="text-gray-600">Discover apartments, duplexes, and houses for rent.</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border mb-8 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <input type="text" placeholder="Search by address or city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">State</label>
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md bg-white">
              <option value="">All States</option>
              {nigerianStates.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
           <div>
            <label className="text-sm font-medium text-gray-700">LGA</label>
            <select value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md bg-white" disabled={!selectedState}>
              <option value="">All LGAs</option>
              {lgasForState.map((l: string) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
             <label className="text-sm font-medium text-gray-700">Price Range (₦)</label>
             <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
                <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
             </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Min. Bedrooms</label>
            <select value={minBeds} onChange={(e) => setMinBeds(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md bg-white">
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">Searching for properties...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.length > 0 ? (
                properties.map((prop) => (<PropertyCard key={prop.id} property={prop} linkTo="view" />))
            ) : ( 
                <div className="md:col-span-3 text-center py-10">
                    <p className="text-gray-500">No properties match your search criteria.</p>
                </div> 
            )}
            </div>
        )}
      </main>
    </div>
  );
}