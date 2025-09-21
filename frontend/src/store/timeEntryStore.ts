import { create } from 'zustand';
import { TimeEntry, CreateTimeEntry, UpdateTimeEntry } from '../types';
import { timeEntriesApi } from '../services/api';

interface TimeEntryState {
  timeEntries: TimeEntry[];
  activeTimeEntry: TimeEntry | null;
  activeEntry: TimeEntry | null; // Alias for keyboard shortcuts compatibility
  pendingTimeEntry: TimeEntry | null; // Time entry waiting for description
  isLoading: boolean;
  fetchTimeEntries: () => Promise<void>;
  fetchActiveTimeEntry: () => Promise<void>;
  startTimeEntry: (data: CreateTimeEntry) => Promise<void>;
  startTimer: (projectId: number, description?: string) => Promise<void>; // For keyboard shortcuts
  stopTimeEntry: (id: number) => Promise<void>;
  stopTimer: (id: number) => Promise<void>; // Alias for compatibility
  updateTimeEntry: (id: number, data: UpdateTimeEntry) => Promise<void>;
  deleteTimeEntry: (id: number) => Promise<void>;
  completePendingTimeEntry: (description: string, taskId?: number) => Promise<void>;
  clearPendingTimeEntry: () => void;
}

export const useTimeEntryStore = create<TimeEntryState>((set, get) => ({
  timeEntries: [],
  activeTimeEntry: null,
  activeEntry: null,
  pendingTimeEntry: null,
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
      set({ activeTimeEntry, activeEntry: activeTimeEntry });
    } catch (error) {
      // No active time entry found
      set({ activeTimeEntry: null, activeEntry: null });
    }
  },

  startTimeEntry: async (data: CreateTimeEntry) => {
    set({ isLoading: true });
    try {
      const newTimeEntry = await timeEntriesApi.create(data);
      set({
        activeTimeEntry: newTimeEntry,
        activeEntry: newTimeEntry,
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
        activeEntry: null,
        pendingTimeEntry: stoppedTimeEntry, // Set as pending for description
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

  // Keyboard shortcuts compatibility methods
  startTimer: async (projectId: number, description?: string) => {
    const { startTimeEntry } = get();
    await startTimeEntry({
      project_id: projectId,
      description: description || '',
      start_time: new Date().toISOString()
    });
  },

  stopTimer: async (id: number) => {
    const { stopTimeEntry } = get();
    await stopTimeEntry(id);
  },

  completePendingTimeEntry: async (description: string, taskId?: number) => {
    const { pendingTimeEntry } = get();
    if (!pendingTimeEntry) return;

    set({ isLoading: true });
    try {
      const updatedEntry = await timeEntriesApi.update(pendingTimeEntry.id, {
        description,
        task_id: taskId
      });

      set((state) => ({
        pendingTimeEntry: null,
        timeEntries: state.timeEntries.map(entry =>
          entry.id === pendingTimeEntry.id ? updatedEntry : entry
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearPendingTimeEntry: () => {
    set({ pendingTimeEntry: null });
  },
}));