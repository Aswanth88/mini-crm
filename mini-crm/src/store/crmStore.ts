import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  updateLeadStatus as supabaseUpdateLeadStatus,
  deleteLead as supabaseDeleteLead,
  getLeads,
  getMeetings,
  createMeeting as supabaseAddMeeting,
  updateMeeting as supabaseUpdateMeeting,
  deleteMeeting as supabaseDeleteMeeting,
  getCompanies,
  createCompany as supabaseAddCompany,
  updateCompany as supabaseUpdateCompany,
  deleteCompany as supabaseDeleteCompany
} from '@/lib/api';

// ---------- Interfaces ----------
export interface Meeting {
  id: string;
  lead_id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  attendees?: string;
  notes?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source: string;
  created_at?: string;
  last_contact?: string;
  company?: string;
  title?: string;
  address?: string;
  industry?: string;
  website?: string;
  additional_info?: string;
  confidence?: number;
  meetings?: Meeting[];
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  revenue?: number;
  employee_count?: number;
  address?: string;
  phone?: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface CRMState {
  leads: Lead[];
  selectedLead: Lead | null;
  filter: string;
  searchTerm: string;
  meetings: Meeting[];
  companies: Company[];
  selectedCompany: Company | null;
  analytics: {
    totalLeads: number;
    conversionRate: number;
    activeChats: number;
    aiAccuracy: number;
  };

  // Lead actions
  fetchLeads: () => Promise<void>;
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  setSelectedLead: (lead: Lead | null) => void;
  setFilter: (filter: string) => void;
  setSearchTerm: (term: string) => void;
  updateAnalytics: () => void;

  // Meeting actions
  fetchMeetings: () => Promise<void>;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'created_at'>) => Promise<void>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;

  // Company actions
  fetchCompanies: () => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  setSelectedCompany: (company: Company | null) => void;
}

// ---------- Store ----------
export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      leads: [],
      meetings: [],
      companies: [],
      selectedLead: null,
      selectedCompany: null,
      filter: 'all',
      searchTerm: '',
      analytics: {
        totalLeads: 0,
        conversionRate: 0,
        activeChats: 0,
        aiAccuracy: 0,
      },

      // ---------- Lead Methods ----------
      setLeads: (leads) => set(() => ({ leads })),

      fetchLeads: async () => {
        try {
          const leads = await getLeads();
          set({ leads });
          get().updateAnalytics();
        } catch (error) {
          console.error('Failed to fetch leads from Supabase:', error);
        }
      },

      addLead: (lead) => {
        const newLead = {
          ...lead,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          notes: [],
        };
        set((state) => ({
          leads: [...state.leads, newLead],
        }));
        get().updateAnalytics();
      },

      updateLead: async (id, updates) => {
        try {
          if (updates.status) {
            await supabaseUpdateLeadStatus(id, updates.status);
          }

          set((state) => ({
            leads: state.leads.map((lead) =>
              lead.id === id ? { ...lead, ...updates } : lead
            ),
            selectedLead:
              state.selectedLead?.id === id
                ? { ...state.selectedLead, ...updates }
                : state.selectedLead,
          }));

          get().updateAnalytics();
        } catch (error) {
          console.error('Failed to update lead:', error);
          throw error;
        }
      },

      deleteLead: async (id) => {
        try {
          await supabaseDeleteLead(id);
          set((state) => ({
            leads: state.leads.filter((lead) => lead.id !== id),
            selectedLead:
              state.selectedLead?.id === id ? null : state.selectedLead,
          }));
          get().updateAnalytics();
        } catch (error) {
          console.error('Failed to delete lead:', error);
          throw error;
        }
      },

      setSelectedLead: (lead) => set({ selectedLead: lead }),
      setFilter: (filter) => set({ filter }),
      setSearchTerm: (term) => set({ searchTerm: term }),

      updateAnalytics: () => {
        const { leads } = get();
        const totalLeads = leads.length;
        const convertedLeads = leads.filter(
          (lead) => lead.status === 'converted'
        ).length;
        const conversionRate =
          totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const activeChats = leads.filter((lead) => {
          if (!lead.last_contact) return false;
          const lastContact = new Date(lead.last_contact);
          return (
            lastContact > last24Hours &&
            (lead.status === 'contacted' || lead.status === 'qualified')
          );
        }).length;

        const qualifiedLeads = leads.filter(
          (lead) =>
            lead.status === 'qualified' ||
            lead.status === 'converted' ||
            lead.status === 'closed'
        ).length;
        const aiAccuracy =
          totalLeads > 0
            ? Math.min(95, (qualifiedLeads / totalLeads) * 100)
            : 0;

        set({
          analytics: {
            totalLeads,
            conversionRate: Math.round(conversionRate),
            activeChats,
            aiAccuracy: Math.round(aiAccuracy),
          },
        });
      },

      // ---------- Meeting Methods ----------
      fetchMeetings: async () => {
        try {
          const meetings = await getMeetings();
          set({ meetings });
        } catch (error) {
          console.error('Failed to fetch meetings:', error);
        }
      },

      addMeeting: async (meeting) => {
        try {
          const newMeeting = await supabaseAddMeeting(meeting);
          set((state) => ({
            meetings: [...state.meetings, newMeeting],
          }));
        } catch (error) {
          console.error('Failed to add meeting:', error);
        }
      },

      updateMeeting: async (id, updates) => {
        try {
          const updated = await supabaseUpdateMeeting(id, updates);
          set((state) => ({
            meetings: state.meetings.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
          }));
        } catch (error) {
          console.error('Failed to update meeting:', error);
        }
      },

      deleteMeeting: async (id) => {
        try {
          await supabaseDeleteMeeting(id);
          set((state) => ({
            meetings: state.meetings.filter((m) => m.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete meeting:', error);
        }
      },

      // ---------- Company Methods ----------
      fetchCompanies: async () => {
        try {
          const companies = await getCompanies();
          set({ companies });
        } catch (error) {
          console.error('Failed to fetch companies:', error);
        }
      },

      addCompany: async (company) => {
        try {
          const newCompany = await supabaseAddCompany(company);
          set((state) => ({
            companies: [...state.companies, newCompany],
          }));
        } catch (error) {
          console.error('Failed to add company:', error);
          throw error;
        }
      },

      updateCompany: async (id, updates) => {
        try {
          const updated = await supabaseUpdateCompany(id, updates);
          set((state) => ({
            companies: state.companies.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
            selectedCompany:
              state.selectedCompany?.id === id
                ? { ...state.selectedCompany, ...updates }
                : state.selectedCompany,
          }));
        } catch (error) {
          console.error('Failed to update company:', error);
          throw error;
        }
      },

      deleteCompany: async (id) => {
        try {
          await supabaseDeleteCompany(id);
          set((state) => ({
            companies: state.companies.filter((c) => c.id !== id),
            selectedCompany:
              state.selectedCompany?.id === id ? null : state.selectedCompany,
          }));
        } catch (error) {
          console.error('Failed to delete company:', error);
          throw error;
        }
      },

      setSelectedCompany: (company) => set({ selectedCompany: company }),
    }),
    {
      name: 'crm-storage',
    }
  )
);