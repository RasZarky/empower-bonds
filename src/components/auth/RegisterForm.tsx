/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useTransition } from "react"
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
import {
	createBankAccountAction,
	createPreferenceAction,
} from "@/server/action/userAction"

export const RegisterSchema = z.object({
	firstName: z
		.string()
		.min(2, { message: "First Name must be more than 2 characters" }),
	lastName: z
		.string()
		.min(2, { message: "Surname must be more than 2 characters" }),
	email: z.email({ message: "Invalid email address" }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters long" }),
})

function FormComponent() {
	const { setUser, getStartedEmail } = useZustand()
	const [viewPassword, setViewPassword] = React.useState(false)
	const router = useRouter()
	const [pending, startTransition] = useTransition()

	const form = useForm<z.infer<typeof RegisterSchema>>({
		resolver: zodResolver(RegisterSchema),
		defaultValues: {
			firstName: "John",
			lastName: "Doe",
			email: getStartedEmail || "",
			password: "",
		},
	})

	const addRelationships = async (id: string) => {
		const [bankResponse, prefResponse] = await Promise.all([
			createBankAccountAction(id, {
				accountType: "checking",
				accountName: `${form.getValues().firstName} ${form.getValues().lastName}`,
				bankName: "Bank of America",
				accountNumber: undefined,
			}),
			createPreferenceAction(id),
		])
		if (!bankResponse.success || !prefResponse.success) {
			toast.error(bankResponse.error || prefResponse.error, {
				description: bankResponse.message || prefResponse.message,
			})
		} else {
			// Simulate registration success
			toast.success("Registration Successful", {
				description:
					"You have successfully registered a new account with us!",
			})
			router.push("/auth/login") // Redirect to login page
		}
	}

	const handleSubmit = async (data: z.infer<typeof RegisterSchema>) => {
		// Handle registration logic here
		try {
			startTransition(async () => {
				RegisterSchema.parse(data) // Validate data against the schema
				// Simulate registration logic
				await authClient.signUp.email(
					{
						hashedTransactionPin: "0000",
						name: `${data.firstName} ${data.lastName}`,
						email: data.email,
						password: data.password,
						callbackURL: `${config.BASE_URL}/dashboard`,
					},
					{
						async onSuccess(context) {
							setUser(context.data.user) // Assuming setUser is a function to set the user state

							await addRelationships(context.data.user.id)

							// Simulate registration success
							toast.success("Registered Successfully", {
								description: `A verificatoin email has been sent to your email: ${data.email}!`,
							})

							router.push("/auth/login") // Redirect to login page
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
			})
		} catch (error: any) {
			toast.error("Authentication Error", {
				description: error.message || "Authentication failed",
			})
		}
	}

	return (
		<Form {...form}>
			<form
				autoComplete="off"
				onSubmit={form.handleSubmit(handleSubmit)}
				className="relative z-30 grid grid-cols-1 lg:grid-cols-2 gap-6"
			>
				<FormField
					control={form.control}
					name="firstName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Firstname</FormLabel>
							<FormControl>
								<Input
									className="rounded-full bg-gray-90 border-[0.5px] border-gray-80 placeholder:text-gray-60"
									autoFocus={true}
									autoCapitalize="words"
									placeholder="John"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="lastName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Lastname</FormLabel>
							<FormControl>
								<Input
									className="rounded-full bg-gray-90 border-[0.5px] border-gray-80 placeholder:text-gray-60"
									autoCapitalize="words"
									placeholder="Snow"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									className="rounded-full bg-gray-90 border-[0.5px] border-gray-80 placeholder:text-gray-60"
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

				<div className="flex flex-col items-center w-full lg:col-span-2 gap-4">
					<button
						disabled={pending}
						onClick={() => router.push("/auth/register")}
						className="default-button mx-auto max-w-[260px] w-full"
						type="submit"
					>
						Sign Up
					</button>
					<button
						onClick={() => router.push("/auth/login")}
						type="button"
						className="default-button-alt mx-auto max-w-[260px] w-full hover:text-white text-white"
					>
						Sign In
					</button>
				</div>
			</form>
		</Form>
	)
}

export default function RegisterForm() {
	return (
		<FormSection
			title="Sign Up"
			description="Join our community today. Create an account to unlock exclusive features and personalized experience."
			form={<FormComponent />}
		/>
	)
}
