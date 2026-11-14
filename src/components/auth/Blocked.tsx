"use client"

import React from "react"
import { useRouter } from "next/navigation"
import FormSection from "./FormSection"
import Link from "next/link"
import config from "@/config"

export default function Blocked() {
	const router = useRouter()
	return (
		<FormSection
			title="Account Blocked"
			description=""
			form={
				<>
					<p className="mb-6">
						Hello there! Please be informed of your account&lsquo;s
						termination due to dissatisfactory actions within our
						system. If you believe there was a mistake please do
						well to contact:{" "}
						<Link
							className="text-green-80 cursor-pointer"
							href={`mailto://${config.EMAIL_COMPLAINTS}`}
						>
							{config.EMAIL_COMPLAINTS}
						</Link>
					</p>
					<button
						onClick={() => router.replace("/")}
						type="button"
						className="w-fit cursor-pointer default-button"
					>
						Back Home
					</button>
				</>
			}
		/>
	)
}
