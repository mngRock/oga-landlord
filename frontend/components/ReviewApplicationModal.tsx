'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { type Application } from '@/lib/types';
import toast from 'react-hot-toast';

type ModalProps = {
  application: Application;
  onClose: () => void;
  onUpdate: () => void;
};

export default function ReviewApplicationModal({ application, onClose, onUpdate }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [step, setStep] = useState('review'); // review, schedule, prepare_agreement
  const [inspectionDate, setInspectionDate] = useState('');
  const [documentUrls, setDocumentUrls] = useState<{ name: string; url: string }[]>([]);
  // THE FIX: Declare the missing state variable for the agreement file
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

  useEffect(() => {
    if (application.submitted_documents) {
      const generateUrls = async () => {
        const validDocs = application.submitted_documents!.filter(doc => doc && doc.path);
        const urls = await Promise.all(
          validDocs.map(async (doc) => {
            const { data } = await supabase.storage.from('application-documents').createSignedUrl(doc.path, 3600);
            return { name: doc.name, url: data?.signedUrl || '' };
          })
        );
        setDocumentUrls(urls.filter(item => item.url));
      };
      generateUrls();
    }
  }, [application.submitted_documents]);

  const handleUpdateStatus = async (newStatus: string, closeAfter = true) => {
    setLoading(true);
    const toastId = toast.loading('Updating status...');
    let updatePayload: any = { status: newStatus };

    if (newStatus === 'inspection_scheduled') {
      if (!inspectionDate) { toast.error('Please select a date.', { id: toastId }); setLoading(false); return; }
      updatePayload.inspection_datetime = inspectionDate;
    }

    const { error } = await supabase.from('applications').update(updatePayload).eq('id', application.id);
    
    if (error) { 
      toast.error(`Error: ${error.message}`, { id: toastId });
      setLoading(false);
    } else {
      if (closeAfter) {
        toast.success(`Application status updated.`, { id: toastId });
        onUpdate();
        setTimeout(() => onClose(), 1500);
      } else {
        // If not closing after, let the createTenancy function handle the final toast and loading state
        setLoading(false);
      }
    }
  };

  const handleCreateTenancy = async () => {
    if (!agreementFile) { toast.error("Please upload an agreement PDF."); return; }
    setLoading(true);
    const toastId = toast.loading('Finalizing tenancy...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !application.properties || !application.profiles) throw new Error("Missing critical data to create tenancy.");

      const filePath = `${user.id}/${application.id}-${agreementFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('tenancy-agreements').upload(filePath, agreementFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: tenancyError } = await supabase.from('tenancies').insert({
        property_id: application.properties.id,
        tenant_id: application.profiles.id,
        landlord_id: user.id,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        rent_amount: application.properties.rent_amount,
        rent_frequency: application.properties.rent_frequency,
        contract_url: uploadData.path,
        is_active: false,
      });
      if (tenancyError) throw tenancyError;

      await supabase.from('applications').update({ status: 'contract_pending' }).eq('id', application.id);
      
      await supabase.from('notifications').insert({
        user_id: application.profiles.id,
        message: `Your tenancy agreement for "${application.properties.title}" is ready for review.`,
        link_to: `/dashboard/my-rental`,
      });

      toast.success('Agreement sent to renter for review!', { id: toastId });
      onUpdate();
      setTimeout(() => onClose(), 2000);

    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
      setLoading(false);
    }
  };

  const renderActions = () => {
    switch (application.status) {
      case 'received': return (<div className="flex justify-end space-x-2"><button onClick={() => handleUpdateStatus('rejected')} className="px-4 py-2 bg-red-100 text-red-800 rounded-md">Reject</button><button onClick={() => setIsScheduling(true)} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md">Schedule Inspection</button></div>);
      case 'inspection_scheduled': return (<div className="flex justify-end space-x-2"><button onClick={() => handleUpdateStatus('rejected')} className="px-4 py-2 bg-red-100 text-red-800 rounded-md">Reject</button><button onClick={() => handleUpdateStatus('documents_requested')} className="px-4 py-2 bg-teal-600 text-white rounded-md">Request Documents</button></div>);
      case 'documents_submitted': return (<div className="flex justify-end space-x-2"><button onClick={() => handleUpdateStatus('rejected')} className="px-4 py-2 bg-red-100 text-red-800 rounded-md">Reject</button><button onClick={() => handleUpdateStatus('payment_pending')} className="px-4 py-2 bg-teal-600 text-white rounded-md">Approve & Request Payment</button></div>);
      case 'payment_pending': return (<div className="flex justify-end space-x-2"><button onClick={() => handleUpdateStatus('rejected')} className="px-4 py-2 bg-red-100 text-red-800 rounded-md">Reject</button><button onClick={() => setStep('prepare_agreement')} className="px-4 py-2 bg-green-600 text-white rounded-md">Confirm Payment & Prepare Agreement</button></div>);
      default: return <p className="text-sm text-gray-500 text-right">No actions available for this status.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} disabled={loading} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        
        {step === 'review' && (
            <div>
                <h2 className="text-xl font-semibold mb-4">Review Application</h2>
                <div className="space-y-2 text-sm border-y py-4 mb-4">
                    <p><strong>Applicant:</strong> {application.profiles?.full_name}</p><p><strong>Property:</strong> {application.properties?.title}</p><p><strong>Status:</strong> <span className="capitalize font-medium">{application.status.replace(/_/g, ' ')}</span></p>
                    {application.inspection_datetime && <p><strong>Inspection:</strong> {new Date(application.inspection_datetime).toLocaleString()}</p>}
                    {documentUrls.length > 0 && (<div><p className="font-semibold mt-2">Submitted Documents:</p><ul className="list-disc list-inside">{documentUrls.map(doc => (<li key={doc.name}><a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{doc.name}</a></li>))}</ul></div>)}
                </div>
                {renderActions()}
            </div>
        )}

        {isScheduling && (
           <div className="space-y-3">
             <h2 className="text-xl font-semibold mb-4">Schedule Inspection</h2>
             <label className="block text-sm font-medium">Select Inspection Date & Time</label>
             <input type="datetime-local" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} className="block w-full px-3 py-2 border rounded-md"/>
             <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsScheduling(false)} className="px-4 py-2 bg-gray-200 rounded-md">Back</button>
                <button onClick={() => handleUpdateStatus('inspection_scheduled')} disabled={loading || !inspectionDate} className="px-4 py-2 bg-teal-600 text-white rounded-md disabled:opacity-50">Confirm</button>
             </div>
           </div>
        )}

        {step === 'prepare_agreement' && (
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Prepare Tenancy Agreement</h3>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Upload the final agreement PDF. The renter will be notified to review and accept it.</p>
                    <div>
                        <label className="block text-sm font-medium">Agreement PDF</label>
                        <input type="file" onChange={(e) => setAgreementFile(e.target.files ? e.target.files[0] : null)} accept="application/pdf" className="w-full text-sm mt-1" required />
                    </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button type="button" onClick={() => setStep('review')} className="px-4 py-2 bg-gray-200 rounded-md">Back</button>
                    <button onClick={handleCreateTenancy} disabled={loading || !agreementFile} className="px-4 py-2 bg-teal-600 text-white rounded-md disabled:opacity-50">Finalize & Send</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}