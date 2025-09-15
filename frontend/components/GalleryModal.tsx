'use client'

import { useEffect, useState } from 'react';

type MediaItem = {
  url: string;
  type: string;
};

type ModalProps = {
  media: MediaItem[];
  startIndex: number;
  onClose: () => void;
};

export default function GalleryModal({ media, startIndex, onClose }: ModalProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % media.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + media.length) % media.length);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentItem = media[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white text-3xl">&times;</button>
      <button onClick={(e) => { e.stopPropagation(); goToPrevious(); }} className="absolute left-4 text-white text-4xl">&lsaquo;</button>
      <button onClick={(e) => { e.stopPropagation(); goToNext(); }} className="absolute right-4 text-white text-4xl">&rsaquo;</button>
      
      <div className="p-8" onClick={(e) => e.stopPropagation()}>
        {currentItem.type.startsWith('video') ? (
          <video src={currentItem.url} controls autoPlay className="max-h-[80vh] max-w-[90vw]" />
        ) : (
          <img src={currentItem.url} alt="Gallery view" className="max-h-[80vh] max-w-[90vw]" />
        )}
      </div>
    </div>
  );
}