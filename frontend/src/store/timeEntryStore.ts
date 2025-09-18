import { create } from 'zustand';
import { TimeEntry, CreateTimeEntry, UpdateTimeEntry } from '../types';
import { timeEntriesApi } from '../services/api';

interface TimeEntryState {
  timeEntries: TimeEntry[];
  activeTimeEntry: TimeEntry | null;
  isLoading: boolean;
  fetchTimeEntries: () => Promise<void>;
  fetchActiveTimeEntry: () => Promise<void>;
  startTimeEntry: (data: CreateTimeEntry) => Promise<void>;
  stopTimeEntry: (id: number) => Promise<void>;
  updateTimeEntry: (id: number, data: UpdateTimeEntry) => Promise<void>;
  deleteTimeEntry: (id: number) => Promise<void>;
}

export const useTimeEntryStore = create<TimeEntryState>((set, get) => ({
  timeEntries: [],
  activeTimeEntry: null,
  isLoading: false,

  fetchTimeEntries: async () => {
    set({ isLoading: true });
    try {
      const timeEntries = await timeEntriesApi.getAll();
      set({ timeEntries });
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActiveTimeEntry: async () => {
    try {
      const activeTimeEntry = await timeEntriesApi.getActive();
      set({ activeTimeEntry });
    } catch (error) {
      // No active time entry found
      set({ activeTimeEntry: null });
    }
  },

  startTimeEntry: async (data: CreateTimeEntry) => {
    set({ isLoading: true });
    try {
      const newTimeEntry = await timeEntriesApi.create(data);
      set({
        activeTimeEntry: newTimeEntry,
        timeEntries: [newTimeEntry, ...get().timeEntries],
      });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  stopTimeEntry: async (id: number) => {
    set({ isLoading: true });
    try {
      const stoppedTimeEntry = await timeEntriesApi.stop(id);
      set((state) => ({
        activeTimeEntry: null,
        timeEntries: state.timeEntries.map((entry) =>
          entry.id === id ? stoppedTimeEntry : entry
        ),
      }));
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTimeEntry: async (id: number, data: UpdateTimeEntry) => {
    set({ isLoading: true });
    try {
      const updatedTimeEntry = await timeEntriesApi.update(id, data);
      set((state) => ({
        timeEntries: state.timeEntries.map((entry) =>
          entry.id === id ? updatedTimeEntry : entry
        ),
        activeTimeEntry: state.activeTimeEntry?.id === id ? updatedTimeEntry : state.activeTimeEntry,
      }));
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTimeEntry: async (id: number) => {
    set({ isLoading: true });
    try {
      await timeEntriesApi.delete(id);
      set((state) => ({
        timeEntries: state.timeEntries.filter((entry) => entry.id !== id),
        activeTimeEntry: state.activeTimeEntry?.id === id ? null : state.activeTimeEntry,
      }));
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));