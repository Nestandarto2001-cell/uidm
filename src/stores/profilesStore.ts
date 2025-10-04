import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Profile = {
  id: string;
  name: string;
  uid?: string;
  apiKey?: string;
  apiSecret?: string;
  createdAt: number;
};

export type ProfilesState = {
  items: Profile[];
  activeId?: string;
  createOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  create: (p: Omit<Profile, 'id' | 'createdAt'>) => void;
  setActive: (id: string) => void;
  update: (id: string, updates: Partial<Omit<Profile, 'id' | 'createdAt'>>) => void;
  delete: (id: string) => void;
};

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      items: [],
      activeId: undefined,
      createOpen: false,
      
      openCreateModal: () => set({ createOpen: true }),
      
      closeCreateModal: () => set({ createOpen: false }),
      
      create: (profileData) => {
        const newProfile: Profile = {
          ...profileData,
          id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
        };
        
        set((state) => ({
          items: [...state.items, newProfile],
          activeId: newProfile.id,
          createOpen: false,
        }));
        
        // Show toast notification
        console.log('Profile created:', newProfile.name);
      },
      
      setActive: (id) => set({ activeId: id }),
      
      update: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },
      
      delete: (id) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== id);
          const newActiveId = state.activeId === id 
            ? (newItems.length > 0 ? newItems[0].id : undefined)
            : state.activeId;
          
          return {
            items: newItems,
            activeId: newActiveId,
          };
        });
      },
    }),
    {
      name: 'profiles-storage',
      partialize: (state) => ({
        items: state.items,
        activeId: state.activeId,
      }),
    }
  )
);
