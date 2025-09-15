'use client'

import Link from 'next/link';
import { Property } from '@/lib/types';

export default function PropertyCard({ property, linkTo = 'view' }: { property: Property, linkTo?: 'manage' | 'view' }) {
  const href = linkTo === 'manage' 
    ? `/dashboard/properties/${property.id}` 
    : `/find-properties/${property.id}`;

  const getDisplayImage = () => {
    if (!property.media_urls || property.media_urls.length === 0) {
      return 'https://placehold.co/600x400?text=No+Image';
    }
    const firstItem = property.media_urls[0];
    if (typeof firstItem === 'string') {
      return firstItem;
    }
    if (firstItem.type?.startsWith('video')) {
      return 'https://placehold.co/600x400/16a34a/ffffff?text=Video';
    }
    return firstItem.url || 'https://placehold.co/600x400?text=No+Image';
  };

  return (
    <Link href={href} target={linkTo === 'view' ? '_blank' : '_self'} rel="noopener noreferrer" className="block group">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border h-full flex flex-col">
        <div className="relative h-48 w-full overflow-hidden">
            <img 
              src={getDisplayImage()} 
              alt={property.title} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105" 
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/eeeeee/_?text=Image+Error'; }}
            />
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">{property.title}</h3>
          <p className="text-gray-600 text-sm mb-4 flex-grow">{property.address}</p>
          <div className="flex justify-between items-center mt-auto">
            <p className="text-lg font-semibold text-gray-800">₦{new Intl.NumberFormat().format(property.rent_amount)}
              <span className="text-sm font-normal text-gray-500">/{property.rent_frequency?.replace('_', ' ')}</span>
            </p>
             <span className={`text-xs font-medium px-2 py-1 rounded-full ${property.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {property.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}