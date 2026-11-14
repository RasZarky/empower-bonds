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

export const ForgetSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
})

function FormComponent() {
	const router = useRouter()
	const [pending, startTransition] = useTransition()

	const form = useForm<z.infer<typeof ForgetSchema>>({
		resolver: zodResolver(ForgetSchema),
		defaultValues: {
			email: "",
		},
	})

	const handleSubmit = async (data: z.infer<typeof ForgetSchema>) => {
		// Handle registration logic here
		try {
			startTransition(async () => {
				ForgetSchema.parse(data) // Validate data against the schema
				// Simulate registration logic
				await authClient.requestPasswordReset(
					{
						email: data.email,
						redirectTo: `${config.BASE_URL}/auth/reset-password`,
					},
					{
						onSuccess() {
							toast.success("Forgot Password", {
								description:
									"You have successfully requested for a password reset. Please check your email the reset link!",
							})
							router.push("/") // Redirect to login page
						},
						onError(context) {
							toast.error(
								context.error.name || "Reset Password Error",
								{
									description:
										context.error.message ||
										"Reset Password failed",
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
				onSubmit={form.handleSubmit(handleSubmit)}
				className="space-y-8 relative z-30 flex flex-col"
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
									placeholder="john@example.com"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<button
					disabled={pending}
					type="submit"
					className="default-button w-full max-w-[260px] mx-auto text-center"
				>
					Send Password Request
				</button>
			</form>
		</Form>
	)
}

export default function ForgotPasswordForm() {
	return (
		<FormSection
			title="Forgot Password"
			description="Forgotten your password? We can help with that. Simple add your email to get aa fresh token."
			form={<FormComponent />}
		/>
	)
}
