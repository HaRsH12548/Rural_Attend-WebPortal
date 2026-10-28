import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAcademicYearStore = create(
  persist(
    (set, get) => ({
      selectedYearId: null,
      activeYearId: null,

      setSelectedYearId: (selectedYearId) => set({ selectedYearId }),
      setActiveYearId: (activeYearId) =>
        set((state) => ({
          activeYearId,
          selectedYearId: state.selectedYearId || activeYearId,
        })),

      isArchiveView: () => {
        const { selectedYearId, activeYearId } = get();
        return Boolean(selectedYearId && activeYearId && selectedYearId !== activeYearId);
      },
    }),
    {
      name: 'ruralattend-academic-year',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedYearId: state.selectedYearId,
        activeYearId: state.activeYearId,
      }),
    },
  ),
);
