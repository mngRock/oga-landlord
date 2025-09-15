'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
type Profile = {
  full_name: string;
  role: 'landlord' | 'renter' | 'admin';
  verification_status: VerificationStatus;
  has_renter_profile: boolean;
  has_landlord_profile: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [ownershipFile, setOwnershipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, role, verification_status, has_renter_profile, has_landlord_profile')
        .eq('id', session.user.id)
        .single();
      if (profileData) {
        setProfile(profileData as Profile);
        setFullName(profileData.full_name || '');
      }
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const toastId = toast.loading('Saving...');
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Profile updated successfully!', { id: toastId });
      router.refresh();
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters long.'); return; }
    const toastId = toast.loading('Updating password...');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Password updated! You will be logged out.', { id: toastId });
      setNewPassword('');
      setTimeout(() => supabase.auth.signOut(), 2000);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile || !ownershipFile || !user) { toast.error('Please select both files to upload.'); return; }
    setLoading(true);
    const toastId = toast.loading('Uploading documents...');
    try {
      const idPath = `${user.id}/proof_of_identity-${idFile.name}`;
      const { error: idError } = await supabase.storage.from('verification-documents').upload(idPath, idFile, { upsert: true });
      if (idError) throw idError;
      const ownershipPath = `${user.id}/proof_of_ownership-${ownershipFile.name}`;
      const { error: ownershipError } = await supabase.storage.from('verification-documents').upload(ownershipPath, ownershipFile, { upsert: true });
      if (ownershipError) throw ownershipError;
      const { error: profileError } = await supabase.from('profiles').update({ verification_status: 'pending', verification_documents: { identity: idPath, ownership: ownershipPath } }).eq('id', user.id);
      if (profileError) throw profileError;
      toast.success('Documents submitted for verification!', { id: toastId });
      fetchProfile();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (newRole: 'landlord' | 'renter') => {
    if (!user) return;
    toast.dismiss();
    const toastId = toast.loading(`Creating ${newRole} profile...`);
    const updatePayload: { role: string, has_renter_profile?: boolean, has_landlord_profile?: boolean } = { role: newRole };
    if (newRole === 'renter') updatePayload.has_renter_profile = true;
    if (newRole === 'landlord') updatePayload.has_landlord_profile = true;
    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);
    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Profile created successfully! Refreshing...', { id: toastId });
      setTimeout(() => window.location.assign('/dashboard'), 1000);
    }
  };

  const handleRoleSwitch = async (targetRole: 'landlord' | 'renter') => {
    if (!user || profile?.role === targetRole) return;
    if (targetRole === 'landlord' && !profile?.has_landlord_profile) {
      toast.error((t) => (
        <div className="flex flex-col items-center gap-2 text-center">
          <span>Landlord profile not found.</span>
          <button onClick={() => handleCreateProfile('landlord')} className="bg-teal-600 text-white w-full text-sm py-1 px-2 rounded-md">
            Create Landlord Profile
          </button>
        </div>
      ), { duration: 5000 });
      return;
    }
    if (targetRole === 'renter' && !profile?.has_renter_profile) {
      toast.error((t) => (
        <div className="flex flex-col items-center gap-2 text-center">
          <span>Renter profile not found.</span>
          <button onClick={() => handleCreateProfile('renter')} className="bg-teal-600 text-white w-full text-sm py-1 px-2 rounded-md">
            Create Renter Profile
          </button>
        </div>
      ), { duration: 5000 });
      return;
    }
    const toastId = toast.loading('Switching profile...');
    const { error } = await supabase.from('profiles').update({ role: targetRole }).eq('id', user.id);
    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Profile switched successfully! Refreshing...', { id: toastId });
      setTimeout(() => window.location.assign('/dashboard'), 1000);
    }
  };

  const VerificationStatusBadge = ({ status }: { status: VerificationStatus }) => {
    const styles = { unverified: 'bg-gray-100 text-gray-800', pending: 'bg-yellow-100 text-yellow-800', verified: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
  };
  
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      
      {profile?.role !== 'admin' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Your Profile</h2>
            <p className="text-sm text-gray-500 mb-2">You are currently using the <span className="font-semibold capitalize">{profile?.role}</span> profile.</p>
            <div className="flex rounded-md shadow-sm">
                <button
                    type="button"
                    onClick={() => handleRoleSwitch('renter')}
                    className={`relative inline-flex items-center space-x-2 rounded-l-md px-4 py-2 text-sm font-medium border ${profile?.role === 'renter' ? 'bg-teal-600 text-white border-teal-600 z-10' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                >
                    <i className="fas fa-user w-4"></i>
                    <span>Renter</span>
                </button>
                <button
                    type="button"
                    onClick={() => handleRoleSwitch('landlord')}
                    className={`relative -ml-px inline-flex items-center space-x-2 rounded-r-md px-4 py-2 text-sm font-medium border ${profile?.role === 'landlord' ? 'bg-teal-600 text-white border-teal-600 z-10' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                >
                    <i className="fas fa-home w-4"></i>
                    <span>Landlord</span>
                </button>
            </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-xl shadow-sm border max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Update Personal Information</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700">Email Address</label><input type="email" value={user?.email || ''} disabled className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Full Name</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">Save Changes</button></div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700">New Password</label><input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">Update Password</button></div>
        </form>
      </div>

      {profile?.role === 'landlord' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Landlord Verification</h2>
            {profile && <VerificationStatusBadge status={profile.verification_status} />}
          </div>
          {profile?.verification_status === 'unverified' || profile?.verification_status === 'rejected' ? (
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              {profile.verification_status === 'rejected' && <p className="text-sm text-red-600">Your previous submission was rejected. Please re-upload.</p>}
              <div><label className="block text-sm font-medium text-gray-700">Proof of Identity</label><p className="text-xs text-gray-500 mb-1">e.g., National ID</p><input type="file" onChange={(e) => setIdFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" required /></div>
              <div><label className="block text-sm font-medium text-gray-700">Proof of Property Ownership</label><p className="text-xs text-gray-500 mb-1">e.g., C of O</p><input type="file" onChange={(e) => setOwnershipFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" required /></div>
              <div className="flex justify-end"><button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-md disabled:opacity-50">{loading ? 'Submitting...' : 'Submit for Verification'}</button></div>
            </form>
          ) : profile?.verification_status === 'pending' ? (
            <p className="text-sm text-yellow-800 bg-yellow-50 p-3 rounded-md">Your documents are under review.</p>
          ) : (
            <p className="text-sm text-green-800 bg-green-50 p-3 rounded-md">You are a verified landlord. ✅</p>
          )}
        </div>
      )}
    </div>
  );
}
