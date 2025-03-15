import { getDeviceId, supabase, registerVoter, customClaim, loginAnonymously } from '@/lib/hooks';
import {
    generateSolanaKeyPair,
    createSolanaDeviceSignature,
    verifySolanaSignature,
    generateNonce,
    hashDeviceId,
    signVoteWithSolana,
    submitMerkleRootToSolana,
    verifySolanaTransaction
} from './crypto';
import { BlockchainAuthResponse, DeviceSignature, SolanaKeyPair } from './types';
import * as SecureStore from 'expo-secure-store';
import { sha256 } from 'js-sha256';

// Storage keys
const DEVICE_AUTH_KEY = 'POLLSAT_DEVICE_AUTH';
const MERKLE_ROOT_KEY = 'POLLSAT_MERKLE_ROOT';
const SOLANA_TRANSACTION_KEY = 'POLLSAT_SOLANA_TRANSACTION';

/**
 * Initialize blockchain authentication for a device using Solana
 */
export const initializeBlockchainAuth = async (): Promise<BlockchainAuthResponse> => {
    try {
        let signature: DeviceSignature | undefined;
        let solanaKeyPair: SolanaKeyPair | undefined;
        let publicKey: string | undefined;
        let existing = false;

        const storedAuth = await SecureStore.getItemAsync(DEVICE_AUTH_KEY);
        if (storedAuth) {
            const authData = JSON.parse(storedAuth) as DeviceSignature;
            signature = authData;
            publicKey = authData?.publicKey;
            existing = true;
        } else {
            const deviceId = await getDeviceId();
            solanaKeyPair = await generateSolanaKeyPair();
            publicKey = solanaKeyPair?.publicKey;
            signature = await createSolanaDeviceSignature(deviceId);
            await SecureStore.setItemAsync(DEVICE_AUTH_KEY, JSON.stringify(signature));
        }

        if (!publicKey) {
            throw new Error("Public key is undefined");
        }

        await registerVoter(publicKey);
        await loginAnonymously(publicKey);

        return { success: true, existing, solanaKeyPair, signature };

    } catch (error) {
        console.error('Error initializing blockchain auth:', error);
        return { success: false, error: (error as Error).message };
    }
};


/**
 * Store device authentication data in Supabase
 */
const storeDeviceAuth = async (signature: DeviceSignature, solanaKeyPair: SolanaKeyPair): Promise<void> => {
    try {
        // Generate a nonce for this registration
        const nonce = await generateNonce();

        // Hash the device ID for privacy
        const hashedDeviceId = hashDeviceId(signature.deviceId, nonce);

        // Store the authentication data
        const { error } = await supabase
            .from('device_auth')
            .insert([
                {
                    hashed_device_id: hashedDeviceId,
                    public_key: solanaKeyPair.publicKey,
                    address: solanaKeyPair.publicKey, // In Solana, the public key is the address
                    signature: signature.signature,
                    timestamp: signature.timestamp,
                    nonce: nonce
                }
            ]);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error storing device auth:', error);
        throw new Error('Failed to store device authentication');
    }
};

/**
 * Verify a device's blockchain authentication using Solana
 */
export const verifyDeviceAuth = async (deviceSignature: DeviceSignature): Promise<boolean> => {
    try {
        // Create the data that was signed
        const dataToVerify = `${deviceSignature.deviceId}:${deviceSignature.timestamp}`;

        // Verify the signature using Solana
        const { isValid } = verifySolanaSignature(
            dataToVerify,
            deviceSignature.signature,
            deviceSignature.publicKey
        );

        if (!isValid) {
            return false;
        }

        // Check if the device is registered in Supabase
        const { data, error } = await supabase
            .from('device_auth')
            .select('*')
            .eq('public_key', deviceSignature.publicKey)
            .single();

        if (error || !data) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error verifying device auth:', error);
        return false;
    }
};

/**
 * Get the current device's blockchain authentication
 */
export const getDeviceAuth = async (): Promise<DeviceSignature | null> => {
    try {
        const storedAuth = await SecureStore.getItemAsync(DEVICE_AUTH_KEY);
        if (!storedAuth) {
            return null;
        }

        return JSON.parse(storedAuth) as DeviceSignature;
    } catch (error) {
        console.error('Error getting device auth:', error);
        return null;
    }
};

/**
 * Update the Merkle root for device authentication and submit to Solana
 */
export const updateMerkleRoot = async (merkleRoot: string): Promise<string> => {
    try {
        // Store the Merkle root locally
        await SecureStore.setItemAsync(MERKLE_ROOT_KEY, merkleRoot);

        // Get the device ID and signature
        const deviceAuth = await getDeviceAuth();
        if (!deviceAuth) {
            throw new Error('No device authentication found');
        }

        // Submit the Merkle root to Solana
        const solanaSignature = await submitMerkleRootToSolana(merkleRoot);

        // Store the Solana transaction signature
        await SecureStore.setItemAsync(SOLANA_TRANSACTION_KEY, solanaSignature);

        // Store the Merkle root in Supabase
        const { error } = await supabase
            .from('merkle_roots')
            .insert([
                {
                    merkle_root: merkleRoot,
                    created_by: deviceAuth.deviceId,
                    solana_signature: solanaSignature
                }
            ]);

        if (error) {
            throw error;
        }

        return solanaSignature;
    } catch (error) {
        console.error('Error updating Merkle root:', error);
        throw new Error('Failed to update Merkle root');
    }
};

/**
 * Get the current Merkle root
 */
export const getMerkleRoot = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(MERKLE_ROOT_KEY);
    } catch (error) {
        console.error('Error getting Merkle root:', error);
        return null;
    }
};

/**
 * Vote on a poll with Solana signature
 */
export const voteOnPoll = async (
    userId: string,
    pollId: string,
    optionId: string,
    latitude: number,
    longitude: number
): Promise<{ vote: any; error: Error | null }> => {
    try {
        // Sign the vote with Solana
        const { signature, voteHash } = await signVoteWithSolana(pollId, optionId, userId);

        // Submit the vote to Supabase
        const { data, error } = await supabase
            .from('votes')
            .insert([
                {
                    voter_id: userId,
                    poll_id: pollId,
                    option_id: optionId,
                    signature: signature,
                    vote_hash: voteHash,
                    vote_latitude: latitude,
                    vote_longitude: longitude
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return { vote: data, error: null };
    } catch (error) {
        console.error('Vote error:', error);
        return { vote: null, error: error as Error };
    }
};

/**
 * Verify a vote using Solana
 */
export const verifyVote = async (voteId: string): Promise<{
    verified: boolean;
    message: string;
    merkle_root?: string;
    solana_signature?: string;
}> => {
    try {
        // Get the vote details
        const { data, error } = await supabase
            .from('votes')
            .select(`
        id,
        signature,
        vote_hash,
        merkle_root_id,
        merkle_roots(merkle_root, solana_signature)
      `)
            .eq('id', voteId)
            .single();

        if (error) {
            throw error;
        }

        if (!data.merkle_root_id) {
            return {
                verified: false,
                message: 'Vote has not been added to a Merkle tree yet'
            };
        }

        // Verify the Solana transaction
        const solanaSignature = data.merkle_roots?.solana_signature;
        if (!solanaSignature) {
            return {
                verified: false,
                message: 'Vote has not been committed to Solana yet'
            };
        }

        const isVerified = await verifySolanaTransaction(solanaSignature);

        return {
            verified: isVerified,
            message: isVerified
                ? 'Vote successfully verified on the Solana blockchain'
                : 'Vote verification failed',
            merkle_root: data.merkle_roots?.merkle_root,
            solana_signature: solanaSignature
        };
    } catch (error) {
        console.error('Error verifying vote:', error);
        throw error;
    }
};

/**
 * Store a vote locally for later verification
 */
export const storeVoteLocally = async (vote: any): Promise<void> => {
    try {
        // Get existing votes
        const storedVotes = await SecureStore.getItemAsync('POLLSAT_VOTES');
        const votes = storedVotes ? JSON.parse(storedVotes) : [];

        // Add the new vote
        votes.push(vote);

        // Store the updated votes
        await SecureStore.setItemAsync('POLLSAT_VOTES', JSON.stringify(votes));
    } catch (error) {
        console.error('Error storing vote locally:', error);
        throw error;
    }
};

/**
 * Get locally stored votes
 */
export const getLocalVotes = async (): Promise<any[]> => {
    try {
        const storedVotes = await SecureStore.getItemAsync('POLLSAT_VOTES');
        return storedVotes ? JSON.parse(storedVotes) : [];
    } catch (error) {
        console.error('Error getting local votes:', error);
        return [];
    }
};

/**
 * Batch commit votes to Solana
 */
// export const batchCommitVotesToSolana = async (pollId: string): Promise<{
//     success: boolean;
//     merkleRoot?: string;
//     solanaSignature?: string;
//     error?: string;
// }> => {
//     try {
//         // Get all votes for this poll that haven't been added to a Merkle tree yet
//         const { data: votes, error: votesError } = await supabase
//             .from('votes')
//             .select('id, vote_hash')
//             .eq('poll_id', pollId)
//             .is('merkle_root_id', null);

//         if (votesError) {
//             throw votesError;
//         }

//         if (!votes || votes.length === 0) {
//             return {
//                 success: false,
//                 error: 'No votes to process for this poll'
//             };
//         }

//         // Create a Merkle tree from the vote hashes
//         const voteHashes = votes.map(vote => vote.vote_hash);
//         const tree = createMerkleTree(voteHashes);
//         const merkleRoot = tree.getRoot();

//         // Submit the Merkle root to Solana
//         const solanaSignature = await updateMerkleRoot(merkleRoot);

//         // Create a new Merkle root record in Supabase
//         const { data: merkleRootData, error: merkleRootError } = await supabase
//             .from('merkle_roots')
//             .insert([
//                 {
//                     merkle_root: merkleRoot,
//                     poll_id: pollId,
//                     solana_signature: solanaSignature
//                 }
//             ])
//             .select('id')
//             .single();

//         if (merkleRootError) {
//             throw merkleRootError;
//         }

//         // Update all the votes with the Merkle root ID
//         const { error: updateError } = await supabase
//             .from('votes')
//             .update({ merkle_root_id: merkleRootData.id })
//             .in('id', votes.map(vote => vote.id));

//         if (updateError) {
//             throw updateError;
//         }

//         return {
//             success: true,
//             merkleRoot,
//             solanaSignature
//         };
//     } catch (error) {
//         console.error('Error batch committing votes to Solana:', error);
//         return {
//             success: false,
//             error: (error as Error).message
//         };
//     }
// };

/**
 * Get Solana transaction details
 */
export const getSolanaTransactionDetails = async (signature: string): Promise<any> => {
    try {
        // Call the Solana API to get transaction details
        const response = await fetch(`${SOLANA_NETWORK}/api/v1/transaction/${signature}`);
        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Error getting Solana transaction details:', error);
        throw error;
    }
};

// Solana network URL
const SOLANA_NETWORK = 'https://api.devnet.solana.com';