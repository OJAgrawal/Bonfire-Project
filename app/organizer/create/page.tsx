'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/common/header';
import { BottomNav } from '@/components/common/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/authStore';
import { useEventStore } from '@/store/eventStore';
import { EVENT_CATEGORIES } from '@/utils/constants';
import { EventCategory } from '@/types';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Tag, 
  Upload,
  Eye,
  Share2,
  Navigation,
  QrCode 
} from 'lucide-react';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';

export default function CreateEventPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { createEvent } = useEventStore();

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    latitude: 26.8060,
    longitude: 75.8022,
    date: '',
    time: '',
    duration: 120,
    category: '' as EventCategory,
    max_attendees: '',
    tags: '',
    image_url: '',
    is_private: false,
  });

  // Helper functions for preview
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Select Time';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await createEvent({
        ...formData,
        organizer_id: user.id,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        attendees_count: 0,
        tags: tagsArray,
        status: 'active',
      });

      toast.success('Event created successfully!');
      router.push('/organizer');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const category = EVENT_CATEGORIES.find(cat => cat.value === formData.category);

  // Preview Modal Component
  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Preview Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Event Preview</h2>
          <Button
            onClick={() => setShowPreview(false)}
            variant="ghost"
            className="text-white hover:bg-gray-800"
          >
            ✕
          </Button>
        </div>

        {/* Luma-style Preview */}
        <div className="relative overflow-hidden">
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

          {/* Preview Header */}
          <header className="relative z-10 p-6 flex justify-between items-center">
            <div className="text-xl font-bold text-white">bonfire</div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white">Preview Mode</span>
            </div>
          </header>

          {/* Preview Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Event Image & Host Info */}
              <div className="space-y-6">
                {/* Event Image */}
                <div className="relative rounded-2xl overflow-hidden">
                  {formData.image_url ? (
                    <img 
                      src={formData.image_url}
                      alt={formData.title || "Event Preview"}
                      className="w-full h-96 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-orange-400 via-red-500 to-pink-500"
                    style={{ display: formData.image_url ? 'none' : 'flex' }}
                  >
                    <span className="text-8xl">{category?.icon || '🔥'}</span>
                  </div>
                  
                  {/* Private Event Badge */}
                  {formData.is_private && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white bg-opacity-20 backdrop-blur-sm">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="text-white text-sm font-medium">Private Event</span>
                    </div>
                  )}

                  {/* Share Button */}
                  <div className="absolute top-4 right-4">
                    <button className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center justify-center">
                      <Share2 className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  {/* Attendee Badge */}
                  <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black bg-opacity-50 backdrop-blur-sm">
                    <span className="text-white text-sm font-medium">0 going</span>
                  </div>
                </div>

                {/* Host Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Hosted By</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium">
                      {user.name?.[0] || user.email?.[0] || 'U'}
                    </div>
                    <span className="font-medium text-white">
                      {user.name || user.email || 'Event Organizer'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="text-sm underline text-left text-gray-300 hover:text-white transition-colors">
                      Contact the Host
                    </button>
                    <button className="text-sm underline text-left text-gray-300 hover:text-white transition-colors">
                      Report Event
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Event Details */}
              <div className="space-y-8">
                {/* Event Title & DateTime */}
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold text-white">
                    {formData.title || 'Your Event Title'}
                  </h1>
                  
                  <div className="flex items-center gap-2 text-lg text-white">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">{formatDate(formData.date)}</div>
                      <div className="text-gray-300">{formatTime(formData.time)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-white">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">{formData.location || 'Event Location'}</div>
                      <div className="text-gray-300">Location</div>
                    </div>
                  </div>
                </div>

                {/* Registration Section */}
                <div className="p-6 rounded-xl bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20">
                  <h3 className="text-lg font-semibold mb-4 text-white">Registration</h3>
                  <p className="text-sm mb-4 text-gray-300">
                    Welcome! To join the event, please register below.
                  </p>
                  <button className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-all hover:scale-105">
                    Register
                  </button>
                  
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                    <Users className="h-4 w-4" />
                    <span>0 going{formData.max_attendees && ` / ${formData.max_attendees} max`}</span>
                  </div>
                </div>

                {/* About Event */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">About Event</h3>
                  <div className="space-y-4 text-sm leading-relaxed text-gray-300">
                    <p>{formData.description || 'Your event description will appear here...'}</p>
                  </div>

                  {/* Tags */}
                  {formData.tags && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {formData.tags.split(',').map((tag, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 rounded-full text-sm border border-gray-500 text-gray-300"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Location</h3>
                  <div className="text-white">
                    <div className="font-medium">{formData.location || 'Event Location'}</div>
                    <div className="text-sm text-gray-300">Venue</div>
                  </div>
                  
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-500 text-gray-300 hover:border-white hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors">
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes moveLines {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
        `}</style>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Animated Background Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-10"
          style={{
            background: `linear-gradient(45deg, transparent 30%, #ff6b35 30.5%, #ff6b35 31%, transparent 31.5%), 
                        linear-gradient(-45deg, transparent 30%, #3b82f6 30.5%, #3b82f6 31%, transparent 31.5%),
                        linear-gradient(135deg, transparent 30%, #10b981 30.5%, #10b981 31%, transparent 31.5%)`,
            backgroundSize: '100px 100px',
            animation: 'moveLines 20s linear infinite'
          }}
        />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-white">Create New Event</h1>
            </div>
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Left Column - Form */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Event Details</CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Event Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter event title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your event..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      rows={4}
                      required
                    />
                  </div>

                  {/* Image URL */}
                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-white">
                      <Upload className="inline h-4 w-4 mr-1" />
                      Event Image URL
                    </Label>
                    <Input
                      id="image_url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url}
                      onChange={(e) => handleChange('image_url', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <p className="text-sm text-gray-400">
                      Add a URL to display a custom event image
                    </p>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <span className="mr-2">{category.icon}</span>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Private Event Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_private" className="text-white">Private Event</Label>
                      <p className="text-sm text-gray-400">Only invited people can join</p>
                    </div>
                    <Switch
                      id="is_private"
                      checked={formData.is_private}
                      onCheckedChange={(checked) => handleChange('is_private', checked)}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-white">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Location *
                    </Label>
                    <LocationAutocomplete
                      value={formData.location}
                      onChange={(location) => handleChange('location', location)}
                      onLocationSelect={(locationData) => {
                        setFormData(prev => ({
                          ...prev,
                          location: locationData.address,
                          latitude: locationData.lat,
                          longitude: locationData.lng,
                        }));
                      }}
                      placeholder="Search for event location..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-white">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Date *
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-white">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Time *
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleChange('time', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Duration and Max Attendees */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="120"
                        value={formData.duration}
                        onChange={(e) => handleChange('duration', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        min="30"
                        max="480"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_attendees" className="text-white">
                        <Users className="inline h-4 w-4 mr-1" />
                        Max Attendees
                      </Label>
                      <Input
                        id="max_attendees"
                        type="number"
                        placeholder="No limit"
                        value={formData.max_attendees}
                        onChange={(e) => handleChange('max_attendees', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-white">
                      <Tag className="inline h-4 w-4 mr-1" />
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      placeholder="networking, tech, startup"
                      value={formData.tags}
                      onChange={(e) => handleChange('tags', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <p className="text-sm text-gray-400">
                      Separate tags with commas
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-white text-white hover:bg-white hover:text-gray-900"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Event'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Right Column - Live Preview */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Live Preview</h3>
                <span className="text-sm text-gray-400">Updates as you type</span>
              </div>

              {/* Mini Preview */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-2xl overflow-hidden">
                {/* Event Image Preview */}
                <div className="relative h-48">
                  {formData.image_url ? (
                    <img 
                      src={formData.image_url}
                      alt="Event preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 via-red-500 to-pink-500"
                    style={{ display: formData.image_url ? 'none' : 'flex' }}
                  >
                    <span className="text-4xl">{category?.icon || '🔥'}</span>
                  </div>
                  
                  {formData.is_private && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white bg-opacity-20 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      <span className="text-white text-xs font-medium">Private</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <h4 className="font-bold text-white text-lg">
                    {formData.title || 'Your Event Title'}
                  </h4>
                  
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(formData.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(formData.time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{formData.location || 'Location TBD'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>0 going</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      Hosted by {user.name || user.email || 'You'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-gray-400 text-center">
                Click "Preview" to see full event page
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <BottomNav />

      {/* Preview Modal */}
      {showPreview && <PreviewModal />}

      <style jsx>{`
        @keyframes moveLines {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
}