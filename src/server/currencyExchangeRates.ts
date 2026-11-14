"use server";

import axios from "axios";
import config from "@/config";
import { cacheData } from "@/lib/redisCache";
import { currencyOptions } from "@/lib/shared/currenciesData";


export async function convertCurrency(data: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
}) {
    const { amount, fromCurrency, toCurrency } = data;

    console.log("Converting:", amount, fromCurrency, "to", toCurrency);

    // Validate amount
    if (amount <= 0) {
        return {
            success: false,
            error: "Amount must be greater than zero.",
        };
    }

    // Check currency types
    const fromCurrencyInfo = currencyOptions.find((c) => c.code === fromCurrency);
    const toCurrencyInfo = currencyOptions.find((c) => c.code === toCurrency);

    if (!fromCurrencyInfo || !toCurrencyInfo) {
        return {
            success: false,
            error: "Invalid currency selected.",
        };
    }

    // Create cache key
    const cacheKey = `${fromCurrency}_${toCurrency}`;

    try {
        // Fiat-to-Fiat: Use ExchangeRate-API
        if (fromCurrencyInfo.type === "fiat" && toCurrencyInfo.type === "fiat") {
            const fetchExchangeRate = async () => {
                const apiKey = config.EXCHANGE_KEY;
                const response = await axios.get(
                    `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}/1`
                );

                const { result, conversion_rate, error } = response.data;

                if (result !== "success") {
                    throw new Error(error || "Failed to fetch conversion rate.");
                }

                return { exchangeRate: conversion_rate };
            };

            const { exchangeRate } = await cacheData(cacheKey, fetchExchangeRate);
            const convertedAmount = amount * exchangeRate;

            return {
                success: true,
                convertedAmount: convertedAmount,
                exchangeRate: exchangeRate,
            };
        }

        // Crypto-to-Fiat: Use CoinGecko
        if (fromCurrencyInfo.type === "crypto" || toCurrencyInfo.type === "fiat") {
            const fetchCryptoRate = async () => {
                const response = await axios.get(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${fromCurrencyInfo.name!.toLowerCase()}&vs_currencies=${toCurrency.toLowerCase()}`,
                );

                const exchangeRate = response.data[fromCurrencyInfo.name!.toLowerCase()]?.[toCurrency.toLowerCase()];

                if (!exchangeRate) {
                    throw new Error("Currency pair not supported by CoinGecko.");
                }

                return { exchangeRate };
            };

            const { exchangeRate } = await cacheData(cacheKey, fetchCryptoRate);
            const convertedAmount = amount * exchangeRate;

            return {
                success: true,
                convertedAmount: convertedAmount,
                exchangeRate: exchangeRate,
            };
        }

        // Fiat-to-Crypto: Use CoinGecko
        if (fromCurrencyInfo.type === "fiat" || toCurrencyInfo.type === "crypto") {
            const fetchCryptoRate = async () => {
                const response = await axios.get(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${fromCurrency.toLowerCase()}&vs_currencies=${toCurrency.toLowerCase()}`,
                );

                const exchangeRate = response.data[fromCurrency.toLowerCase()]?.[toCurrency.toLowerCase()];

                if (!exchangeRate) {
                    throw new Error("Currency pair not supported by CoinGecko.");
                }

                return { exchangeRate };
            };

            const { exchangeRate } = await cacheData(cacheKey, fetchCryptoRate);
            const convertedAmount = amount * exchangeRate;

            return {
                success: true,
                convertedAmount: convertedAmount,
                exchangeRate: exchangeRate,
            };
        }

        const fetchCryptoRate = async () => {
            const response = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${fromCurrencyInfo.name!.toLowerCase()}&vs_currencies=${toCurrency.toLowerCase()}`,
            );

            const exchangeRate = response.data[fromCurrencyInfo.name!.toLowerCase()]?.[toCurrency.toLowerCase()];

            if (!exchangeRate) {
                throw new Error("Currency pair not supported by CoinGecko.");
            }

            return { exchangeRate };
        };

        const { exchangeRate } = await cacheData(cacheKey, fetchCryptoRate);
        const convertedAmount = amount * exchangeRate;

        return {
            success: true,
            convertedAmount: convertedAmount,
            exchangeRate: exchangeRate,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return {
            success: false,
            error: error.message || "Failed to fetch conversion rate. Please try again.",
        };
    }
}