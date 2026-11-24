/**
 * Exchange rates for the exported demo site.
 *
 * The bundled USD-base table is the offline fallback. On the client the site
 * asks a keyless endpoint (open.er-api.com, daily ECB-style snapshot, CORS open)
 * for today's rates once per page load, and keeps the table if that fails.
 * Crypto rates are not in the fiat feed, so they always come from the table.
 */
export const DEMO_USD_RATES: Record<string, number> = {
	USD: 1,
	EUR: 1.08,
	GBP: 1.27,
	CAD: 0.74,
	AUD: 0.66,
	NGN: 0.00065,
	JPY: 0.0065,
	CNY: 0.14,
	INR: 0.012,
	ZAR: 0.055,
	KES: 0.0078,
	GHS: 0.066,
	BTC: 68000,
	ETH: 3200,
	USDT: 1,
	BNB: 600,
	SOL: 150,
	XRP: 0.6,
	ADA: 0.5,
	DOGE: 0.16,
}

export type RateTable = Record<string, number>

export interface ExchangeRates {
	rates: RateTable
	/** True when the table came from the live endpoint instead of the fallback. */
	live: boolean
	/** The provider's own timestamp for the live table, when it reports one. */
	updatedAt: string | null
}

export const FALLBACK_RATES: ExchangeRates = {
	rates: DEMO_USD_RATES,
	live: false,
	updatedAt: null,
}

/** Converts `amount` between two currencies using the given USD-base table. */
export function convertAmount(
	amount: number,
	fromCurrency: string,
	toCurrency: string,
	rates: RateTable = DEMO_USD_RATES
): number {
	const from = rates[fromCurrency] ?? 1
	const to = rates[toCurrency] ?? 1
	return (amount * from) / to
}

const LIVE_RATES_URL = "https://open.er-api.com/v6/latest/USD"

// Memoised so several components on one page share a single network request.
let pending: Promise<ExchangeRates> | null = null

export function fetchLiveRates(): Promise<ExchangeRates> {
	if (!pending) {
		pending = (async () => {
			try {
				const response = await fetch(LIVE_RATES_URL, { cache: "no-store" })
				if (!response.ok) throw new Error(`Exchange-rate request failed: ${response.status}`)

				const data = (await response.json()) as {
					result?: string
					rates?: RateTable
					time_last_update_utc?: string
				}

				if (data.result !== "success" || !data.rates) {
					throw new Error("Unexpected exchange-rate response")
				}

				// The feed quotes X per 1 USD (`{ EUR: 0.9156 }`), while this table stores
				// USD per 1 unit of X, so invert it before merging.
				const usdPerUnit: RateTable = { ...DEMO_USD_RATES }
				for (const [code, perUsd] of Object.entries(data.rates)) {
					if (typeof perUsd === "number" && perUsd > 0) usdPerUnit[code] = 1 / perUsd
				}
				usdPerUnit.USD = 1

				return {
					rates: usdPerUnit,
					live: true,
					updatedAt: data.time_last_update_utc ?? null,
				}
			} catch {
				// Reset so a later mount can try again instead of caching the failure.
				pending = null
				return FALLBACK_RATES
			}
		})()
	}

	return pending
}
