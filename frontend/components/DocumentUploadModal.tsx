'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { type Application } from '@/lib/types';

type ModalProps = {
  application: Application;
  onClose: () => void;
  onUploadComplete: () => void;
};

type FileState = { [key: string]: File | null; };

export default function DocumentUploadModal({ application, onClose, onUploadComplete }: ModalProps) {
  const [files, setFiles] = useState<FileState>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const requiredDocs = application.properties?.required_documents || [];

  const handleFileChange = (docName: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [docName]: file }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('Uploading documents...');
    try {
      const uploadedDocuments: { name: string, path: string }[] = [];
      for (const docName of requiredDocs) {
        const file = files[docName];
        if (file) {
          const filePath = `${application.id}/${docName.replace(/\s+/g, '_')}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage.from('application-documents').upload(filePath, file);
          if (uploadError) throw new Error(uploadError.message);
          uploadedDocuments.push({ name: docName, path: uploadData.path });
        }
      }

      if (uploadedDocuments.length === 0) {
        setMessage("Please select at least one file to upload.");
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.from('applications').update({
          submitted_documents: uploadedDocuments,
          status: 'documents_submitted'
        }).eq('id', application.id);
      if (updateError) throw updateError;

      setMessage('Documents uploaded successfully!');
      onUploadComplete();
      setTimeout(() => onClose(), 1500);
    } catch (error: any) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <h2 className="text-xl font-semibold mb-1">Upload Required Documents</h2>
        <p className="text-sm text-gray-500 mb-4">Accepted formats: PDF, PNG, JPG.</p>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          {requiredDocs.map(doc => (
            <div key={doc}>
              <label className="block text-sm font-medium text-gray-700">{doc}</label>
              <input 
                type="file" 
                onChange={(e) => handleFileChange(doc, e.target.files ? e.target.files[0] : null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                accept="image/png, image/jpeg, application/pdf"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50">
            {loading ? 'Uploading...' : 'Submit Documents'}
          </button>
        </div>
        {message && <p className="text-center mt-2 text-sm font-medium text-red-600">{message}</p>}
      </div>
    </div>
  );
}