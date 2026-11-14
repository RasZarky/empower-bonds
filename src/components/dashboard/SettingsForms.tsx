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
import { Timezones } from "@/lib/timezones"
import { formatDateTime } from "@/lib/format"
import {
	createPreferenceAction,
	updatePreferenceAction,
	updateUserAction,
} from "@/server/action/userAction"
import {
	terminateAllOtherSessionsAction,
	terminateSessionAction,
} from "@/server/action/settingsAction"
import type { Preference, Session } from "@/types/db"

const currencies = ["USD", "EUR", "GBP", "NGN", "CAD"] as const

const controlClassName =
	"h-9 w-full rounded-full border-[0.5px] border-gray-80 bg-gray-90 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-80"

const profileSchema = z.object({
	name: z.string().min(2, { message: "Name must be at least 2 characters." }),
})

const preferenceSchema = z.object({
	currency: z.enum(currencies),
	timezone: z.string().min(1, { message: "Select a timezone." }),
	hideBalances: z.boolean(),
})

type ProfileValues = z.infer<typeof profileSchema>
type PreferenceValues = z.infer<typeof preferenceSchema>

interface SettingsFormsProps {
	userId: string
	currentSessionId: string
	name: string
	email: string
	preference: Preference | null
	sessions: Session[]
	demo?: boolean
}

export default function SettingsForms({
	userId,
	currentSessionId,
	name,
	email,
	preference,
	sessions,
	demo = false,
}: SettingsFormsProps) {
	const router = useRouter()
	const [pending, startTransition] = useTransition()

	const profileForm = useForm<ProfileValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: { name },
	})

	const preferenceForm = useForm<PreferenceValues>({
		resolver: zodResolver(preferenceSchema),
		defaultValues: {
			currency: (currencies as readonly string[]).includes(preference?.currency ?? "")
				? (preference?.currency as PreferenceValues["currency"])
				: "USD",
			timezone: preference?.timezone ?? "UTC",
			hideBalances: preference?.hideBalances ?? false,
		},
	})

	const saveProfile = (values: ProfileValues) => {
		startTransition(async () => {
			const result = await updateUserAction(userId, { name: values.name })

			if (result.success) {
				toast.success("Profile updated")
				router.refresh()
			} else {
				toast.error(result.error || "Could not update profile", {
					description: result.message,
				})
			}
		})
	}

	const savePreferences = (values: PreferenceValues) => {
		startTransition(async () => {
			if (!preference) {
				const created = await createPreferenceAction(userId)

				if (!created.success) {
					toast.error(created.error || "Could not create preferences", {
						description: created.message,
					})
					return
				}
			}

			const result = await updatePreferenceAction(userId, {
				currency: values.currency,
				timezone: values.timezone,
				hideBalances: values.hideBalances,
			})

			if (result.success) {
				toast.success("Preferences saved")
				router.refresh()
			} else {
				toast.error(result.error || "Could not save preferences", {
					description: result.message,
				})
			}
		})
	}

	const endSession = (sessionId: string) => {
		startTransition(async () => {
			const result = await terminateSessionAction(userId, sessionId)

			if (result.success) {
				toast.success("Session signed out")
				router.refresh()
			} else {
				toast.error(result.error || "Could not end session")
			}
		})
	}

	const endOtherSessions = () => {
		startTransition(async () => {
			const result = await terminateAllOtherSessionsAction(userId, currentSessionId)

			if (result.success) {
				toast.success("Other sessions signed out", {
					description: `${result.data?.count ?? 0} session(s) terminated.`,
				})
				router.refresh()
			} else {
				toast.error(result.error || "Could not end sessions")
			}
		})
	}

	return (
		<div className="space-y-8">
			{demo && (
				<p className="rounded-xl border-[0.5px] border-green-80/30 bg-green-80/5 px-6 py-4 text-xs text-gray-20">
					Demo mode — these forms show sample values and cannot be saved.
				</p>
			)}
			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
				<div className="flex flex-col gap-1 pb-6">
					<h2 className="text-lg font-semibold text-white">Profile</h2>
					<p className="text-xs text-gray-30">Your name appears on statements and emails.</p>
				</div>

				<Form {...profileForm}>
					<form
						onSubmit={profileForm.handleSubmit(saveProfile)}
						className="grid grid-cols-1 sm:grid-cols-2 gap-4"
					>
						<FormField
							control={profileForm.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Full name</FormLabel>
									<FormControl>
										<Input
											className="rounded-full bg-gray-90 border-[0.5px] border-gray-80 placeholder:text-gray-60"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex flex-col gap-2">
							<span className="text-sm font-medium">Email</span>
							<Input
								value={email}
								readOnly
								disabled
								className="rounded-full bg-gray-80 border-[0.5px] border-gray-70 text-gray-30"
							/>
						</div>

						<div className="sm:col-span-2 flex justify-end">
							<button
								type="submit"
								disabled={pending || demo}
								className="default-button disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{pending ? "Saving…" : "Save profile"}
							</button>
						</div>
					</form>
				</Form>
			</section>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
				<div className="flex flex-col gap-1 pb-6">
					<h2 className="text-lg font-semibold text-white">Preferences</h2>
					<p className="text-xs text-gray-30">
						Choose how balances and dates are shown across your dashboard.
					</p>
				</div>

				{!preference && (
					<p className="pb-4 text-xs text-gray-30">
						You do not have a preference profile yet — saving will create one.
					</p>
				)}

				<Form {...preferenceForm}>
					<form
						onSubmit={preferenceForm.handleSubmit(savePreferences)}
						className="grid grid-cols-1 sm:grid-cols-2 gap-4"
					>
						<FormField
							control={preferenceForm.control}
							name="currency"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Display currency</FormLabel>
									<FormControl>
										<select className={controlClassName} {...field}>
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
							control={preferenceForm.control}
							name="timezone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Timezone</FormLabel>
									<FormControl>
										<select className={controlClassName} {...field}>
											{Timezones.map((timezone) => (
												<option key={timezone.value} value={timezone.value}>
													{timezone.label}
												</option>
											))}
										</select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={preferenceForm.control}
							name="hideBalances"
							render={({ field }) => (
								<FormItem className="flex items-center gap-3 sm:col-span-2">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={(checked) => field.onChange(checked === true)}
										/>
									</FormControl>
									<FormLabel>Hide balances by default</FormLabel>
								</FormItem>
							)}
						/>

						<div className="sm:col-span-2 flex justify-end">
							<button
								type="submit"
								disabled={pending || demo}
								className="default-button disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{pending ? "Saving…" : "Save preferences"}
							</button>
						</div>
					</form>
				</Form>
			</section>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
				<div className="flex flex-wrap items-center justify-between gap-4 pb-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-semibold text-white">Security</h2>
						<p className="text-xs text-gray-30">
							Devices currently signed in to your account.
						</p>
					</div>
					{sessions.length > 0 && (
						<button
							type="button"
							onClick={endOtherSessions}
							disabled={pending || demo}
							className="default-button-alt disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Sign out other sessions
						</button>
					)}
				</div>

				{sessions.length === 0 ? (
					<p className="text-sm text-gray-20">No other active sessions.</p>
				) : (
					<ul className="divide-y divide-gray-70 border-t border-gray-70">
						{sessions.map((item) => (
							<li
								key={item.id}
								className="flex flex-wrap items-center justify-between gap-4 py-4"
							>
								<div className="flex flex-col gap-1 min-w-0">
									<span className="text-sm text-white truncate">
										{item.userAgent || "Unknown device"}
									</span>
									<span className="text-[10px] text-gray-30">
										{item.ipAddress || "Unknown IP"} · signed in{" "}
										{formatDateTime(item.createdAt)}
									</span>
								</div>
								<button
									type="button"
									onClick={() => endSession(item.id)}
									disabled={pending || demo}
									className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Sign out
								</button>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	)
}
