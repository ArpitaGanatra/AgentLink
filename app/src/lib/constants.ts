// AgentLink Program Constants

export const PROGRAM_ID = '3guFi1GbjiSKxVvsG5mQhP34vHYWBhUX98TibcoRHKZD';

// Solana cluster URLs
export const CLUSTERS = {
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
} as const;

// On-chain constants (matching lib.rs)
export const MAX_NAME_LENGTH = 32;
export const MAX_JOB_ID_LENGTH = 36;
export const LAMPORTS_PER_SOL = 1_000_000_000;
export const MAX_SPLIT_BPS = 5000;
export const DEFAULT_SPLIT_BPS = 1000;
export const VERIFICATION_THRESHOLD = 3;

// Job status values (matching on-chain enum)
export const STATUS_OPEN = 0;
export const STATUS_IN_PROGRESS = 1;
export const STATUS_PENDING_APPROVAL = 2;
export const STATUS_COMPLETED = 3;
export const STATUS_DISPUTED = 4;
export const STATUS_CANCELLED = 5;

// Convert SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

// Convert lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}
