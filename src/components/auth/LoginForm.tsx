/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useEffect, useTransition } from "react"
import FormSection from "./FormSection"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import config from "@/config"
import { useForm } from "react-hook-form"
import { useZustand } from "@/hooks/useZustand"
import { FaEye, FaEyeSlash } from "react-icons/fa6"
import Link from "next/link"
import { Checkbox } from "../ui/checkbox"
import { startDemoSession } from "@/server/action/demoAction"

export const LoginSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters long" }),
	rememberMe: z.boolean(),
})

function FormComponent() {
	const { setUser } = useZustand()
	const [viewPassword, setViewPassword] = React.useState(false)
	const [checked, setChecked] = React.useState(false)
	const router = useRouter()
	const [pending, startTransition] = useTransition()

	const form = useForm<z.infer<typeof LoginSchema>>({
		resolver: zodResolver(LoginSchema),
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
		},
	})

	useEffect(() => {
		if (
			!PublicKeyCredential.isConditionalMediationAvailable ||
			!PublicKeyCredential.isConditionalMediationAvailable()
		) {
			return
		}

		void authClient.signIn.passkey({
			autoFill: true,
			fetchOptions: {
				onSuccess() {
					toast.success("Authenticated", {
						description: "You have successfully logged in!",
					})
					router.push("/dashboard") // Redirect to login page
				},
				onError(context) {
					toast.error(
						context.error.name || "Passkey Authentication Error",
						{
							description:
								context.error.message ||
								"Passkey Authentication failed",
						}
					)
				},
			},
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleSubmit = async (data: z.infer<typeof LoginSchema>) => {
		// Handle registration logic here
		try {
			LoginSchema.parse(data) // Validate data against the schema
			// Simulate registration logic
			await authClient.signIn.email(
				{
					email: data.email,
					password: data.password,
					rememberMe: checked,
					callbackURL: `${config.BASE_URL}/dashboard`,
				},
				{
					onSuccess(context) {
						startTransition(() => {
							setUser(context.data.user) // Assuming setUser is a function to set the user state
							// Simulate registration success
							toast.success("Authenticated", {
								description: "You have successfully logged in!",
							})

							router.push("/dashboard") // Redirect to login page
						})
					},
					onError(context) {
						setUser(null) // Clear user state on error
						toast.error(
							context.error.name || "Authentication Error",
							{
								description:
									context.error.message ||
									"Authentication failed",
							}
						)
					},
				}
			)
		} catch (error: any) {
			toast.error("Authentication Error", {
				description: error.message || "Authentication failed",
			})
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="relative z-30 grid grid-cols-1 lg:grid-cols-2 gap-6"
			>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									className="rounded-full bg-gray-90 border-[0.5px] border-gray-80 placeholder:text-gray-60"
									autoFocus={true}
									type="email"
									autoComplete="off"
									placeholder="john@example.com"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl className="relative">
								<div className="relative">
									<Input
										className="rounded-full bg-gray-90 border-[0.5px] border-gray-80 placeholder:text-gray-60"
										type={
											viewPassword ? "text" : "password"
										}
										autoComplete="current-password webauthn"
										placeholder="••••••••"
										{...field}
									/>
									<button
										className="absolute cursor-pointer top-1.5 right-3"
										onClick={() =>
											setViewPassword(!viewPassword)
										}
										type="button"
									>
										{viewPassword ? (
											<FaEye className="w-5 h-auto" />
										) : (
											<FaEyeSlash className="w-5 h-auto" />
										)}
									</button>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="rememberMe"
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					render={({ field }) => (
						<FormItem className="flex items-center gap-4 lg:col-span-2 mx-auto">
							<FormControl className="relative">
								<Checkbox
									defaultChecked={checked}
									onClick={() => setChecked(!checked)}
								/>
							</FormControl>
							<FormLabel>Remember Me?</FormLabel>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex flex-col items-center w-full lg:col-span-2 gap-4 pt-8">
					<Link
						href="/auth/forgot-password"
						className="font-medium text-sm cursor-pointer text-white underline"
					>
						Forgot Password
					</Link>
					<button
						disabled={pending}
						type="submit"
						className="default-button mx-auto max-w-[260px] w-full"
					>
						{pending ? "Submitting" : "Sign In"}
					</button>
					<button
						onClick={() => router.push("/auth/register")}
						className="default-button-alt mx-auto max-w-[260px] w-full hover:text-white text-white"
						type="button"
					>
						Sign Up
					</button>
				</div>
			</form>
		</Form>
	)
}

function DemoEntry() {
	return (
		<div className="mt-8 flex flex-col items-center gap-3 border-t border-gray-70 pt-6">
			<p className="text-center text-xs text-gray-30">
				Just exploring? Open the dashboard with sample data — no account required.
			</p>
			<form action={startDemoSession} className="flex w-full justify-center">
				<button
					type="submit"
					className="default-button-alt w-full max-w-[260px] text-white"
				>
					View demo dashboard
				</button>
			</form>
		</div>
	)
}

export default function LoginForm() {
	return (
		<FormSection
			title="Login"
			description="Welcome back. Please login to access your account."
			form={
				<>
					<FormComponent />
					<DemoEntry />
				</>
			}
		/>
	)
}
