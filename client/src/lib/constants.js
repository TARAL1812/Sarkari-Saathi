import { Landmark, Hospital, WalletCards, GraduationCap, CarFront, ShieldCheck, Files, Sprout, Utensils } from 'lucide-react';

export const CATEGORIES = [
  { id: 'Government', icon: Landmark, description: 'Documents, certificates and civic services.' },
  { id: 'Healthcare', icon: Hospital, description: 'Health records, admission and care services.' },
  { id: 'Banking', icon: WalletCards, description: 'Accounts, KYC and service requests.' },
  { id: 'Education', icon: GraduationCap, description: 'Admissions, enrolment and campus tasks.' },
  { id: 'Transport', icon: CarFront, description: 'Licences, vehicle documents and transport records.' },
  { id: 'Insurance', icon: ShieldCheck, description: 'Policy and claim workflows.' },
  { id: 'Agriculture', icon: Sprout, description: 'Farmer registration and agricultural services.' },
  { id: 'Food', icon: Utensils, description: 'Food safety registration and licensing.' },
  { id: 'Other', icon: Files, description: 'Other public and document services.' },
];
