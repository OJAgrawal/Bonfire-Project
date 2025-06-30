import EventDetailsClient from './event-details-client';
import { supabase } from '@/utils/supabase';

export default async function EventDetailsPageWrapper({ params }: { params: { id: string } }) {
  return <EventDetailsClient eventId={params.id} />;
}

export async function generateStaticParams() {
  const { data, error } = await supabase.from('events').select('id');

  if (error || !data) {
    console.error('Error fetching event IDs:', error);
    return [];
  }

  return data.map((event) => ({
    id: event.id.toString(), // 🔥 Must be string
  }));
}