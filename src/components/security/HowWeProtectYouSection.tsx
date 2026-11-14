"use client"

import React from "react"
import { motion } from "framer-motion"
import SectionIntro from "../commons/SectionIntro"
import Image from "next/image"
import config from "@/config"

const protections = [
	{
		icon: "/images/security/secure-online-banking-platform.svg",
		title: "Secure Online Banking Platform",
		message:
			"Our online banking platform is built with multiple layers of security to safeguard your information. We utilize industry-standard encryption protocols to ensure that your data remains confidential and protected during transmission.",
	},
	{
		icon: "/images/security/multifactor-auth.svg",
		title: "Multi Factor Authentication",
		message:
			"To enhance the security of your online banking experience, we employ multi-factor authentication. This additional layer of security requires you to provide multiple pieces of identification, such as a password and a one-time verification code, to access your account.",
	},
	{
		icon: "/images/security/fraud-monitor.svg",
		title: "Fraud Monitoring",
		message:
			"We have sophisticated fraud detection systems in place to monitor your accounts for any suspicious activities. Our dedicated team works around the clock to detect and prevent unauthorized transactions, providing you with peace of mind.",
	},
	{
		icon: "/images/security/secure-mobile-banking.svg",
		title: "Secure Mobile Banking",
		message:
			"Our mobile banking app is designed with the same level of security as our online banking platform. You can confidently access your accounts, make transactions, and manage your finances on the go, knowing that your information is protected.",
	},
]

export default function HowWeProtectYouSection() {
	return (
		<motion.section
			className="container mx-auto py-12 font-lex flex flex-col gap-12 items-center lg:items-start"
			initial="hidden"
		>
			<SectionIntro
				title={
					<>
						<span className="text-white">How We</span> Protect You
					</>
				}
				description={`At ${config.TITLE}, we prioritize the security and confidentiality of your financial information. Our state-of-the-art encryption technology and stringent data protection measures ensure your assets and transactions are safeguarded at all times`}
			/>

			<div className="rounded-xl relative md:p-12 md:min-h-[40vh] md:bg-gradient-to-r from-green-80/5 via-20% to-gray-80 w-full">
				<ProtectionCard />
			</div>
		</motion.section>
	)
}

function ProtectionCard() {
	return (
		<div className="md:absolute top-12 left-12 right-12 h-fit grid grid-cols-1 md:grid-cols-2 gap-6">
			{protections.map((p, idx) => (
				<div
					className="border-gray-70 border-[0.5px] bg-gray-80 rounded-xl p-8 flex flex-col gap-8"
					key={idx}
				>
					<div className="flex items-center gap-4">
						<Image
							src={p.icon}
							alt={p.title}
							width={92}
							height={92}
							className="w-9 lg:w-14 h-9 lg:h-14"
						/>
						<h4 className="font-semibold text-white text-2xl lg:text-3xl">
							{p.title}
						</h4>
					</div>
					<p>{p.message}</p>
				</div>
			))}
		</div>
	)
}
