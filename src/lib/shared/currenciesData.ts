// Define a type for currencies and cryptocurrencies
export type Currency = {
    code: string;
    name: string;
    type: "fiat" | "crypto";
    symbol: string;
    flag?: string; // Optional for cryptocurrencies
};

// List of supported fiat currencies
export const currencies: Currency[] = [
    {
        type: "fiat",
        code: "INR",
        name: "Indian Rupee",
        symbol: "₹",
        flag: "🇮🇳",
    },
    {
        type: "fiat",
        code: "USD",
        name: "United States Dollar",
        symbol: "$",
        flag: "🇺🇸",
    },
    {
        type: "fiat",
        code: "GBP",
        name: "British Pound Sterling",
        symbol: "£",
        flag: "🇬🇧",
    },
    { type: "fiat", code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
    {
        type: "fiat",
        code: "CHF",
        name: "Swiss Franc",
        symbol: "Fr",
        flag: "🇨🇭",
    },
    {
        type: "fiat",
        code: "JPY",
        name: "Japanese Yen",
        symbol: "¥",
        flag: "🇯🇵",
    },
];

// List of supported cryptocurrencies
export const cryptocurrencies: Currency[] = [
    { type: "crypto", code: "ETH", name: "Ethereum", symbol: "Ξ" },
    { type: "crypto", code: "BTC", name: "Bitcoin", symbol: "₿" },
    { type: "crypto", code: "USDT", name: "Tether", symbol: "₮" },
];

// Combine all options for the dropdowns
export const currencyOptions: Currency[] = [
    ...currencies,
    ...cryptocurrencies,
];
