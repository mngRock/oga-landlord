import { createClient } from '@/lib/supabaseServer';
import LandlordDashboard from './LandlordDashboard';
import RenterDashboard from './RenterDashboard';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <RenterDashboard />; // Fallback for safety
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'landlord') {
    return <LandlordDashboard />;
  }
  
  // Default to the renter dashboard
  return <RenterDashboard />;
}