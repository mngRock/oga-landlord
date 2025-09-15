'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RentalCard from '@/components/RentalCard'; // We import the separate component

export default function MyRentalPage() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRentalDetails = useCallback(async () => {
    setLoading(true);
    // This function fetches a list of all rentals for the current user
    const { data, error } = await supabase.rpc('get_my_rental_details');
    if (error) {
      console.error("Error fetching rental details:", error);
    } else if (data) {
      setRentals(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRentalDetails();
  }, [fetchRentalDetails]);
      
  if (loading) {
    return <div className="p-6 text-center">Loading your rental details...</div>;
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">My Rentals & Agreements</h1>
      
      {rentals.length > 0 ? (
        <div className="space-y-8">
          {/* We map over the list of rentals and render a card for each one */}
          {rentals.map((rental, index) => (
            <RentalCard key={index} rentalDetails={rental} onUpdate={fetchRentalDetails} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl border">
          <p className="text-gray-500">You do not have any active or pending rental agreements.</p>
        </div>
      )}
    </div>
  );
}
