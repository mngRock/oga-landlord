import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/lib/types';

// Helper function to get an icon based on activity text
const getActivityIcon = (message: string) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('applied')) return 'fa-clipboard-list';
    if (lowerMessage.includes('maintenance')) return 'fa-tools';
    if (lowerMessage.includes('payment')) return 'fa-money-bill-wave';
    if (lowerMessage.includes('agreement') || lowerMessage.includes('lease') || lowerMessage.includes('tenancy')) return 'fa-file-contract';
    if (lowerMessage.includes('updated') || lowerMessage.includes('status')) return 'fa-info-circle';
    return 'fa-bell';
};

export default async function LandlordDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();
  
  // Call our new, powerful database function to get all dashboard data at once
  const { data: dashboardData, error } = await supabase.rpc('get_landlord_dashboard_data');
  
  const stats = dashboardData?.stats || { property_count: 0, tenant_count: 0, pending_applications: 0 };
  const recentProperties: Property[] = dashboardData?.recent_properties || [];
  const recentActivities: any[] = dashboardData?.recent_activities || [];

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
            <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! Here's what's happening with your properties.</p>
        </div>
        <div className="mt-4 md:mt-0">
            <Link href="/dashboard/properties" className="bg-teal-600 text-white flex items-center px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                <i className="fas fa-plus mr-2"></i> Add New Property
            </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center"><div className="p-3 rounded-full bg-teal-100 text-teal-600"><i className="fas fa-home fa-lg"></i></div><div className="ml-4"><h2 className="text-sm font-medium text-gray-500">Total Properties</h2><p className="text-2xl font-semibold">{stats.property_count}</p></div></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center"><div className="p-3 rounded-full bg-emerald-100 text-emerald-600"><i className="fas fa-user-check fa-lg"></i></div><div className="ml-4"><h2 className="text-sm font-medium text-gray-500">Active Tenants</h2><p className="text-2xl font-semibold">{stats.tenant_count}</p></div></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center"><div className="p-3 rounded-full bg-yellow-100 text-yellow-600"><i className="fas fa-file-alt fa-lg"></i></div><div className="ml-4"><h2 className="text-sm font-medium text-gray-500">Pending Applications</h2><p className="text-2xl font-semibold">{stats.pending_applications}</p></div></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center"><div className="p-3 rounded-full bg-purple-100 text-purple-600"><i className="fas fa-money-bill-wave fa-lg"></i></div><div className="ml-4"><h2 className="text-sm font-medium text-gray-500">Rent Due Soon</h2><p className="text-2xl font-semibold">0</p></div></div></div>
      </div>
      
      {/* Your Properties Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Your Recent Properties</h2>
            <Link href="/dashboard/properties" className="text-sm text-teal-600 hover:underline font-medium">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentProperties.length > 0 ? recentProperties.map((prop: any) => (
            <PropertyCard key={prop.id} property={prop} linkTo="manage" />
          )) : <p className="text-sm text-gray-500 md:col-span-3">You haven't added any properties yet.</p>}
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activities</h2>
        <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start">
                    <div className="p-2 bg-gray-100 rounded-full text-gray-600 w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <i className={`fas ${getActivityIcon(activity.message)}`}></i>
                    </div>
                    <div className="ml-4">
                        <p className="text-gray-800 text-sm">{activity.message}</p>
                        <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
                    </div>
                </div>
            )) : <p className="text-sm text-gray-500">No recent activities.</p>}
        </div>
      </div>
    </div>
  );
}
