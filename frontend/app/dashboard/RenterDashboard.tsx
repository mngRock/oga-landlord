import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';

// Helper function to get a relevant icon based on the activity message text
const getActivityIcon = (message: string) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('applied')) return 'fa-clipboard-list';
    if (lowerMessage.includes('maintenance')) return 'fa-tools';
    if (lowerMessage.includes('payment')) return 'fa-money-bill-wave';
    if (lowerMessage.includes('agreement') || lowerMessage.includes('lease') || lowerMessage.includes('tenancy')) return 'fa-file-contract';
    if (lowerMessage.includes('updated') || lowerMessage.includes('status')) return 'fa-info-circle';
    return 'fa-bell';
};

export default async function RenterDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();
  
  const { data: dashboardData } = await supabase.rpc('get_renter_dashboard_data');
  
  const activeTenancy = dashboardData?.active_tenancy;
  const recentApplications = dashboardData?.recent_applications || [];
  const recommendedProperties = dashboardData?.recommended_properties || [];
  const recentActivities = dashboardData?.recent_activities || [];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Renter Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! Find your perfect home or manage your current rental.</p>
      </div>

      {/* Current Rental Section */}
      {activeTenancy && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3 flex-shrink-0">
              <img 
                src={activeTenancy.property.media_urls?.[0]?.url || 'https://placehold.co/600x400'} 
                alt={activeTenancy.property.title} 
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            <div className="lg:w-2/3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Your Current Rental</h2>
                  <h3 className="text-lg font-medium text-gray-700 mt-1">{activeTenancy.property.title}</h3>
                  <div className="flex items-center text-gray-600 mt-2 text-sm">
                    <i className="fas fa-map-marker-alt text-teal-600 mr-2"></i>
                    <p>{activeTenancy.property.address}, {activeTenancy.property.city}</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800 flex-shrink-0">Active Lease</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-gray-500">Rent Amount</p><p className="text-lg font-semibold">₦{new Intl.NumberFormat().format(activeTenancy.tenancy.rent_amount)}</p></div>
                {/* THE FIX: Display the lease end date here as the next payment date */}
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-gray-500">Next Payment</p><p className="text-lg font-semibold">{new Date(activeTenancy.tenancy.end_date).toLocaleDateString()}</p></div>
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-gray-500">Lease Ends</p><p className="text-lg font-semibold">{new Date(activeTenancy.tenancy.end_date).toLocaleDateString()}</p></div>
              </div>
              <div className="flex mt-6 space-x-3">
                <Link href={`/dashboard/my-rental`} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700">View Details</Link>
                <Link href={`/dashboard/maintenance`} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">Maintenance Request</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Applications Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">My Recent Applications</h2>
            <Link href="/dashboard/my-applications" className="text-sm text-teal-600 hover:underline font-medium">View All</Link>
        </div>
        {recentApplications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
                {recentApplications.map((app: any) => (
                    <li key={app.id} className="py-3 flex justify-between items-center">
                        <div>
                            <p className="font-medium text-gray-800">{app.property_title}</p>
                            <p className="text-sm text-gray-500">Applied on: {new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="capitalize text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">{app.status.replace(/_/g, ' ')}</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-gray-500">You have no recent applications.</p>
        )}
      </div>
      
      {/* Recommended Properties Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recommended For You</h2>
            <Link href="/find-properties" className="text-sm text-teal-600 hover:underline font-medium">Find More Properties <i className="fas fa-arrow-right ml-1"></i></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedProperties.map((prop: any) => (
            <PropertyCard key={prop.id} property={prop} linkTo="view" />
          ))}
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

