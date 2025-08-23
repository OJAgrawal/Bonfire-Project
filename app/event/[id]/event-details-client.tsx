'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Share2, Navigation, QrCode } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EventPageUI = ({ eventId }) => {
  const [eventData, setEventData] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch event data from Supabase
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      if (error) {
        console.error(error);
      } else {
        setEventData(data);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventId]);

  // Example: Register for event (add user to attendees)
  const handleJoinEvent = async () => {
    setLoading(true);
    // Replace with your user logic
    const userId = 'user-id-from-auth';
    const { error } = await supabase
      .from('event_attendees')
      .insert([{ event_id: eventId, user_id: userId }]);
    if (!error) setIsJoined(true);
    setLoading(false);
  };

  // Example: Share event
  const handleShare = async () => {
    if (navigator.share && eventData) {
      await navigator.share({
        title: eventData.title,
        text: eventData.description,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };

  // Example: Get directions
  const handleGetDirections = () => {
    if (!eventData) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${eventData.latitude},${eventData.longitude}`;
    window.open(url, '_blank');
  };

  if (loading || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Animated Background Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-20"
          style={{
            background: `linear-gradient(45deg, transparent 30%, #ff6b35 30.5%, #ff6b35 31%, transparent 31.5%), 
                        linear-gradient(-45deg, transparent 30%, #3b82f6 30.5%, #3b82f6 31%, transparent 31.5%),
                        linear-gradient(135deg, transparent 30%, #10b981 30.5%, #10b981 31%, transparent 31.5%)`,
            backgroundSize: '100px 100px',
            animation: 'moveLines 20s linear infinite'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <div className="text-xl font-bold text-white">
          bonfire
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white">
            11:53 PM GMT+5:30
          </span>
        </div>
      </header>

      <main className="pb-8 relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Event Image & Host Info */}
            <div className="space-y-6">
              {/* Event Image */}
              <div className="relative rounded-2xl overflow-hidden">
                <img 
                  src={eventData.image_url}
                  alt={eventData.title}
                  className="w-full h-96 object-cover"
                />
                
                {/* Private Event Badge */}
                {eventData.isPrivate && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white bg-opacity-20 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    <span className="text-white text-sm font-medium">Private Event</span>
                  </div>
                )}

                {/* Share Button */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={handleShare}
                    className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center justify-center"
                  >
                    <Share2 className="h-4 w-4 text-white" />
                  </button>
                </div>

                {/* Attendee Badge */}
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black bg-opacity-50 backdrop-blur-sm">
                  <span className="text-white text-sm font-medium">
                    {eventData.attendees_count} going
                  </span>
                </div>
              </div>

              {/* Host Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400">
                  Hosted By
                </h3>
                <div className="flex items-center gap-3">
                  <img 
                    src={eventData.organizer_avatar_url}
                    alt="Host"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="font-medium text-white">
                    {eventData.organizer_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Event Details */}
            <div className="space-y-8">
              {/* Event Title & DateTime */}
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-white">
                  {eventData.title}
                </h1>
                
                <div className="flex items-center gap-2 text-lg text-white">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">{eventData.date}</div>
                    <div className="text-gray-300">{eventData.time}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">{eventData.location}</div>
                  </div>
                </div>
              </div>

              {/* Registration Section */}
              <div className="p-6 rounded-xl bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Registration
                </h3>
                <p className="text-sm mb-4 text-gray-300">
                  {isJoined 
                    ? "You're registered for this event!" 
                    : "Welcome! To join the event, please register below."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleJoinEvent}
                    disabled={loading}
                    className="flex-1 bg-white text-gray-900 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : (isJoined ? 'Leave Event' : 'Register')}
                  </button>
                </div>
                
                {/* Attendees Count */}
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                  <Users className="h-4 w-4" />
                  <span>
                    {eventData.attendees_count} going
                    {eventData.max_attendees && ` / ${eventData.max_attendees} max`}
                  </span>
                </div>
              </div>

              {/* About Event */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  About Event
                </h3>
                <div className="space-y-4 text-sm leading-relaxed text-gray-300">
                  <p>{eventData.description}</p>
                  <p>{eventData.additionalInfo}</p>
                </div>
              </div>

              {/* Location with Map */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Location
                </h3>
                <div className="text-white">
                  <div className="font-medium">{eventData.location}</div>
                </div>
                
                {/* Get Directions Button */}
                <button
                  onClick={handleGetDirections}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-500 text-gray-300 hover:border-white hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </button>

                {/* Map Placeholder */}
                <div className="w-full h-64 rounded-xl overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d227821.99479258456!2d75.65046970549563!3d26.88544791796218!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396c4adf4c57e281%3A0xce1c63a0cf22e09!2sJaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1692789123456!5m2!1sen!2sin`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes moveLines {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
};

export default EventPageUI;