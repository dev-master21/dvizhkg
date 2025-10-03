import { create } from 'zustand';

export const useMediaStore = create((set) => ({
  media: [],
  filters: {
    eventId: null,
    type: 'all',
  },
  
  setMedia: (media) => set({ media }),
  
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  
  resetFilters: () => set({
    filters: {
      eventId: null,
      type: 'all',
    }
  }),
}));