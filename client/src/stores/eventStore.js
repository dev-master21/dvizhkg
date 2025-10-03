import { create } from 'zustand';

export const useEventStore = create((set) => ({
  events: [],
  filters: {
    status: 'all',
    search: '',
  },
  
  setEvents: (events) => set({ events }),
  
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  
  resetFilters: () => set({
    filters: {
      status: 'all',
      search: '',
    }
  }),
}));