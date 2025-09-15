export type Fee = {
  name: string;
  amount: string;
};

export type InspectionSchedule = {
  days: string[];
  startTime: string;
  endTime: string;
};

export type UnitData = {
  title: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  rentAmount: string;
  rentFrequency: string;
  additionalFees: Fee[];
  requiredDocuments: string[];
  inspectionAvailability: InspectionSchedule;
  newMediaFiles: File[];
  existingMedia: { url: string; type: string }[];
  lga: string; // This property has been added
  address?: string;
  city?: string;
  state?: string;
};

export type Application = {
  id: string;
  status: string;
  created_at: string;
  inspection_datetime: string | null;
  submitted_documents: { name: string; path: string }[] | null;
  properties: { 
    id: string;
    title: string;
    required_documents: string[] | null;
    rent_amount: number;
    rent_frequency: string;
  } | null;
  profiles: { 
    id: string;
    full_name: string 
  } | null;
};
