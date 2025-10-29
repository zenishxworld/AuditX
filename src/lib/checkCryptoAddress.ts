// Lightweight client for CheckCryptoAddress API
// Docs: https://checkcryptoaddress.com/api-docs

export type CCANetworkSymbol = 'eth' | 'btc' | 'bsc' | 'matic';

const CCA_API_BASE = 'https://api.checkcryptoaddress.com';
const CCA_API_KEY = import.meta.env.VITE_CHECKCRYPTO_API_KEY as string | undefined;

export interface CCAValidationResult {
  // Flexible shape; different chains may return different fields
  valid?: boolean;
  isValid?: boolean;
  address?: string;
  network?: string;
  checksumValid?: boolean;
  errors?: string[];
  warnings?: string[];
  [key: string]: any;
}

export const chainToCCANetwork: Record<'ethereum' | 'polygon' | 'bsc', CCANetworkSymbol> = {
  ethereum: 'eth',
  polygon: 'matic',
  bsc: 'bsc',
};

export async function validateAddressCCA(address: string, chain: 'ethereum' | 'polygon' | 'bsc'): Promise<CCAValidationResult | null> {
  if (!CCA_API_KEY) {
    console.warn('VITE_CHECKCRYPTO_API_KEY missing; skipping CCA validation');
    return null;
  }
  const network = chainToCCANetwork[chain];
  try {
    const res = await fetch(`${CCA_API_BASE}/wallet-checks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': CCA_API_KEY,
      },
      body: JSON.stringify({ address, network }),
    });
    if (!res.ok) {
      console.warn(`CCA wallet-checks failed: ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json as CCAValidationResult;
  } catch (e) {
    console.warn('CCA validation error', e);
    return null;
  }
}