export interface Product {
  id: string;
  name: string;
  description: string;
  features: string;
  targetBuyer: string;
  pricingPlans: string;
}

export interface CompanyProfile {
  name: string;
  domain?: string;
  industry: string;
  description: string;
  valueProposition: string;
  targetAudience: string;
  brandVoice: string;
}

export interface ProspectingArea {
  countries: string[];
  states: string[];
  cities: string;
}

export interface Campaign {
  id: string;
  name: string;
  segment: string;
  prospectingArea: ProspectingArea;
  language: string;
  targetProduct: string;
  limitDaily: number;
  status: 'idle' | 'running' | 'completed';
  progress: number;
  currentStep: string;
}

export interface Lead {
  id: string;
  companyName: string;
  website: string;
  score: number;
  scoreReason: string;
  contactName: string;
  contactRole: string;
  status: 'found' | 'enriched' | 'sent' | 'opened' | 'responded' | 'booked' | 'lost';
  personalizedMessage: string;
  email?: string;
  phone?: string;
  importedAt?: string;
}

export interface OutreachLog {
  id: string;
  lead_id: string;
  campaign_id: string;
  channel: 'email' | 'whatsapp' | 'telegram';
  recipient: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at: string;
  lead?: Lead;
  campaign?: Campaign;
}
