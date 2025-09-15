'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ViewRequestModal({ request, onClose }: { request: any, onClose: () => void }) {
  const [secureMediaUrls, setSecureMediaUrls] = useState<{url: string, type: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateUrls = async () => {
      if (request.media_urls && request.media_urls.length > 0) {
        // Filter out any items that don't have a path
        const validMedia = request.media_urls.filter((item: any) => item && item.path);
        
        const paths = validMedia.map((item: any) => item.path);
        const types = validMedia.map((item: any) => item.type);

        const { data, error } = await supabase.storage
          .from('maintenance-media')
          .createSignedUrls(paths, 3600); // URLs are valid for 1 hour

        if (data) {
          const urls = data.map((item, index) => ({
            url: item.signedUrl,
            type: types[index]
          }));
          setSecureMediaUrls(urls);
        }
      }
      setLoading(false);
    };
    generateUrls();
  }, [request.media_urls]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        <h2 className="text-xl font-semibold mb-4">{request.title}</h2>
        <p className="text-sm text-gray-500 mb-4">Submitted by: {request.tenant_name || 'N/A'}</p>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{request.description || 'No description provided.'}</p>
        </div>

        {loading ? (
          <p>Loading media...</p>
        ) : secureMediaUrls.length > 0 ? (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Submitted Media</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {secureMediaUrls.map((media, index) => (
                <a key={index} href={media.url} target="_blank" rel="noopener noreferrer" className="block group relative">
                  <img 
                    src={media.type.startsWith('video') ? 'https://placehold.co/400x400/4f46e5/ffffff?text=Video' : media.url} 
                    alt={`media ${index + 1}`} 
                    className="w-full h-32 object-cover rounded-md border" 
                  />
                   <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className={`fas ${media.type.startsWith('video') ? 'fa-play' : 'fa-eye'} text-white text-3xl`}></i>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : <p className="text-sm text-gray-500">No media was submitted with this request.</p>}
      </div>
    </div>
  );
}