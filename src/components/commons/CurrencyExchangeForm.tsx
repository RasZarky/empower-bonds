/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState } from "react"
import * as z from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Currency, currencyOptions } from "@/lib/shared/currenciesData"

// Static USD-base rates so the converter works on the exported demo site,
// where there is no server to call an exchange-rate API.
const DEMO_USD_RATES: Record<string, number> = {
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

function convertCurrency({
	amount,
	fromCurrency,
	toCurrency,
}: {
	amount: number
	fromCurrency: string
	toCurrency: string
}): { success: boolean; convertedAmount?: number; error?: string } {
	const from = DEMO_USD_RATES[fromCurrency] ?? 1
	const to = DEMO_USD_RATES[toCurrency] ?? 1
	return { success: true, convertedAmount: (amount * from) / to }
}

// Zod schema for form validation
export const currencyExchangeSchema = z.object({
	amount: z.coerce
		.number<number>()
		.gt(0, { message: "Amount must be greater than 0." })
		.min(0.0001, {
			message: "Amount must be at least 0.0001 for crypto conversions.",
		}),
	fromCurrency: z.string().nonempty({ message: "Please select a currency." }),
	toCurrency: z.string().nonempty({ message: "Please select a currency." }),
})

type FormValues = z.infer<typeof currencyExchangeSchema>

interface DropdownProps {
	options: Currency[]
	value: string
	onChange: (value: string) => void
	placeholder: string
	onBlur: (e: React.FocusEvent<HTMLButtonElement>) => void
	name?: string
	error?: { message?: string }
}

const Dropdown: React.FC<DropdownProps> = ({
	options,
	value,
	onChange,
	placeholder,
	onBlur,
	error,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [searchValue, setSearchValue] = useState("")
	const filteredOptions = options.filter(
		(option) =>
			option.name.toLowerCase().includes(searchValue.toLowerCase()) ||
			option.code.toLowerCase().includes(searchValue.toLowerCase())
	)
	const selectedOption = options.find((option) => option.code === value)

	return (
		<div className="relative w-full">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				onBlur={onBlur}
				className={`w-full text-left bg-gray-90 p-3 rounded-md border-[0.5px] ${
					error ? "border-red-500" : "border-gray-50"
				}`}
			>
				<div className="flex items-center">
					{selectedOption ? (
						<div className="flex items-center space-x-2">
							<span className="text-sm md:text-2xl rounded-full">
								{selectedOption.flag}
							</span>
							<div className="flex flex-col">
								<span className="text-white font-medium text-xs uppercase">
									{selectedOption.code}
								</span>
								<span className="text-gray-20 text-[9px] line-clamp-1">
									{selectedOption.name}
								</span>
							</div>
						</div>
					) : (
						<span className="text-gray-400 text-xs md:text-sm">{placeholder}</span>
					)}
				</div>
			</button>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
						className="absolute z-10 w-full mt-2 bg-gray-90 border border-gray-50 rounded-md shadow-lg max-h-60 overflow-y-auto"
					>
						<input
							type="text"
							placeholder="Search..."
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							className="w-full p-2 bg-gray-80 border-b border-gray-50 focus:outline-none !text-xs md:text-sm font-medium"
						/>
						{filteredOptions.map((option) => (
							<button
								type="button"
								key={option.code}
								onClick={() => {
									onChange(option.code)
									setIsOpen(false)
									setSearchValue("")
								}}
								className="w-full text-left p-3 hover:bg-gray-70 transition-colors duration-200"
							>
								<div className="flex items-center space-x-2">
									<span className="text-sm md:text-2xl rounded-full">
										{option.flag}
									</span>
									<div className="flex flex-col">
										<span className="text-white font-semibold text-xs uppercase">
											{option.code}
										</span>
										<span className="text-gray-400 text-[9px] line-clamp-1">
											{option.name}
										</span>
									</div>
								</div>
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
			{error && (
				<p className="text-red-500 text-xs mt-1">{error.message}</p>
			)}
		</div>
	)
}

const CurrencyExchangeForm: React.FC = () => {
	const [convertedAmount, setConvertedAmount] = useState<number | undefined>()
	const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(currencyExchangeSchema),
		defaultValues: {
			amount: 0,
			fromCurrency: "",
			toCurrency: "",
		},
	})

	const onSubmit = async (data: FormValues) => {
		setIsLoading(true)
		setErrorMessage(null)
		setConvertedAmount(undefined)

		const result = convertCurrency({
			amount: data.amount,
			fromCurrency: data.fromCurrency,
			toCurrency: data.toCurrency,
		})

		if (result.success) {
			setConvertedAmount(result.convertedAmount)
		} else {
			setErrorMessage(result.error || "Failed to fetch conversion rate.")
		}
		setIsLoading(false)
	}

	return (
		<div className="bg-gray-90 text-white font-sans flex items-center justify-center">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="w-full space-y-6"
			>
				<CurrencySelection
					control={control}
					errors={errors}
				/>
				<AmountSection
					control={control}
					errors={errors}
					isLoading={isLoading}
					convertedAmount={convertedAmount}
				/>
				{errorMessage && (
					<p className="text-center text-red-500 text-[11px] font-medium tracking-wider mt-1">
						{errorMessage}
					</p>
				)}
				<SubmitButton />
			</form>
		</div>
	)
}

const CurrencySelection = ({
	control,
	errors,
}: {
	control: any
	errors: any
}) => (
	<div className="grid grid-cols-2 gap-4">
		<div className="flex flex-col">
			<Controller
				name="fromCurrency"
				control={control}
				render={({ field }) => (
					<Dropdown
						options={currencyOptions}
						value={field.value}
						onChange={field.onChange}
						onBlur={field.onBlur}
						placeholder="Select currency"
						name={field.name}
						error={errors.fromCurrency}
					/>
				)}
			/>
		</div>
		<div className="flex flex-col">
			<Controller
				name="toCurrency"
				control={control}
				render={({ field }) => (
					<Dropdown
						options={currencyOptions}
						value={field.value}
						onChange={field.onChange}
						onBlur={field.onBlur}
						placeholder="Select currency"
						name={field.name}
						error={errors.toCurrency}
					/>
				)}
			/>
		</div>
	</div>
)

const AmountSection = ({
	control,
	errors,
	isLoading,
	convertedAmount,
}: {
	control: any
	errors: any
	isLoading: boolean
	convertedAmount?: number
}) => (
	<div className="grid grid-cols-2 gap-4">
		<div className="flex flex-col">
			<label
				htmlFor="amount"
				className="text-[10px] font-medium text-gray-400 mb-2"
			>
				Amount
			</label>
			<input
				type="number"
				id="amount"
				{...control.register("amount")}
				className={`text-xs md:text-sm bg-gray-90 p-3 rounded-md border-[0.5px] focus:outline-none focus:ring-2 focus:ring-green-80 ${
					errors.amount ? "border-red-500" : "border-gray-50"
				}`}
				placeholder="Enter amount"
			/>
			{errors.amount && (
				<p className="text-red-500 text-[11px] mt-1 font-medium tracking-wider">
					{errors.amount.message}
				</p>
			)}
		</div>
		<div className="flex flex-col">
			<label
				htmlFor="result"
				className="text-[10px] font-medium text-gray-400 mb-2"
			>
				Converted Amount
			</label>
			<div className="text-xs md:text-sm bg-gray-90 p-3 rounded-md border-[0.5px] border-gray-50 flex items-center justify-between">
				<span>
					{isLoading
						? "Loading..."
						: convertedAmount?.toFixed(2) || "0.00"}
				</span>
			</div>
		</div>
	</div>
)

const SubmitButton = () => (
	<div className="flex items-center justify-center mt-6">
		<button
			type="submit"
			className="cursor-pointer bg-green-90 text-green-80 text-sm font-medium py-3 px-8 rounded-full hover:bg-green-80 hover:text-green-90 transition-colors duration-300 flex items-center justify-center space-x-2 w-full max-w-sm"
		>
			<span>Exchange</span>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				className="w-5 h-5 ml-2"
			>
				<path
					fillRule="evenodd"
					d="M16.72 7.72a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 11-1.06-1.06l2.47-2.47H3a.75.75 0 010-1.5h16.19l-2.47-2.47a.75.75 0 010-1.06z"
					clipRule="evenodd"
				/>
			</svg>
		</button>
	</div>
)

export default CurrencyExchangeForm
