"use client"

import { useEffect, useState } from "react"
import { FALLBACK_RATES, fetchLiveRates, type ExchangeRates } from "@/lib/rates"

/**
 * Live rates on the client. It starts from the bundled table so the
 * server-rendered HTML and the first client render agree, then swaps in the
 * live table once (or keeps the fallback if the request fails).
 */
export function useExchangeRates(): ExchangeRates {
	const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(FALLBACK_RATES)

	useEffect(() => {
		let active = true

		fetchLiveRates().then((next) => {
			if (active) setExchangeRates(next)
		})

		return () => {
			active = false
		}
	}, [])

	return exchangeRates
}
