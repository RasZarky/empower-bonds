"use client"

import React from "react"
import FormSection from "./FormSection"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { useZustand } from "@/hooks/useZustand"
import { FaEye, FaEyeSlash } from "react-icons/fa6"
import { RiLoader4Line } from "react-icons/ri"

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
	const { getStartedEmail } = useZustand()
	const [viewPassword, setViewPassword] = React.useState(false)
	const router = useRouter()
	const [pending, setPending] = React.useState(false)

	const form = useForm<z.infer<typeof RegisterSchema>>({
		resolver: zodResolver(RegisterSchema),
		defaultValues: {
			firstName: "John",
			lastName: "Doe",
			email: getStartedEmail || "",
			password: "",
		},
	})

	const handleSubmit = async (data: z.infer<typeof RegisterSchema>) => {
		const parsed = RegisterSchema.safeParse(data)

		if (!parsed.success) return

		setPending(true)

		// Simulate account creation before opening the holding page.
		await new Promise((resolve) => setTimeout(resolve, 1400))

		// Sign-up runs against local sample data, so there is no account to create
		// in a database: the visitor goes straight to the holding page.
		router.push("/auth/account-ready")
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
						className="default-button mx-auto max-w-[260px] w-full disabled:opacity-60 disabled:cursor-not-allowed"
						type="submit"
					>
						{pending ? (
							<span className="inline-flex items-center justify-center gap-2">
								<RiLoader4Line className="h-4 w-4 animate-spin" />
								Creating your account…
							</span>
						) : (
							"Sign Up"
						)}
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
