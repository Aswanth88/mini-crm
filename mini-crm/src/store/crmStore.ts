import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateLeadStatus as supabaseUpdateLeadStatus, deleteLead as supabaseDeleteLead, getLeads } from '@/lib/api';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source: string;
  created_at?: string;
  last_contact?: string;
  
  // New fields
  company?: string;
  title?: string;
  address?: string;
  industry?: string;
  website?: string;
  additional_info?: string;
  confidence?: number;
}

interface CRMState {
  leads: Lead[];
  selectedLead: Lead | null;
  filter: string;
  searchTerm: string;
  analytics: {
    totalLeads: number;
    conversionRate: number;
    activeChats: number;
    aiAccuracy: number;
  };
  
  // Actions
  fetchLeads: () => Promise<void>;
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  setSelectedLead: (lead: Lead | null) => void;
  setFilter: (filter: string) => void;
  setSearchTerm: (term: string) => void;
  updateAnalytics: () => void;
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      leads: [],
      selectedLead: null,
      filter: 'all',
      searchTerm: '',
      analytics: {
        totalLeads: 0,
        conversionRate: 0,
        activeChats: 0,
        aiAccuracy: 0,
      },

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
          // Update Supabase first
          if (updates.status) {
            await supabaseUpdateLeadStatus(id, updates.status);
          }
          
          // Update local state
          set((state) => ({
            leads: state.leads.map((lead) =>
              lead.id === id ? { ...lead, ...updates } : lead
            ),
            // Also update selectedLead if it's the same lead
            selectedLead: state.selectedLead?.id === id 
              ? { ...state.selectedLead, ...updates }
              : state.selectedLead
          }));
          
          get().updateAnalytics();
          
          // Optionally refetch to ensure consistency
          // await get().fetchLeads();
          
        } catch (error) {
          console.error('Failed to update lead:', error);
          throw error; // Re-throw to handle in component
        }
      },

      deleteLead: async (id) => {
        try {
          // Delete from Supabase
          await supabaseDeleteLead(id);
          
          // Update local state
          set((state) => ({
            leads: state.leads.filter((lead) => lead.id !== id),
            selectedLead: state.selectedLead?.id === id ? null : state.selectedLead
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
        
        // Calculate real conversion rate
        const convertedLeads = leads.filter((lead) => lead.status === 'converted').length;
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
        
        // Calculate active chats based on recent activity
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const activeChats = leads.filter(lead => {
          if (!lead.last_contact) return false;
          const lastContact = new Date(lead.last_contact);
          return lastContact > last24Hours && 
                 (lead.status === 'contacted' || lead.status === 'qualified');
        }).length;
        
        // Calculate AI accuracy based on successful lead progression
        const qualifiedLeads = leads.filter(lead => 
          lead.status === 'qualified' || lead.status === 'converted' || lead.status === 'closed'
        ).length;
        const aiAccuracy = totalLeads > 0 ? Math.min(95, (qualifiedLeads / totalLeads) * 100) : 0;
        
        set((state) => ({
          analytics: {
            totalLeads,
            conversionRate: Math.round(conversionRate),
            activeChats,
            aiAccuracy: Math.round(aiAccuracy),
          },
        }));
      },
    }),
    {
      name: 'crm-storage',
    }
  )
);