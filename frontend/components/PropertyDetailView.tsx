'use client'

import { useState, useEffect } from 'react';
import GalleryModal from './GalleryModal';

type MediaItem = {
  url: string;
  type: string;
};

export default function PropertyDetailView({ property }: { property: any }) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const openGallery = (index: number) => {
    setGalleryStartIndex(index);
    setIsGalleryOpen(true);
  };

  const getFullAddress = () => {
    const p = property.buildings || property;
    return `${p.address}, ${p.lga || ''}, ${p.city}, ${p.state}`.replace(/ ,/g, ',');
  };

  const mediaItems: MediaItem[] = (property.media_urls || []).map((item: any) => 
    typeof item === 'string' ? { url: item, type: 'image/jpeg' } : item
  );

  return (
    <>
      {isGalleryOpen && (
        <GalleryModal
          media={mediaItems}
          startIndex={galleryStartIndex}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {mediaItems.length > 0 ? mediaItems.slice(0, 4).map((item, index) => (
          <div
            key={index}
            onClick={() => openGallery(index)}
            className={`relative block group rounded-lg overflow-hidden cursor-pointer ${index === 0 ? 'col-span-2 row-span-2' : 'h-40'}`}
          >
            <img 
                src={item.type.startsWith('video') ? `https://placehold.co/600x400/16a34a/ffffff?text=Video` : item.url} 
                alt={`${property.title} media ${index + 1}`} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <i className={`fas ${item.type.startsWith('video') ? 'fa-play' : 'fa-search-plus'} text-white text-3xl`}></i>
            </div>
            {index === 3 && mediaItems.length > 4 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); openGallery(4); }}>
                    <p className="text-white text-xl font-bold">+{mediaItems.length - 4} more</p>
                </div>
            )}
          </div>
        )) : <div className="col-span-full h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">No Media Available</div>}
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-800">{property.title}</h1>
          {property.buildings && <p className="text-lg text-gray-500">{property.buildings.name}</p>}
          <p className="text-gray-600 mt-1">{getFullAddress()}</p>
        </div>
        <div className="text-left md:text-right flex-shrink-0">
          <p className="text-3xl font-bold text-teal-600">₦{new Intl.NumberFormat().format(property.rent_amount)}</p>
          <p className="text-gray-500">/{property.rent_frequency.replace('_', ' ')}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-700 mb-6 border-y py-4">
        <div className="flex items-center"><i className="fas fa-bed mr-2 text-teal-600"></i> {property.bedrooms} Bedrooms</div>
        <div className="flex items-center"><i className="fas fa-bath mr-2 text-teal-600"></i> {property.bathrooms} Bathrooms</div>
      </div>
      {property.additional_fees && property.additional_fees.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Additional Fees</h2>
          <div className="bg-white p-4 rounded-xl border"><ul className="divide-y divide-gray-200">{property.additional_fees.map((fee: any) => (<li key={fee.name} className="flex justify-between items-center py-2 text-sm"><span className="text-gray-600">{fee.name}</span><span className="font-semibold text-gray-800">₦{new Intl.NumberFormat().format(fee.amount)}</span></li>))}</ul></div>
        </div>
      )}
      <div className="mb-6"><h2 className="text-xl font-semibold text-gray-800 mb-2">Description</h2><p className="text-gray-600 whitespace-pre-wrap">{property.description}</p></div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border"><h3 className="font-semibold text-gray-800 mb-3">Required Documents</h3><ul className="space-y-2 list-disc list-inside text-gray-600">{property.required_documents?.map((doc: string) => <li key={doc}>{doc}</li>)}</ul></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border"><h3 className="font-semibold text-gray-800 mb-3">Inspection Availability</h3>{property.inspection_availability && (<div className="text-gray-600"><p className="font-medium">{property.inspection_availability.days.join(', ')}</p><p>{property.inspection_availability.startTime} - {property.inspection_availability.endTime}</p></div>)}</div>
      </div>
    </>
  );
}