import { useState } from 'react';
import { supabase } from '@/lib/hooks';

// Define minimal types we need
interface Tag {
  id: string;
  name: string;
}

interface LocationData {
  location_name: string;
  place_id: string;
  latitude: number;
  longitude: number;
  bounding_box?: any;
  geojson?: any;
}

interface CreatePollParams {
  question: string;
  description?: string;
  options: string[];
  tagId: string;
  location: LocationData;
  expiresAt: Date;
  voterId: string;
}

export function usePollCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPoll = async ({
    question,
    description,
    options,
    tagId,
    location,
    expiresAt,
    voterId,
  }: CreatePollParams) => {
    try {
      setIsLoading(true);
      setError(null);

      // Insert the poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          question,
          description,
          voter_id: voterId,
          location_name: location.location_name,
          place_id: location.place_id,
          poll_latitude: location.latitude,
          poll_longitude: location.longitude,
          bounding_box: location.bounding_box,
          geojson: location.geojson,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Insert poll options
      const pollOptions = options.map(option => ({
        poll_id: poll.id,
        option_text: option,
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(pollOptions);

      if (optionsError) throw optionsError;

      // Insert poll tag
      const { error: tagError } = await supabase
        .from('poll_tags')
        .insert({
          poll_id: poll.id,
          tag_id: tagId,
        });

      if (tagError) throw tagError;

      return { poll, error: null };
    } catch (error) {
      const message = (error as Error).message;
      setError(message);
      return { poll: null, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return { tags: data as Tag[], error: null };
    } catch (error) {
      const message = (error as Error).message;
      return { tags: null, error: message };
    }
  };

  const fetchVoterLocation = async (voterId: string) => {
    try {
      const { data, error } = await supabase
        .from('voters')
        .select('location_name, place_id, latitude, longitude, bounding_box, geojson')
        .eq('id', voterId)
        .single();

      if (error) throw error;
      return { location: data as LocationData, error: null };
    } catch (error) {
      const message = (error as Error).message;
      return { location: null, error: message };
    }
  };

  return {
    createPoll,
    fetchTags,
    fetchVoterLocation,
    isLoading,
    error,
  };
}

// Export types for use in components
export type { Tag, LocationData };
