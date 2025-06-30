import CheckInClient from './checkin-client';

export default function CheckInPageWrapper({ params }: { params: { id: string } }) {
  return <CheckInClient eventId={params.id} />;
}

import { supabase } from '@/utils/supabase';

export async function generateStaticParams() {
  const { data, error } = await supabase.from('events').select('id');

  if (error || !data) {
    console.error('Error generating static params for check-in page:', error);
    return [];
  }

  return data.map((event) => ({
    id: event.id.toString(),
  }));
}