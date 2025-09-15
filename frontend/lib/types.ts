import { User } from "@supabase/supabase-js";

// Basic Data Shapes
export type Fee = { name: string; amount: string; };
export type InspectionSchedule = { days: string[]; startTime: string; endTime: string; };
export type MediaItem = { url: string; type: string; };

// Form Data for a Unit/Property
export type UnitData = {
  title: string; description: string; bedrooms: string; bathrooms: string; rentAmount: string; rentFrequency: string;
  additionalFees: Fee[]; requiredDocuments: string[]; inspectionAvailability: InspectionSchedule;
  newMediaFiles: File[]; existingMedia: MediaItem[]; lga: string; address?: string; city?: string; state?: string;
};

// Database Record Shapes
export type Profile = {
  id: string;
  full_name: string | null;
  role: 'landlord' | 'renter' | 'admin';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  has_renter_profile: boolean;
  has_landlord_profile: boolean;
};

export type Property = {
  id: string;
  landlord_id: string;
  title: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  lga: string | null;
  rent_amount: number;
  rent_frequency: string;
  bedrooms: number;
  bathrooms: number;
  media_urls: MediaItem[] | null;
  required_documents: string[] | null;
  inspection_availability: InspectionSchedule | null;
  additional_fees: { name: string; amount: number }[] | null;
  status: 'available' | 'occupied' | 'delisted';
  buildings: { name: string } | null;
  profiles: { full_name: string } | null;
};

export type Application = {
  id: string;
  status: string;
  created_at: string;
  inspection_datetime: string | null;
  submitted_documents: { name: string; path: string }[] | null;
  properties: Partial<Property> | null;
  profiles: Partial<Profile> | null;
};

export type Tenancy = {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  end_date: string;
};

export type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  media_urls: MediaItem[] | null;
  tenant_name: string;
  property_title: string;
  profiles: { full_name: string } | null;
  properties: { title: string } | null;
};
