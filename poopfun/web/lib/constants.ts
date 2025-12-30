// Frontend constants
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// UI constants
export const TOKEN_IMAGE_PLACEHOLDER = '💩';

// Navigation
export const NAV_ITEMS = [
  { name: 'Explore', href: '/' },
  { name: 'Create', href: '/create' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Docs', href: '/docs' },
];