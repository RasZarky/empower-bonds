/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useTransition } from "react"
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
import { useForm } from "react-hook-form"
import { FaEye, FaEyeSlash } from "react-icons/fa6"

export const ResetSchema = z.object({
        password: z
            .string() // check if it is string type
            .min(8, { message: "Password must be at least 8 characters long" }) // checks for character length
            .max(20, {
                message: "Password must be at most 20 characters long",
            }),
        confirmPassword: z
            .string()
            .min(8, { message: "Password must be at least 8 characters long" })
            .max(20, {
                message: "Password must be at most 20 characters long",
            }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],

        // checks if the password and confirm password are equal
    })

function FormComponent() {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [viewPassword, setViewPassword] = useState(false)

    const form = useForm<z.infer<typeof ResetSchema>>({
        resolver: zodResolver(ResetSchema),
        defaultValues: {
            password: "",
            confirmPassword: ""
        },
    })

    const handleSubmit = async (data: z.infer<typeof ResetSchema>) => {
        // Handle registration logic here
        try {
            startTransition(async () => {
                ResetSchema.parse(data) // Validate data against the schema

                const token = new URLSearchParams(window.location.search).get(
					"token"
				)

				if (!token) {
					// Handle the error
					toast.error("Invalid Token", {
						description: "The provided reset token is invalid!",
					})
					return
				}

                // Simulate registration logic
                await authClient.resetPassword(
					{
						newPassword: data.password,
						token,
					},
					{
						onSuccess() {
							toast.success("Reset Password", {
								description: "Your password has been changed!",
							})
							router.replace("/auth/login")
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
			toast.error("Reset Password Error", {
				description: error.message || "Reset Password failed",
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
										autoFocus={true}
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
					name="confirmPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Confirm Password</FormLabel>
							<FormControl className="relative">
								<div className="relative">
									<Input
										className="rounded-full bg-gray-90 border-[0.5px] border-gray-80 placeholder:text-gray-60"
										type={
											viewPassword ? "text" : "password"
										}
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

				<button
					disabled={pending}
					type="submit"
					className="default-button w-full max-w-[260px] mx-auto text-center"
				>
					Reset Password
				</button>
			</form>
		</Form>
	)
}

export default function ResetPasswordForm() {
    return (
        <FormSection
            title="Reset Password"
            description="Reset your password now."
            form={<FormComponent />}
        />
    )
}
