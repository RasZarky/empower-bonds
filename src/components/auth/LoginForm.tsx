"use client"

import React from "react"
import FormSection from "./FormSection"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { FaEye, FaEyeSlash } from "react-icons/fa6"
import { RiLoader4Line } from "react-icons/ri"
import Link from "next/link"
import { Checkbox } from "../ui/checkbox"
import { DEMO_CREDENTIALS } from "@/lib/demo-credentials"


export const LoginSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters long" }),
	rememberMe: z.boolean(),
})

function FormComponent() {
	const [viewPassword, setViewPassword] = React.useState(false)
	const [checked, setChecked] = React.useState(false)
	const router = useRouter()
	const [submitting, setSubmitting] = React.useState(false)

	const form = useForm<z.infer<typeof LoginSchema>>({
		resolver: zodResolver(LoginSchema),
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
		},
	})

	const handleSubmit = async (data: z.infer<typeof LoginSchema>) => {
		setSubmitting(true)

		// Simulate the round trip a real sign-in would make.
		await new Promise((resolve) => setTimeout(resolve, 1200))

		// The exported site has no backend: the sample credentials open the demo
		// dashboard, anything else is rejected in the browser.
		const matchesSample =
			data.email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
			data.password === DEMO_CREDENTIALS.password

		if (!matchesSample) {
			setSubmitting(false)
			toast.error("Authentication Error", {
				description: "Check your email and password and try again.",
			})
			return
		}

		router.push("/dashboard")
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
						disabled={submitting}
						type="submit"
						className="default-button mx-auto max-w-[260px] w-full disabled:cursor-not-allowed disabled:opacity-60"
					>
						{submitting ? (
							<span className="inline-flex items-center justify-center gap-2">
								<RiLoader4Line className="h-4 w-4 animate-spin" />
								Signing in…
							</span>
						) : (
							"Sign In"
						)}
					</button>
					<button
						onClick={() => router.push("/auth/register")}
						disabled={submitting}
						className="default-button-alt mx-auto max-w-[260px] w-full hover:text-white text-white disabled:cursor-not-allowed disabled:opacity-60"
						type="button"
					>
						Sign Up
					</button>
				</div>
			</form>
		</Form>
	)
}

export default function LoginForm() {
	return (
		<FormSection
			title="Login"
			description="Welcome back. Please login to access your account."
			form={<FormComponent />}
		/>
	)
}
