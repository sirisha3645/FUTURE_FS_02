/**
 * Shared Type Definitions for the Client Lead Management System (Mini CRM)
 */

export interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export type LeadSource = 'Website' | 'Portfolio' | 'LinkedIn' | 'Referral' | 'Facebook' | 'Instagram' | 'Other';
export type LeadStatus = 'New' | 'Contacted' | 'Converted';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: LeadSource;
  status: LeadStatus;
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CRMAnalytics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadsBySource: { name: string; value: number }[];
  leadsByStatus: { name: string; value: number }[];
  historicalGrowth: { date: string; count: number }[];
}

export interface AuthState {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface UserFile {
  id: string;
  userId: string;
  name: string;
  size: string;
  type: string;
  content?: string;
  downloadUrl?: string;
  createdAt: string;
}

