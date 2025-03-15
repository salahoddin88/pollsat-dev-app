import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { sha256 } from 'js-sha256';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    TransactionInstruction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import {
    
    SolanaKeyPair,
    DeviceSignature,
    VerificationResult,
    MerkleProof,
    DeviceAuthData,
    VoteData
} from './types';

// Key storage constants
const PRIVATE_KEY_STORAGE = 'POLLSAT_PRIVATE_KEY';
const PUBLIC_KEY_STORAGE = 'POLLSAT_PUBLIC_KEY';
const ADDRESS_STORAGE = 'POLLSAT_ADDRESS';
const SOLANA_SECRET_KEY = 'POLLSAT_SOLANA_SECRET_KEY';
const SOLANA_PUBLIC_KEY = 'POLLSAT_SOLANA_PUBLIC_KEY';

// Solana connection
const SOLANA_NETWORK = 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_NETWORK);

/**
 * Generate a new Solana key pair for blockchain authentication
 */
export const generateSolanaKeyPair = async (): Promise<SolanaKeyPair> => {
    try {
        // Check if we already have keys stored
        const storedSecretKey = await SecureStore.getItemAsync(SOLANA_SECRET_KEY);
        const storedPublicKey = await SecureStore.getItemAsync(SOLANA_PUBLIC_KEY);
        
        if (storedSecretKey && storedPublicKey) {
            return {
                secretKey: Uint8Array.from(JSON.parse(storedSecretKey)),
                publicKey: storedPublicKey
            };
        }
        
        // Generate a new Solana key pair
        const keypair = Keypair.generate();
        
        // Store keys securely
        await SecureStore.setItemAsync(SOLANA_SECRET_KEY, JSON.stringify(Array.from(keypair.secretKey)));
        await SecureStore.setItemAsync(SOLANA_PUBLIC_KEY, keypair.publicKey.toString());

        return {
            secretKey: keypair.secretKey,
            publicKey: keypair.publicKey.toString()
        };
    } catch (error) {
        console.error('Error generating Solana key pair:', error);
        throw new Error('Failed to generate Solana key pair');
    }
};

/**
 * Get the stored Solana key pair
 */
export const getSolanaKeyPair = async (): Promise<SolanaKeyPair | null> => {
    try {
        const storedSecretKey = await SecureStore.getItemAsync(SOLANA_SECRET_KEY);
        const storedPublicKey = await SecureStore.getItemAsync(SOLANA_PUBLIC_KEY);

        if (!storedSecretKey || !storedPublicKey) {
            return null;
        }

        return {
            secretKey: Uint8Array.from(JSON.parse(storedSecretKey)),
            publicKey: storedPublicKey
        };
    } catch (error) {
        console.error('Error getting Solana key pair:', error);
        return null;
    }
};

/**
 * Sign data with Solana key pair
 */
export const signWithSolana = async (data: string): Promise<string> => {
    try {
        const keyPair = await getSolanaKeyPair();

        if (!keyPair) {
            throw new Error('No Solana key pair found');
        }

        // Convert the keypair secret key to a Solana keypair
        const solanaKeypair = Keypair.fromSecretKey(keyPair.secretKey);

        // Convert data to Uint8Array
        const dataBuffer = new TextEncoder().encode(data);

        // Sign the data
        const signature = nacl.sign.detached(dataBuffer, solanaKeypair.secretKey);

        // Convert signature to base58
        return bs58.encode(signature);
    } catch (error) {
        console.error('Error signing with Solana:', error);
        throw new Error('Failed to sign data with Solana key');
    }
};

/**
 * Verify a Solana signature
 */
export const verifySolanaSignature = (
    data: string,
    signature: string,
    publicKeyStr: string
): VerificationResult => {
    try {
        // Convert data to Uint8Array
        const dataBuffer = new TextEncoder().encode(data);

        // Convert signature from base58 to Uint8Array
        const signatureBytes = bs58.decode(signature);

        // Convert public key from string to PublicKey
        const publicKey = new PublicKey(publicKeyStr);

        // Verify the signature
        const isValid = nacl.sign.detached.verify(
            dataBuffer,
            signatureBytes,
            publicKey.toBytes()
        );

        return { isValid };
    } catch (error) {
        console.error('Error verifying Solana signature:', error);
        return { isValid: false, error: 'Failed to verify Solana signature' };
    }
};

/**
 * Create a device signature for authentication using Solana
 */
export const createSolanaDeviceSignature = async (deviceId: string): Promise<DeviceSignature> => {
    try {
        // Get or generate the Solana key pair
        const keyPair = await generateSolanaKeyPair();

        // Create a timestamp
        const timestamp = Date.now();

        // Create the data to sign
        const dataToSign = `${deviceId}:${timestamp}`;

        // Sign the data
        const signature = await signWithSolana(dataToSign);

        return {
            deviceId,
            signature,
            timestamp,
            publicKey: keyPair.publicKey
        };
    } catch (error) {
        console.error('Error creating Solana device signature:', error);
        throw new Error('Failed to create Solana device signature');
    }
};

/**
 * Generate a random nonce
 */
export const generateNonce = async (): Promise<string> => {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

/**
 * Sign a vote with Solana
 */
export const signVoteWithSolana = async (
    pollId: string,
    optionId: string,
    voterId: string
): Promise<{ signature: string; voteHash: string }> => {
    try {
        // Create the vote data
        const timestamp = Date.now();
        const voteData: VoteData = {
            pollId,
            optionId,
            voterId,
            timestamp,
            voteHash: ''
        };

        // Create a string representation of the vote data
        const dataToSign = `${voterId}:${pollId}:${optionId}:${timestamp}`;

        // Create a hash of the vote data
        voteData.voteHash = sha256(dataToSign);

        // Sign the vote data
        const signature = await signWithSolana(dataToSign);

        return {
            signature,
            voteHash: voteData.voteHash
        };
    } catch (error) {
        console.error('Error signing vote with Solana:', error);
        throw new Error('Failed to sign vote with Solana');
    }
};

/**
 * Submit a memo to Solana blockchain
 */
export const submitMemoToSolana = async (memo: string): Promise<string> => {
    try {
        const keyPair = await getSolanaKeyPair();

        if (!keyPair) {
            throw new Error('No Solana key pair found');
        }

        // Convert the keypair secret key to a Solana keypair
        const solanaKeypair = Keypair.fromSecretKey(keyPair.secretKey);

        // Create a memo instruction
        const instruction = new TransactionInstruction({
            keys: [{ pubkey: solanaKeypair.publicKey, isSigner: true, isWritable: true }],
            programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
            data: Buffer.from(memo)
        });

        // Create a transaction
        const transaction = new Transaction().add(instruction);

        // Send the transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [solanaKeypair]
        );

        return signature;
    } catch (error) {
        console.error('Error submitting memo to Solana:', error);
        throw new Error('Failed to submit memo to Solana');
    }
};

/**
 * Submit a Merkle root to Solana
 */
export const submitMerkleRootToSolana = async (merkleRoot: string): Promise<string> => {
    try {
        // Create a memo with the Merkle root
        const memo = `POLLSAT_MERKLE_ROOT:${merkleRoot}`;

        // Submit the memo to Solana
        return await submitMemoToSolana(memo);
    } catch (error) {
        console.error('Error submitting Merkle root to Solana:', error);
        throw new Error('Failed to submit Merkle root to Solana');
    }
};

/**
 * Verify a transaction on Solana
 */
export const verifySolanaTransaction = async (signature: string): Promise<boolean> => {
    try {
        // Get the transaction
        const transaction = await connection.getTransaction(signature);

        if (!transaction) {
            return false;
        }

        // Check if the transaction was successful
        return transaction.meta?.err === null;
    } catch (error) {
        console.error('Error verifying Solana transaction:', error);
        return false;
    }
};

// Simplified Merkle tree implementation
class SimpleMerkleTree {
    private leaves: string[];
    private layers: string[][];

    constructor(leaves: string[]) {
        // Hash the leaves if they aren't already
        this.leaves = leaves.map(leaf =>
            leaf.length === 64 ? leaf : sha256(leaf)
        );
        this.layers = [this.leaves];
        this.buildTree();
    }

    private buildTree() {
        let currentLayer = this.leaves;

        // Build the tree by hashing pairs of nodes
        while (currentLayer.length > 1) {
            const nextLayer: string[] = [];

            // Process pairs of nodes
            for (let i = 0; i < currentLayer.length; i += 2) {
                if (i + 1 < currentLayer.length) {
                    // Hash the pair
                    const left = currentLayer[i];
                    const right = currentLayer[i + 1];
                    const hash = sha256(left + right);
                    nextLayer.push(hash);
                } else {
                    // Odd number of nodes, promote the last one
                    nextLayer.push(currentLayer[i]);
                }
            }

            this.layers.push(nextLayer);
            currentLayer = nextLayer;
        }
    }

    getRoot(): string {
        return this.layers[this.layers.length - 1][0];
    }

    getProof(leaf: string): Array<{ position: 'left' | 'right', data: string }> {
        // Hash the leaf if it's not already a hash
        const hash = leaf.length === 64 ? leaf : sha256(leaf);

        // Find the leaf in the bottom layer
        let index = this.leaves.indexOf(hash);
        if (index === -1) return [];

        const proof: Array<{ position: 'left' | 'right', data: string }> = [];

        // Build the proof by traversing up the tree
        for (let i = 0; i < this.layers.length - 1; i++) {
            const layer = this.layers[i];
            const isRight = index % 2 === 0;
            const pairIndex = isRight ? index + 1 : index - 1;

            if (pairIndex < layer.length) {
                proof.push({
                    position: isRight ? 'right' : 'left',
                    data: layer[pairIndex]
                });
            }

            // Move to the parent index
            index = Math.floor(index / 2);
        }

        return proof;
    }

    verify(proof: Array<{ position: 'left' | 'right', data: string }>, leaf: string, root: string): boolean {
        // Hash the leaf if it's not already a hash
        let hash = leaf.length === 64 ? leaf : sha256(leaf);

        // Apply each proof element
        for (const { position, data } of proof) {
            if (position === 'left') {
                hash = sha256(data + hash);
            } else {
                hash = sha256(hash + data);
            }
        }

        // Check if the resulting hash matches the root
        return hash === root;
    }
}

/**
 * Create a Merkle tree from a list of vote hashes
 */
export const createMerkleTree = (voteHashes: string[]): any => {
    // Create a Merkle tree
    return new SimpleMerkleTree(voteHashes);
};

/**
 * Generate a Merkle proof for a vote
 */
export const generateMerkleProof = (
    tree: any,
    voteHash: string
): MerkleProof => {
    // Get the proof
    const proof = tree.getProof(voteHash);

    // Convert proof to hex strings
    const proofHex = proof.map((p: any) => p.data);

    return {
        root: tree.getRoot(),
        proof: proofHex,
        leaf: voteHash,
        index: 0 // Simplified implementation doesn't track index
    };
};

/**
 * Verify a Merkle proof
 */
export const verifyMerkleProof = (merkleProof: MerkleProof): boolean => {
    const { root, proof, leaf } = merkleProof;

    // Create a temporary tree to verify the proof
    const tree = new SimpleMerkleTree([]);

    // Convert proof to the format expected by the verify method
    const formattedProof = proof.map((p, i) => ({
        position: i % 2 === 0 ? 'left' as const : 'right' as const,
        data: p
    }));

    // Verify the proof
    return tree.verify(formattedProof, leaf, root);
};

/**
 * Hash a device ID with a salt for privacy
 */
export const hashDeviceId = (deviceId: string, salt: string): string => {
    return CryptoJS.PBKDF2(deviceId, salt, {
        keySize: 256 / 32,
        iterations: 1000
    }).toString();
};