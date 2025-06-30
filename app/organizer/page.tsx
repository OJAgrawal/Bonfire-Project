'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/common/header';
import { BottomNav } from '@/components/common/bottom-nav';
import { EventCard } from '@/components/common/event-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useEventStore } from '@/store/eventStore';
import { Plus, Calendar, Users, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OrganizerPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { events, fetchEvents, deleteEvent } = useEventStore();
  const [loading, setLoading] = useState(true);

  // Filter events organized by current user
  const myEvents = events.filter(event => event.organizer_id === user?.id);

  useEffect(() => {
    if (user) {
      fetchEvents().then(() => setLoading(false));
    }
  }, [user, fetchEvents]);

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        toast.success('Event deleted successfully');
      } catch (error) {
        toast.error('Failed to delete event');
      }
    }
  };

  const stats = {
    totalEvents: myEvents.length,
    totalAttendees: myEvents.reduce((sum, event) => sum + event.attendees_count, 0),
    activeEvents: myEvents.filter(event => event.status === 'active').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Organizer Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your events and track engagement
              </p>
            </div>
            
            <Button
              onClick={() => router.push('/organizer/create')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Event
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeEvents} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAttendees}</div>
                <p className="text-xs text-muted-foreground">
                  Across all events
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalEvents > 0 ? Math.round(stats.totalAttendees / stats.totalEvents) : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per event
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Events List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Events</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {myEvents.length} event{myEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {myEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎪</div>
                <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first event to get started as an organizer
                </p>
                <Button
                  onClick={() => router.push('/organizer/create')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Event
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    {/* Admin Actions */}
                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 rounded-full p-0 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/organizer/edit/${event.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 rounded-full p-0 bg-white/20 backdrop-blur-sm hover:bg-red-500/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div onClick={() => router.push(`/event/${event.id}`)}>
                      <EventCard event={event} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}