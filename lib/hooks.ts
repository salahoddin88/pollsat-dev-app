import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import * as Device from 'expo-device';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants/Config';
import { jwtDecode } from 'jwt-decode';
import {
  signVoteWithSolana,
} from '@/lib/blockchain/crypto';


const ACCESS_KEY = 'POLLSAT_ACCESS_KEY';
const VOTER_ID = 'POLLSAT_VOTER_ID';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

interface JwtClaims {
  voter_id: string;
  [key: string]: any;
}

export interface LocationData {
  name: string;
  place_id: string;
  latitude: number;
  longitude: number;
  bounding_box?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  geojson?: {
    type: string;
    coordinates: number[][][];
  };
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const getDeviceId = async (): Promise<string> => {
  try {
    const deviceId = Device.deviceName || Device.modelName || 'unknown_device';
    return `${deviceId}_${Device.osInternalBuildId}`;

  } catch (error) {
    console.error('Error getting device ID:', error);
    return `unknown_${Date.now()}`;
  }
};

export const registerVoter = async (deviceId: string): Promise<{ data: any[] | null; error: Error | null }> => {
  const { data, error } = await supabase.functions.invoke('register_voter', {
    body: { name: 'Functions', device_id: deviceId },
  })
  return { data: [data], error: null };
}


export const customClaim = async (deviceId: string): Promise<{ data: any[] | null; error: Error | null }> => {
  const accessKey = await SecureStore.getItemAsync(ACCESS_KEY);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/custom_jwt_claims`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${accessKey}`, // Send Public Key as Authorization
    },
    body: JSON.stringify({ auth_payload: { device_id: deviceId } }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("customClaim Error:", data);
    return { data: null, error: new Error(data.message || "Failed to fetch custom claims") };
  }
  return { data: [data], error: null };
}

export const getVoterIdFromToken = async (): Promise<string | null> => {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
    if (!accessToken) return null;
    const claims = jwtDecode<JwtClaims>(accessToken);
    return claims.voter_id;
  } catch (error) {
    return null;
  }
};


export const loginAnonymously = async (deviceId: string) => {
  let authData = { 'device_id': deviceId }
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: authData,
    }
  });

  let accessToken = data?.session?.access_token;
  if (accessToken) {
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: { device_id: deviceId }
  });

  if (error || !data.session) {
    console.error("Anonymous login failed:", error);
    return null;
  }

  let voterId = await getVoterIdFromToken();
  if (voterId) {
    await SecureStore.setItemAsync(VOTER_ID, voterId);
  }
};


export const getOrStoreVoter = async (): Promise<{ voters: any[] | null; error: Error | null }> => {
  try {
    const deviceId = await getDeviceId();
    const { data: { user } } = await supabase.auth.getUser()
    let { data: existingVoter, error: selectError } = await supabase
      .from('voters')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (selectError || !existingVoter) {
      const { data: newVoter, error: insertError } = await supabase
        .from('voters')
        .insert([{ device_id: deviceId }])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      return { voters: [newVoter], error: null };
    }
    return { voters: [existingVoter], error: null };

  } catch (error) {
    console.error('Error in getOrStoreVoter:', error);
    return { voters: null, error: error as Error };
  }
}


export const saveLocationToVoter = async (locationData: LocationData) => {
  try {

    const voterId = await getVoterIdFromToken();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
      throw new Error('Failed to retrieve access token');
    }
    
    const formattedGeoJSON = locationData.geojson ? {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [locationData.geojson.coordinates[0]] // Ensure it's a proper nested array
      },
      properties: {}
    } : null;

    // Format bounding box as a proper GeoJSON polygon
    const formattedBoundingBox = locationData.bounding_box ? {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [locationData.bounding_box.southwest.lng, locationData.bounding_box.southwest.lat],
          [locationData.bounding_box.northeast.lng, locationData.bounding_box.southwest.lat],
          [locationData.bounding_box.northeast.lng, locationData.bounding_box.northeast.lat],
          [locationData.bounding_box.southwest.lng, locationData.bounding_box.northeast.lat],
          [locationData.bounding_box.southwest.lng, locationData.bounding_box.southwest.lat]
        ]]
      },
      properties: {}
    } : null;

    const { error } = await supabase
      .from('voters')
      .update({
        location_name: locationData.name,
        place_id: locationData.place_id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        // bounding_box: formattedBoundingBox,
        // geojson: formattedGeoJSON
      })
      .eq('id', voterId);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving location:', error);
    throw error;
  }
};


// lib/hooks.ts

// ... (previous imports remain the same)

// Update getPolls to include likes and comments
export const getPolls = async (): Promise<{ polls: any[] | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*),
        votes (
          id,
          vote_hash,
          voter_id,
          option_id
        ),
        poll_likes (
          id,
          voter_id
        ),
        comments (
          id,
          text,
          voter_id,
          created_at
        ),
        voter:voters!polls_voter_id_fkey (
          id, 
          device_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { polls: data, error: null };
  } catch (error) {
    console.error('Get polls error:', error);
    return { polls: null, error: error as Error };
  }
};

// Update votePoll to use voter_id instead of user.id
export const votePoll = async (
  pollId: string,
  optionId: string,
  latitude: number,
  longitude: number
): Promise<{ vote: any | null; error: Error | null }> => {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
      throw new Error('Failed to retrieve access token');
    }

    const voterId = await getVoterIdFromToken();
    if (!voterId) {
      throw new Error('Voter ID not found');
    }
    console.log('sessionData.session.access_token: ', sessionData.session.access_token)
    // Create vote hash
    const voteData = {
      poll_id: pollId,
      option_id: optionId,
      voter_id: voterId,
      timestamp: Date.now()
    };
    // const voteHash = sha256(JSON.stringify(voteData));

    const { signature, voteHash } = await signVoteWithSolana(
      pollId,
      optionId,
      voterId
    );
    console.log('pollId', pollId);
    console.log('optionId', optionId);
    console.log('signature', signature);
    console.log('voteHash', voteHash);

    // Call the edge function to submit the vote
    const { data, error } = await supabase.functions.invoke('register_vote', {
      body: JSON.stringify({
        poll_id: pollId,
        option_id: optionId,
        signature: signature,
        vote_hash: voteHash,
      }),
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        ContentType: 'application/json'
      }
    });

    if (error) throw error;
    return { vote: data, error: null };
  } catch (error) {
    console.error('Vote error:', error);
    return { vote: null, error: error as Error };
  }
};

// Update togglePollLike to use voter_id
export const togglePollLike = async (
  pollId: string,
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const voterId = await getVoterIdFromToken();
    const { data: existingLike } = await supabase
      .from('poll_likes')
      .select()
      .eq('poll_id', pollId)
      .eq('voter_id', voterId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('poll_likes')
        .delete()
        .eq('poll_id', pollId)
        .eq('voter_id', voterId);

      if (error) throw error;
    } else {
      // Like
      const { error } = await supabase
        .from('poll_likes')
        .insert([{ poll_id: pollId, voter_id: voterId }]);

      if (error) throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Toggle like error:', error);
    return { success: false, error: error as Error };
  }
};

// Add comment functionality
export const addComment = async (pollId: string, comment: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const voterId = await getVoterIdFromToken();
    if (!voterId) {
      throw new Error('Voter ID not found');
    }

    const { error } = await supabase
      .from('comments')
      .insert([{
        poll_id: pollId,
        voter_id: voterId,
        comment: comment
      }]);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Add comment error:', error);
    return { success: false, error: error as Error };
  }
};

export const getComments = async (pollId: string): Promise<{ comments: any[] | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
                *,
                voter:voters(device_id)
            `)
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { comments: data, error: null };
  } catch (error) {
    console.error('Get comments error:', error);
    return { comments: null, error: error as Error };
  }
};
