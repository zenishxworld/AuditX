// Real-time wallet data fetcher using Covalent, GoPlus, Etherscan, with CoinGecko fallback.
// Produces a normalized shape that WalletInspector can convert to its UI model.

export type SupportedChain = 'ethereum' | 'polygon' | 'bsc';

export interface RawTokenHolding {
  name: string;
  symbol: string;
  amount: number;
  price: number; // USD per token
  address?: string;
  logo_url?: string;
}

export interface RawWalletData {
  address: string;
  total_usd_value: number;
  first_tx_date: string | null;
  last_tx_date: string | null;
  token_holdings: RawTokenHolding[];
  chains: string[];
  riskFlags: Record<string, any> | null;
  nft_count?: number;
}

const COVALENT_API_KEY = import.meta.env.VITE_COVALENT_API_KEY as string | undefined;
const GOPLUS_API_KEY = import.meta.env.VITE_GOPLUS_API_KEY as string | undefined;
const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined;

const chainToCovalentPath: Record<SupportedChain, string> = {
  ethereum: 'eth-mainnet',
  polygon: 'polygon-mainnet',
  bsc: 'bsc-mainnet',
};

const chainToGoPlusId: Record<SupportedChain, number> = {
  ethereum: 1,
  polygon: 137,
  bsc: 56,
};

const toNumberSafe = (v: any, fallback = 0): number => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
};

// Convert a bigint amount with given decimals to a JS number using string math to preserve scale
const bigintToDecimalNumber = (value: bigint, decimals: number, precision: number = 8): number => {
  if (decimals <= 0) return Number(value);
  const base = BigInt(10) ** BigInt(decimals);
  const integer = value / base;
  const fraction = value % base;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, precision);
  const composed = fractionStr.length > 0 ? `${integer.toString()}.${fractionStr}` : integer.toString();
  const num = parseFloat(composed);
  return Number.isFinite(num) ? num : 0;
};

const fromWei = (balance: string, decimals: number): number => {
  try {
    const bn = BigInt(balance);
    const denom = BigInt(10) ** BigInt(decimals);
    const whole = Number(bn) / Number(denom);
    return whole;
  } catch {
    return 0;
  }
};

export interface FetchWalletOptions {
  analysisDepth?: 'basic' | 'standard' | 'advanced';
  dateRangeDays?: number; // for filtering tx dates
}

export async function fetchWalletData(
  address: string,
  includeNFTs: boolean,
  chain: SupportedChain = 'ethereum',
  options: FetchWalletOptions = {}
): Promise<RawWalletData> {
  const covalentChain = chainToCovalentPath[chain];
  const goPlusChainId = chainToGoPlusId[chain];
  const depth = options.analysisDepth || 'standard';
  const txPageSize = depth === 'basic' ? 25 : depth === 'advanced' ? 250 : 100;
  const dateWindowDays = Math.max(1, Math.min(3650, options.dateRangeDays || 90));

  // 1) Fetch balances (gracefully fallback if Covalent fails)
  let nftItems: any[] = [];
  let fungibleItems: any[] = [];
  let token_holdings: RawTokenHolding[] = [];
  let total_usd_value = 0;

  if (COVALENT_API_KEY) {
    try {
      const balancesUrl = `https://api.covalenthq.com/v1/${covalentChain}/address/${address}/balances_v2/?quote-currency=USD&nft=${includeNFTs ? 'true' : 'false'}&key=${COVALENT_API_KEY}`;
      const balancesRes = await fetch(balancesUrl);
      if (!balancesRes.ok) {
        console.warn(`Covalent balances_v2 failed: ${balancesRes.status}`);
      } else {
        const balancesJson = await balancesRes.json();
        const balanceItems: any[] = balancesJson?.data?.items || [];

        // Separate NFT items and fungible tokens
        nftItems = balanceItems.filter((it) => it.type?.toLowerCase() === 'nft');
        fungibleItems = balanceItems.filter((it) => it.type?.toLowerCase() !== 'nft');

        // Map token holdings
        token_holdings = fungibleItems.map((it) => {
          const decimals = Number(it.contract_decimals || 0);
          const amount = fromWei(String(it.balance ?? '0'), decimals);
          const price = toNumberSafe(it.quote_rate, 0);
          return {
            name: it.contract_name || it.contract_ticker_symbol || 'Unknown',
            symbol: it.contract_ticker_symbol || 'UNKNOWN',
            amount,
            price,
            address: it.contract_address || undefined,
            logo_url: it.logo_url || undefined,
          };
        });

        // Fill missing prices via CoinGecko if needed
        const missingPrice = token_holdings.filter((t) => !t.price && t.address);
        if (missingPrice.length > 0) {
          try {
            const addresses = missingPrice
              .map((t) => t.address)
              .filter(Boolean)
              .join(',');
            if (addresses) {
              const cgUrl = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addresses}&vs_currencies=usd`;
              const cgRes = await fetch(cgUrl);
              if (cgRes.ok) {
                const cgJson = await cgRes.json();
                // Update prices where available
                token_holdings = token_holdings.map((t) => {
                  if (!t.price && t.address) {
                    const key = t.address.toLowerCase();
                    const entry = cgJson[key];
                    if (entry && entry.usd) {
                      return { ...t, price: toNumberSafe(entry.usd, 0) };
                    }
                  }
                  return t;
                });
              }
            }
          } catch (cgErr) {
            console.warn('CoinGecko fallback error', cgErr);
          }
        }

        // Compute total USD via Covalent 'quote' when available, else derived price*amount
        if (fungibleItems.length > 0) {
          total_usd_value = fungibleItems.reduce((sum, it) => sum + toNumberSafe(it.quote, 0), 0);
        }
        if (!total_usd_value) {
          total_usd_value = token_holdings.reduce((sum, t) => sum + (t.amount * (t.price || 0)), 0);
        }
      }
    } catch (balErr) {
      console.warn('Covalent balances_v2 error', balErr);
    }
  } else {
    console.warn('VITE_COVALENT_API_KEY missing; skipping Covalent balances');
  }

  // 2) Fetch transactions (skip if Covalent unavailable)
  let first_tx_date: string | null = null;
  let last_tx_date: string | null = null;
  if (COVALENT_API_KEY) {
    try {
      const txUrl = `https://api.covalenthq.com/v1/${covalentChain}/address/${address}/transactions_v3/?page-size=${txPageSize}&key=${COVALENT_API_KEY}`;
      const txRes = await fetch(txUrl);
      if (txRes.ok) {
        const txJson = await txRes.json();
        const txItems: any[] = txJson?.data?.items || [];
        const now = Date.now();
        const windowStartMs = now - dateWindowDays * 24 * 60 * 60 * 1000;
        const dates = txItems
          .map((t) => new Date(t.signed_at))
          .filter((d) => !isNaN(d.getTime()) && d.getTime() >= windowStartMs);
        if (dates.length > 0) {
          dates.sort((a, b) => a.getTime() - b.getTime());
          first_tx_date = dates[0].toISOString();
          last_tx_date = dates[dates.length - 1].toISOString();
        }
      } else {
        console.warn(`Covalent transactions_v3 failed: ${txRes.status}`);
      }
    } catch (txErr) {
      console.warn('Covalent transactions_v3 error', txErr);
    }
  }

  // 3) GoPlus address security
  let riskFlags: Record<string, any> | null = null;
  if (GOPLUS_API_KEY) {
    try {
      const gpUrl = `https://api.gopluslabs.io/api/v1/address_security/${goPlusChainId}?address=${address}`;
      const gpRes = await fetch(gpUrl, {
        headers: {
          'X-API-KEY': GOPLUS_API_KEY,
          'API-KEY': GOPLUS_API_KEY,
        },
      });
      if (gpRes.ok) {
        const gpJson = await gpRes.json();
        // result may be keyed by address
        const result = gpJson?.result;
        riskFlags = result?.[address.toLowerCase()] || result || null;
      } else {
        console.warn(`GoPlus address_security failed: ${gpRes.status}`);
      }
    } catch (gpErr) {
      console.warn('GoPlus address_security error', gpErr);
    }
  }

  // 4) Fallback ETH balance via Etherscan if no tokens were found
  if ((!token_holdings || token_holdings.length === 0) && ETHERSCAN_API_KEY && chain === 'ethereum') {
    try {
      const esUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
      const esRes = await fetch(esUrl);
      if (esRes.ok) {
        const esJson = await esRes.json();
        const wei = String(esJson?.result ?? '0');
        const ethAmount = fromWei(wei, 18);
        token_holdings = [
          {
            name: 'Ethereum',
            symbol: 'ETH',
            amount: ethAmount,
            price: 0, // could be filled via CoinGecko; keeping 0 to avoid extra calls
          },
        ];
      }
    } catch {
      // ignore etherscan fallback
    }
  }

  // 5) Ultimate fallback without API keys: use public RPC for ETH balance and CoinGecko for ETH price
  if ((!token_holdings || token_holdings.length === 0) && chain === 'ethereum') {
    try {
      // Cloudflare public Ethereum RPC
      const rpcRes = await fetch('https://cloudflare-eth.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
      });
      if (rpcRes.ok) {
        const rpcJson = await rpcRes.json();
        const hexBalance = (rpcJson?.result as string) || '0x0';
        const wei = BigInt(hexBalance);
        const ethAmount = bigintToDecimalNumber(wei, 18, 8);
        token_holdings = [
          {
            name: 'Ethereum',
            symbol: 'ETH',
            amount: Number.isFinite(ethAmount) ? ethAmount : 0,
            price: 0,
          },
        ];

        // Try to fetch ETH USD price
        try {
          const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
          if (priceRes.ok) {
            const priceJson = await priceRes.json();
            const ethUsd = toNumberSafe(priceJson?.ethereum?.usd, 0);
            token_holdings = token_holdings.map((t) => ({ ...t, price: t.symbol === 'ETH' ? ethUsd : t.price }));
          }
        } catch {
          // ignore price fetch failure
        }

        // Compute total if still zero
        if (!total_usd_value) {
          total_usd_value = token_holdings.reduce((sum, t) => sum + (t.amount * (t.price || 0)), 0);
        }
      }
    } catch {
      // last-resort fallback failed; leave as-is
    }
  }

  return {
    address,
    total_usd_value: Number(total_usd_value.toFixed(2)),
    first_tx_date,
    last_tx_date,
    token_holdings,
    chains: [chain],
    riskFlags,
    nft_count: nftItems.length || 0,
  };
}