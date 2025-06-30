'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/common/header';
import { BottomNav } from '@/components/common/bottom-nav';
import { CrowdBadge } from '@/components/common/crowd-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { useEventStore } from '@/store/eventStore';
import { formatDate, formatTime, getEventStatus } from '@/utils/helpers';
import { EVENT_CATEGORIES } from '@/utils/constants';
import { toast } from 'sonner';
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  Share2,
  Navigation,
  QrCode,
} from 'lucide-react';

export default function EventDetailsClient({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    selectedEvent,
    fetchEventById,
    joinEvent,
    leaveEvent,
    hasJoinedEvent,
  } = useEventStore();
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    const fetchAndCheckJoinStatus = async () => {
      if (!eventId || !user) return;
      const event = await fetchEventById(eventId);
      if (event && user) {
        const joined = await hasJoinedEvent(event.id, user.id);
        setIsJoined(joined);
      }
      setLoading(false);
    };

    fetchAndCheckJoinStatus();
  }, [eventId, fetchEventById, hasJoinedEvent, user]);

  const handleJoinEvent = async () => {
    if (!user || !selectedEvent) return;

    try {
      if (isJoined) {
        await leaveEvent(selectedEvent.id, user.id);
        setIsJoined(false);
        toast.success('You have left the event');
      } else {
        await joinEvent(selectedEvent.id, user.id);
        setIsJoined(true);
        toast.success('Successfully joined the event!');
      }
    } catch (error) {
      toast.error('Failed to update event attendance');
    }
  };

  const handleShare = async () => {
    if (!selectedEvent) return;

    try {
      await navigator.share({
        title: selectedEvent.title,
        text: selectedEvent.description,
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard!');
    }
  };

  const handleGetDirections = () => {
    if (!selectedEvent) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedEvent.latitude},${selectedEvent.longitude}`;
    window.open(url, '_blank');
  };

  const handleCheckIn = () => {
    if (!selectedEvent) return;
    router.push(`/event/${selectedEvent.id}/checkin`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/home')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const category = EVENT_CATEGORIES.find(cat => cat.value === selectedEvent.category);
  const status = getEventStatus(selectedEvent);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="pb-20 md:pb-6">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 bg-gradient-to-r from-orange-400 to-red-500 overflow-hidden">
          {selectedEvent.image_url ? (
            <img
              src={selectedEvent.image_url}
              alt={selectedEvent.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 via-red-500 to-pink-500">
              <span className="text-8xl">{category?.icon || '🔥'}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/20" />

          <div className="absolute top-4 left-4">
            <Badge variant={status === 'Today' ? 'default' : 'secondary'}>
              {status}
            </Badge>
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-10 w-10 rounded-full p-0 bg-white/20 backdrop-blur-sm hover:bg-white/30"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 text-white" />
            </Button>
          </div>

          <div className="absolute bottom-4 left-4">
            <CrowdBadge event={selectedEvent} />
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedEvent.title}
            </h1>

            {/* Event Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{formatDate(selectedEvent.date)}</p>
                    <p className="text-sm">Date</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{formatTime(selectedEvent.time)}</p>
                    <p className="text-sm">Time</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Users className="h-5 w-5" />
                  <div>
                    <p className="font-medium">
                      {selectedEvent.attendees_count} going
                      {selectedEvent.max_attendees && ` / ${selectedEvent.max_attendees} max`}
                    </p>
                    <p className="text-sm">Attendees</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <MapPin className="h-5 w-5 mt-1" />
                <div>
                  <p className="font-medium">{selectedEvent.location}</p>
                  <p className="text-sm">Location</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleGetDirections}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>

            {selectedEvent.organizer && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <Avatar>
                  <AvatarImage src={selectedEvent.organizer.avatar_url} />
                  <AvatarFallback>
                    {selectedEvent.organizer.name?.[0] || 'O'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedEvent.organizer.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Event Organizer</p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border">
              <h2 className="text-xl font-semibold mb-3">About This Event</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>

            {selectedEvent.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                onClick={handleJoinEvent}
              >
                {isJoined ? 'Leave Event' : 'Join Event'}
              </Button>

              {isJoined && (
                <Button variant="outline" className="flex-1" onClick={handleCheckIn}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Check In
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}