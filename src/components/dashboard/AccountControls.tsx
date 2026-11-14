"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import * as z from "zod"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
	createBankAccountAction,
	updateBankAccountAction,
} from "@/server/action/userAction"

const accountTypes = [
	{ value: "checking", label: "Checking" },
	{ value: "savings", label: "Savings" },
	{ value: "current", label: "Current" },
	{ value: "fixed_deposit", label: "Fixed deposit" },
	{ value: "investment", label: "Investment" },
] as const

const currencies = ["USD", "EUR", "GBP", "NGN"] as const

const createAccountSchema = z.object({
	accountName: z.string().min(2, { message: "Give the account a name." }),
	accountType: z.enum(["checking", "savings", "current", "fixed_deposit", "investment"]),
	currency: z.enum(currencies),
	isPrimary: z.boolean(),
})

type CreateAccountValues = z.infer<typeof createAccountSchema>

const selectClassName =
	"h-9 w-full rounded-full border-[0.5px] border-gray-80 bg-gray-90 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-80"

export function CreateAccountForm({ userId, demo = false }: { userId: string; demo?: boolean }) {
	const router = useRouter()
	const [pending, startTransition] = useTransition()

	const form = useForm<CreateAccountValues>({
		resolver: zodResolver(createAccountSchema),
		defaultValues: {
			accountName: "",
			accountType: "checking",
			currency: "USD",
			isPrimary: false,
		},
	})

	const onSubmit = (values: CreateAccountValues) => {
		startTransition(async () => {
			const result = await createBankAccountAction(userId, {
				accountType: values.accountType,
				accountName: values.accountName,
				currency: values.currency,
				isPrimary: values.isPrimary,
			})

			if (result.success) {
				toast.success("Account created", {
					description: `${values.accountName} is ready to use.`,
				})
				form.reset()
				router.refresh()
			} else {
				toast.error(result.error || "Could not create account", {
					description: result.message,
				})
			}
		})
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="grid grid-cols-1 sm:grid-cols-2 gap-4"
			>
				<FormField
					control={form.control}
					name="accountName"
					render={({ field }) => (
						<FormItem className="sm:col-span-2">
							<FormLabel>Account name</FormLabel>
							<FormControl>
								<Input
									className="rounded-full bg-gray-90 border-[0.5px] border-gray-80 placeholder:text-gray-60"
									placeholder="My main checking"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="accountType"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Account type</FormLabel>
							<FormControl>
								<select className={selectClassName} {...field}>
									{accountTypes.map((type) => (
										<option key={type.value} value={type.value}>
											{type.label}
										</option>
									))}
								</select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="currency"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Currency</FormLabel>
							<FormControl>
								<select className={selectClassName} {...field}>
									{currencies.map((currency) => (
										<option key={currency} value={currency}>
											{currency}
										</option>
									))}
								</select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="isPrimary"
					render={({ field }) => (
						<FormItem className="flex items-center gap-3 sm:col-span-2">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => field.onChange(checked === true)}
								/>
							</FormControl>
							<FormLabel>Make this my primary account</FormLabel>
						</FormItem>
					)}
				/>

				{demo && (
					<p className="sm:col-span-2 text-xs text-gray-30">
						Demo mode — accounts cannot be created here.
					</p>
				)}

				<div className="sm:col-span-2 flex justify-end pt-2">
					<button
						type="submit"
						disabled={pending || demo}
						className="default-button disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{pending ? "Creating…" : "Open account"}
					</button>
				</div>
			</form>
		</Form>
	)
}

export function SetPrimaryButton({
	userId,
	accountId,
	demo = false,
}: {
	userId: string
	accountId: string
	demo?: boolean
}) {
	const router = useRouter()
	const [pending, startTransition] = useTransition()

	const handleClick = () => {
		startTransition(async () => {
			const result = await updateBankAccountAction(userId, accountId, {
				isPrimary: true,
			})

			if (result.success) {
				toast.success("Primary account updated")
				router.refresh()
			} else {
				toast.error(result.error || "Could not update account", {
					description: result.message,
				})
			}
		})
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={pending || demo}
			className="text-xs font-medium text-green-80 hover:text-green-70 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{pending ? "Updating…" : "Set as primary"}
		</button>
	)
}
