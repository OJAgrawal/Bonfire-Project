import { create } from 'zustand';
import { Event, EventCategory, MapBounds } from '@/types';
import { db } from '@/utils/supabase';

interface EventState {
  events: Event[];
  selectedEvent: Event | null;
  loading: boolean;
  searchQuery: string;
  selectedCategory: EventCategory | null;
  mapBounds: MapBounds | null;
  viewMode: 'map' | 'list';
  hasJoinedMap: Record<string, boolean>;

  fetchEvents: (bounds?: MapBounds) => Promise<void>;
  fetchEventById: (id: string) => Promise<Event | null>;
  createEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<Event>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  joinEvent: (eventId: string, userId: string) => Promise<boolean>;
  leaveEvent: (eventId: string, userId: string) => Promise<boolean>;
  hasJoinedEvent: (eventId: string, userId: string) => Promise<boolean>;

  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: EventCategory | null) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  setViewMode: (mode: 'map' | 'list') => void;
  setSelectedEvent: (event: Event | null) => void;

  filteredEvents: () => Event[];
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  selectedEvent: null,
  loading: false,
  searchQuery: '',
  selectedCategory: null,
  mapBounds: null,
  viewMode: 'map',
  hasJoinedMap: {},

  fetchEvents: async (bounds?: MapBounds) => {
    set({ loading: true });
    try {
      let query = db
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(*)
        `)
        .eq('status', 'active');

      if (bounds) {
        query = query
          .gte('latitude', bounds.south)
          .lte('latitude', bounds.north)
          .gte('longitude', bounds.west)
          .lte('longitude', bounds.east);
      }

      const { data, error } = await query;
      if (error) throw error;

      set({ events: data || [] });
    } catch (error: any) {
      console.error('Error fetching events:', error?.message || error);
      set({ events: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchEventById: async (id: string) => {
    try {
      const { data, error } = await db
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      set({ selectedEvent: data });
      return data;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  },

  createEvent: async (eventData) => {
    const { data, error } = await db
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    set(state => ({ events: [...state.events, data] }));
    return data;
  },

  updateEvent: async (id, updates) => {
    const { error } = await db
      .from('events')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    set(state => ({
      events: state.events.map(event =>
        event.id === id ? { ...event, ...updates } : event
      )
    }));
  },

  deleteEvent: async (id) => {
    const { error } = await db
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }

    set(state => ({
      events: state.events.filter(event => event.id !== id)
    }));
  },

  joinEvent: async (eventId, userId) => {
    const alreadyJoined = get().hasJoinedMap[eventId];
    if (alreadyJoined) return false;

    const { error } = await db
      .from('event_attendees')
      .insert({ event_id: eventId, user_id: userId });

    if (error) {
      console.error('Join event error:', error.message, error.details, error.hint);
      return false;
    }

    set(state => ({
      events: state.events.map(event =>
        event.id === eventId
          ? { ...event, attendees_count: event.attendees_count + 1 }
          : event
      ),
      hasJoinedMap: { ...state.hasJoinedMap, [eventId]: true }
    }));

    return true;
  },

  leaveEvent: async (eventId, userId) => {
    const { error } = await db
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error('Leave event error:', error);
      return false;
    }

    set(state => ({
      events: state.events.map(event =>
        event.id === eventId
          ? { ...event, attendees_count: Math.max(0, event.attendees_count - 1) }
          : event
      ),
      hasJoinedMap: { ...state.hasJoinedMap, [eventId]: false }
    }));

    return true;
  },

  hasJoinedEvent: async (eventId, userId) => {
    const { data, error } = await db
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Check join error:', error);
      return false;
    }

    set(state => ({
      hasJoinedMap: { ...state.hasJoinedMap, [eventId]: !!data }
    }));

    return !!data;
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),

  filteredEvents: () => {
    const { events, searchQuery, selectedCategory } = get();

    return events.filter(event => {
      const matchesSearch = searchQuery === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === null ||
        event.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  },
}));