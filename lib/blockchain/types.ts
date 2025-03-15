export interface KeyPair {
    privateKey: string;
    publicKey: string;
    address: string;
}

export interface SolanaKeyPair {
    secretKey: Uint8Array;
    publicKey: string;
}

export interface DeviceSignature {
    deviceId: string;
    signature: string;
    timestamp: number;
    publicKey: string;
}

export interface BlockchainAuthResponse {
    success: boolean;
    keyPair?: KeyPair;
    solanaKeyPair?: SolanaKeyPair;
    signature?: DeviceSignature;
    error?: string;
    existing?: boolean;
}

export interface VerificationResult {
    isValid: boolean;
    error?: string;
}

export interface MerkleProof {
    root: string;
    proof: string[];
    leaf: string;
    index: number;
}

export interface DeviceAuthData {
    deviceId: string;
    publicKey: string;
    timestamp: number;
    nonce: string;
}

export interface SolanaTransaction {
    signature: string;
    slot: number;
    timestamp: number;
    confirmations: number;
}

export interface VoteData {
    pollId: string;
    optionId: string;
    voterId: string;
    timestamp: number;
    voteHash: string;
}