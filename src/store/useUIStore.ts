import { create } from "zustand";
import { CategoryType } from "@/types/database";

interface UIState {
  isAddModalOpen: boolean;
  selectedAddCategory: CategoryType;
  selectedDate: string;
  activeFilter: CategoryType | "all";
  
  openAddModal: (category?: CategoryType) => void;
  closeAddModal: () => void;
  setSelectedDate: (date: string) => void;
  setActiveFilter: (filter: CategoryType | "all") => void;
}

const getTodayStr = () => new Date().toISOString().split("T")[0];

export const useUIStore = create<UIState>((set) => ({
  isAddModalOpen: false,
  selectedAddCategory: "habits",
  selectedDate: getTodayStr(),
  activeFilter: "all",

  openAddModal: (category = "habits") => set({ isAddModalOpen: true, selectedAddCategory: category }),
  closeAddModal: () => set({ isAddModalOpen: false }),
  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}));
