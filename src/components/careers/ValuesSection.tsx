"use client"
import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"
import SectionIntro from "../commons/SectionIntro"
import { AnimateInFromBottomVariants } from "@/lib/variants"
import config from "@/config"

// Define value data structure
interface Value {
	title: string
	description: string
}

// Define values data
const values: Value[] = [
	{
		title: "Integrity",
		description:
			"We conduct ourselves with utmost honesty, transparency, and ethical behavior. We believe in doing what is right for our customers, colleagues, and stakeholders, even when faced with difficult choices.",
	},
	{
		title: "Customer Centricity",
		description:
			"Our customers are at the heart of everything we do. We are dedicated to understanding their needs, providing personalized solutions, and delivering exceptional service that exceeds expectations.",
	},
	{
		title: "Collaboration",
		description:
			"We foster a collaborative and inclusive work environment, where teamwork and diversity are celebrated. By leveraging the unique strengths and perspectives of our employees, we drive innovation and achieve greater success together.",
	},
	{
		title: "Innovation",
		description:
			"We embrace change and constantly seek innovative solutions to meet the evolving needs of our customers. We encourage our employees to think creatively, challenge conventions, and explore new ideas to drive the future of banking.",
	},
]

// Props for ValueCard
interface ValueCardProps {
	isInView: boolean
}

export default function ValuesSection() {
	const ref = useRef<HTMLElement>(null)
	const isInView = useInView(ref, { amount: 0.3 })

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
						<span className="text-white">Our</span> Values
					</>
				}
				description={`At ${config.TITLE}, our values form the foundation of our organization and guide our actions. We believe in upholding the highest standards of integrity, delivering exceptional service, and embracing innovation. These values define our culture and shape the way we work together to achieve our goals.`}
			/>

			<ValueCard isInView={isInView} />
		</motion.section>
	)
}

function ValueCard({ isInView }: ValueCardProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
			{values.map((value, index) => (
				<motion.div
					// @ts-expect-errors variant issue
					variants={AnimateInFromBottomVariants}
					initial="hidden"
					animate={isInView ? "visible" : "hidden"}
					custom={index}
					key={value.title}
					className="w-full border-l-2 border-l-green-80 p-4 flex flex-col gap-6"
				>
					<h3 className="text-white text-xl lg:text-2xl font-semibold">
						{value.title}
					</h3>
					<p className="text-gray-30">{value.description}</p>
				</motion.div>
			))}
		</div>
	)
}
