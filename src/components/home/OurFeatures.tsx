"use client"
import React, { useRef, useEffect } from "react"
import { motion, useInView, useAnimationControls } from "framer-motion"
import SectionIntro from "../commons/SectionIntro"
import { Button } from "../ui/button"
import Image from "next/image"
import { cardVariants, gridVariants, linkVariants } from "@/lib/variants"

const featureLinks = ["Online Banking", "Financial Tools", "Customer Support"]

const features = [
	{
		for: "Online Banking",
		title: "24/7 Account Access",
		description:
			"Enjoy the convenience of accessing your accounts anytime, anywhere through our secure online banking platform. Check balances, transfer funds, and pay bills with ease.",
	},
	{
		for: "Online Banking",
		title: "Mobile Banking App",
		description:
			"Access your accounts on the go with our mobile banking app. Check balances, deposit checks, and transfer funds from your smartphone or tablet.",
	},
	{
		for: "Online Banking",
		title: "Secure Transactions",
		description:
			"Rest assured that your transactions are safe and secure with our advanced encryption and security measures. We prioritize your privacy and protection. We employ multi-factor authentication and regular security updates to safeguard your information.",
	},
	{
		for: "Online Banking",
		title: "Bill Pay and Transfers",
		description:
			"Easily pay bills and transfer funds between accounts with our streamlined online banking services. Enjoy fast, secure transactions at your fingertips. Set up recurring payments to never miss a due date.",
	},
	{
		for: "Financial Tools",
		title: "Budgeting Tools",
		description:
			"Take control of your finances with our budgeting tools. Track your spending, set savings goals, and create personalized budgets to help you achieve your financial objectives.",
	},
	{
		for: "Financial Tools",
		title: "Investment Options",
		description:
			"Explore a variety of investment options to grow your wealth. From stocks and bonds to mutual funds and retirement accounts, we offer solutions tailored to your financial goals.",
	},
	{
		for: "Financial Tools",
		title: "Financial Planning",
		description:
			"Work with our expert financial advisors to create a comprehensive financial plan. Whether you're saving for retirement, buying a home, or funding education, we can help you achieve your goals.",
	},
	{
		for: "Financial Tools",
		title: "Credit Monitoring",
		description:
			"Stay informed about your credit status with our credit monitoring services. Receive alerts about changes to your credit report and get tips on how to improve your credit score.",
	},
	{
		for: "Customer Support",
		title: "24/7 Customer Service",
		description:
			"Our dedicated customer support team is available around the clock to assist you with any questions or concerns. Reach out via phone, email, or live chat for prompt assistance.",
	},
	{
		for: "Customer Support",
		title: "Personalized Assistance",
		description:
			"Receive personalized support from our knowledgeable representatives. Whether you need help with account management, technical issues, or financial advice, we're here to help.",
	},
	{
		for: "Customer Support",
		title: "Comprehensive FAQs",
		description:
			"Find answers to common questions and learn more about our services through our comprehensive FAQ section. Get the information you need quickly and easily.",
	},
	{
		for: "Customer Support",
		title: "Feedback and Improvement",
		description:
			"We value your feedback and are committed to continuously improving our services. Share your thoughts and suggestions with us to help us better serve you.",
	},
]

export default function OurFeatures() {
	const [selectedFeature, setSelectedFeature] = React.useState(
		featureLinks[0]
	)
	const ref = useRef<HTMLElement>(null)
	const isInView = useInView(ref, { amount: 0.3 })
	const cardControls = useAnimationControls()

	// Trigger card animation when selectedFeature changes
	useEffect(() => {
		cardControls.start("hidden").then(() => {
			if (isInView) {
				cardControls.start("visible")
			}
		})
	}, [selectedFeature, cardControls, isInView])

	return (
		<motion.section
			ref={ref}
			className="container mx-auto py-12 font-lex flex flex-col gap-12 items-center lg:items-start"
			initial="hidden"
			animate={isInView ? "visible" : "hidden"}
		>
			<SectionIntro
				title={
					<>
						<span className="text-white">Our</span> Features
					</>
				}
				description="Experience a host of powerful features at your fingertips, designed to simplify and enhance your banking journey with us, ensuring convenience, security, and efficiency every step of the way."
			/>
			{/* Feature List */}
			<div className="flex flex-col lg:flex-row gap-4 w-full max-w-full flex-none">
				{/* Feature Links */}
				<motion.div
					className="lg:flex-none bg-gray-80 rounded-xl p-8 flex lg:flex-col flex-row w-full overflow-x-auto max-w-full h-min lg:max-w-fit gap-4"
					// @ts-expect-error variant error
					variants={linkVariants(0)}
					initial="hidden"
					animate={isInView ? "visible" : "hidden"}
				>
					{featureLinks.map((link, index) => (
						<motion.div
							key={index}
							// @ts-expect-error variant error
							variants={linkVariants(index)}
							initial="hidden"
							animate={isInView ? "visible" : "hidden"}
						>
							<Button
								variant={"outline"}
								title={link}
								type={"button"}
								className={`flex-none rounded-full bg-gray-80 text-white border-gray-70 border-[0.5px] hover:bg-gray-90 hover:text-green-80 whitespace-nowrap lg:w-full cursor-pointer ${
									selectedFeature === link
										? "bg-gray-90 text-green-80"
										: ""
								}`}
								onClick={() => setSelectedFeature(link)}
							>
								{link}
							</Button>
						</motion.div>
					))}
				</motion.div>
				{/* Feature Cards */}
				<motion.div
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full"
					// @ts-expect-error variant error
					variants={gridVariants}
					initial="hidden"
					animate={isInView ? "visible" : "hidden"}
				>
					{features
						.filter((feature) => feature.for === selectedFeature)
						.map((feature, index) => (
							<FeatureCard
								key={index}
								title={feature.title}
								description={feature.description}
								index={index}
								controls={cardControls}
							/>
						))}
				</motion.div>
			</div>
		</motion.section>
	)
}

function FeatureCard({
	title,
	description,
	index,
	controls,
}: {
	title: string
	description: string
	index: number
	controls: ReturnType<typeof useAnimationControls>
}) {
	return (
		<motion.div
			// @ts-expect-error variant error
			variants={cardVariants(index)}
			initial="hidden"
			animate={controls}
			className="cursor-pointer group relative bg-gray-80 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full"
		>
			<Image
				src="/images/icons/link-open.svg"
				alt="Feature Icon"
				width={40}
				height={40}
				className="w-4 h-4 mb-4 absolute top-6 right-6 group-hover:top-4 group-hover:right-4 transition-all duration-300"
			/>
			<h3 className="text-xl font-semibold text-white mb-6">{title}</h3>
			<p className="text-gray-30">{description}</p>
		</motion.div>
	)
}
