import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateLeadStatus as supabaseUpdateLeadStatus, deleteLead as supabaseDeleteLead  } from '@/lib/api';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'opportunity' | 'closed';
  source: string;
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
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
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
        aiAccuracy: 95,
      },

      setLeads: (leads) => set(() => ({ leads })),


      addLead: (lead) => {
        const newLead = {
          ...lead,
          id: Date.now().toString(),
          lastContact: new Date(),
          notes: [],
        };
        set((state) => ({
          leads: [...state.leads, newLead],
        }));
        get().updateAnalytics();
      },

      updateLead: async (id, updates) => {
  if (updates.status) {
    // Update Supabase
    await supabaseUpdateLeadStatus(id, updates.status);
  }

  set((state) => ({
    leads: state.leads.map((lead) =>
      lead.id === id ? { ...lead, ...updates } : lead
    ),
  }));

  get().updateAnalytics();
},


  deleteLead: async (id) => {
  // Delete from Supabase
  await supabaseDeleteLead(id);

  // Update local state
  set((state) => ({
    leads: state.leads.filter((lead) => lead.id !== id),
  }));

  get().updateAnalytics();
},

      setSelectedLead: (lead) => set({ selectedLead: lead }),
      setFilter: (filter) => set({ filter }),
      setSearchTerm: (term) => set({ searchTerm: term }),

      updateAnalytics: () => {
        const { leads } = get();
        const totalLeads = leads.length;
        const closedLeads = leads.filter((lead) => lead.status === 'closed').length;
        const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;
        
        set((state) => ({
          analytics: {
            ...state.analytics,
            totalLeads,
            conversionRate: Math.round(conversionRate),
            activeChats: Math.floor(Math.random() * 10) + 1, // Simulated
          },
        }));
      },
    }),
    {
      name: 'crm-storage',
    }
  )
);