'use client';

import { useState, useEffect } from 'react';
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
import { useAuthStore } from '@/store/authStore';
import { useEventStore } from '@/store/eventStore';
import { EVENT_CATEGORIES } from '@/utils/constants';
import { EventCategory } from '@/types';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, Users, Tag } from 'lucide-react';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function CreateEventPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore(); // ✅ updated
  const { createEvent } = useEventStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    location: '',
    latitude: 26.8060,
    longitude: 75.8022,
    date: todayStr,
    time: '',
    end_date: todayStr,
    end_time: '',
    time_zone: 'Asia/Kolkata',
    category: '' as EventCategory,
    max_attendees: '',
    tags: '',
  });

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Intercept all router navigation
  useEffect(() => {
    const routerPush = router.push.bind(router);
    const routerReplace = router.replace.bind(router);
    
    router.push = (url: any) => {
      if (hasUnsavedChanges) {
        setShowExitDialog(true);
        (window as any).__pendingNavigation = url;
      } else {
        routerPush(url);
      }
    };
    
    router.replace = (url: any) => {
      if (hasUnsavedChanges) {
        setShowExitDialog(true);
        (window as any).__pendingNavigation = url;
      } else {
        routerReplace(url);
      }
    };
    
    return () => {
      router.push = routerPush;
      router.replace = routerReplace;
    };
  }, [router, hasUnsavedChanges, showExitDialog]);

  // ✅ Wait for auth to hydrate
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  // ✅ Redirect if no user
  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requiredFields = [
        formData.title,
        formData.description,
        formData.category,
        formData.location,
        formData.date,
        formData.time,
        formData.end_date,
        formData.end_time,
      ];

      if (requiredFields.some((field) => !field || String(field).trim() === '')) {
        toast.warning('Please fill all required fields marked with *');
        setLoading(false);
        return;
      }

      if (new Date(formData.date) > maxDate || new Date(formData.end_date) > maxDate) {
        toast.warning('Event dates must be within 1 year from today');
        setLoading(false);
        return;
      }

      // Calculate duration in minutes
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

      if (durationMinutes <= 0) {
        toast.error('End time must be after start time');
        setLoading(false);
        return;
      }

      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await createEvent({
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url || undefined,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        date: formData.date,
        time: formData.time,
        end_date: formData.end_date,
        end_time: formData.end_time,
        time_zone: formData.time_zone,
        duration: durationMinutes,
        category: formData.category,
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Check if any meaningful change was made (not just default dates)
    if (field !== 'date' && field !== 'end_date') {
      setHasUnsavedChanges(true);
    } else if (field === 'date' && value !== todayStr) {
      setHasUnsavedChanges(true);
    } else if (field === 'end_date' && value !== todayStr) {
      setHasUnsavedChanges(true);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      router.back();
    }
  };

  const confirmExit = () => {
    // Remove beforeunload listener by directly setting hasUnsavedChanges to false
    // This will trigger the useEffect to unregister the handler
    setHasUnsavedChanges(false);
    setShowExitDialog(false);
    
    // Small delay to allow state to update before navigation
    setTimeout(() => {
      // Check if there's a pending navigation from router.push/router.replace
      const pendingNav = (window as any).__pendingNavigation;
      if (pendingNav) {
        (window as any).__pendingNavigation = null;
        // Directly navigate without triggering the interceptor again
        if (typeof pendingNav === 'string') {
          window.location.href = pendingNav;
        } else {
          router.push(pendingNav);
        }
      } else {
        router.back();
      }
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Create New Event</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title">Event Title *</Label>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.title.length}/48
                      </span>
                    </div>
                    <Input
                      id="title"
                      placeholder="Enter event title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value.slice(0, 48))}
                      maxLength={48}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Description *</Label>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.description.length}/2000
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Describe your event..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value.slice(0, 2000))}
                      maxLength={2000}
                      rows={4}
                      required
                    />
                  </div>

                  {/* Image URL */}
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Cover Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url}
                      onChange={(e) => handleChange('image_url', e.target.value)}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use a direct image link (JPG, PNG, or GIF).
                    </p>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                      <SelectTrigger>
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

                  {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">
                    Location *
                  </Label>
                  <LocationAutocomplete
                    value={formData.location}
                    onChange={(location) => handleChange('location', location)}
                    onLocationSelect={(locationData) => {
                      // Update form data with location details
                      setFormData(prev => ({
                        ...prev,
                        location: locationData.address,
                        latitude: locationData.lat,
                        longitude: locationData.lng,
                      }));
                    }}
                    placeholder="Search for event location..."
                    required
                  />
                  {/* Optional: Show selected location details */}
                  {formData.latitude !== 26.8060 && formData.longitude !== 75.8022 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      📍 Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                    </div>
                  )}
                </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Start Date *
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        min={todayStr}
                        max={maxDateStr}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Start Time *
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleChange('time', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* End Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="end_date">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        End Date *
                      </Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleChange('end_date', e.target.value)}
                        min={formData.date || todayStr}
                        max={maxDateStr}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_time">
                        <Clock className="inline h-4 w-4 mr-1" />
                        End Time *
                      </Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => handleChange('end_time', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Time Zone */}
                  <div className="space-y-2">
                    <Label htmlFor="time_zone">Time Zone</Label>
                    <Select value={formData.time_zone} onValueChange={(value) => handleChange('time_zone', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">IST (Asia/Kolkata, UTC+05:30)</SelectItem>
                        <SelectItem value="UTC">UTC (Coordinated, UTC+00:00)</SelectItem>
                        <SelectItem value="America/New_York">ET (America/New_York, UTC-05:00)</SelectItem>
                        <SelectItem value="America/Los_Angeles">PT (America/Los_Angeles, UTC-08:00)</SelectItem>
                        <SelectItem value="Europe/London">UK (Europe/London, UTC+00:00)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Max Attendees */}
                  <div className="space-y-2">
                    <Label htmlFor="max_attendees">
                      <Users className="inline h-4 w-4 mr-1" />
                      Max Attendees
                    </Label>
                    <Input
                      id="max_attendees"
                      type="number"
                      placeholder="No limit"
                      value={formData.max_attendees}
                      onChange={(e) => handleChange('max_attendees', e.target.value)}
                      min="1"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">
                      <Tag className="inline h-4 w-4 mr-1" />
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      placeholder="Enter tags separated by commas"
                      value={formData.tags}
                      onChange={(e) => handleChange('tags', e.target.value)}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Separate tags with commas (e.g., "networking, tech, startup")
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleBack}
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
          </motion.div>
        </div>
      </main>

      <BottomNav />

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? All your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExitDialog(false)}>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}