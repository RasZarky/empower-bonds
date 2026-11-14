"use client"
import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"
import SectionIntro from "../commons/SectionIntro"
import { AnimateInFromBottomVariants } from "@/lib/variants"
import Image from "next/image"
import config from "@/config"

// Define value data structure
interface Benefit {
	icon: string
	title: string
	description: string
}

// Define values data
const values: Benefit[] = [
	{
		icon: "images/icons/competitive-compensation.svg",
		title: "Competitive Compensation",
		description:
			"We provide a competitive salary package that recognizes the skills and expertise of our employees. YourBank believes in rewarding exceptional performance and offering opportunities for financial growth.",
	},
	{
		icon: "images/icons/health-and-wellness.svg",
		title: "Health and Wellness",
		description:
			"We prioritize the health and well-being of our employees by providing comprehensive medical, dental, and vision insurance plans. We also offer wellness programs, gym memberships, and resources to support a healthy lifestyle.",
	},
	{
		icon: "images/icons/retirement-planning.svg",
		title: "Retirement Planning",
		description:
			"YourBank is committed to helping employees plan for their future. We offer a retirement savings plan with a generous employer match to help them build a secure financial foundation for the long term.",
	},
	{
		icon: "images/icons/work-life-balance.svg",
		title: "Work-Life Balance",
		description:
			"We understand the importance of maintaining a healthy work-life balance. YourBank offers flexible work arrangements, paid time off, parental leave, and other programs that support employees in managing their personal and professional commitments.",
	},
]

const getBorderRadiusClasses = (index: number, totalLength: number): string => {
	const even = totalLength % 2 === 1
	const lastItem = totalLength - 1
	const secondToLastItem = totalLength - 2

	if (index === 0) return "md:rounded-tr-lg md:rounded-br-[2.5rem]" // First item: top-left, bottom-left
	if (index === 1) return "md:rounded-tl-lg md:rounded-bl-[2.5rem]" // Second item: top-right, bottom-right

	if (index > 1 && index < secondToLastItem && index % 2 === 1)
		return "md:rounded-tr-lg md:rounded-bl-[2.5rem]"
	if (index > 1 && index < secondToLastItem && index % 2 === 0)
		return "md:rounded-tl-lg md:rounded-br-[2.5rem]"

	if (even && index === secondToLastItem) return "md:rounded-tr-lg md:rounded-br-[2.5rem]" // Second-to-last item: bottom-left, top-left
	if (!even && index === secondToLastItem)
		return "md:rounded-bl-[2.5rem]  md:rounded-tl-lg md:rounded-tr-[2.5rem]" // Second-to-last item: bottom-left, top-left

	if (even && index === lastItem)
		return "md:rounded-bl-[2.5rem] md:rounded-tl-lg"
	if (!even && index === lastItem)
		return "md:rounded-br-[2.5rem] md:rounded-tr-lg" // Last item: bottom-right, top-right
	return "" // No border-radius for other items
}

const getBorderLineClassees = (index: number, totalLength: number): string => {
	const even = totalLength % 2 === 1
	const lastItem = totalLength - 1
	const secondToLastItem = totalLength - 2

	// border and padding for the first two items
	if (index === 0) return "md:border-r border-b md:pr-6 pb-6"
	if (index === 1) return "border-b md:pl-6 py-6 md:pt-0"

	// if items on right
	if (index % 2 === 1 && index > 1 && !even && index < secondToLastItem)
		return "border-b py-6 md:pl-6"
	if (index % 2 === 1 && index > 1 && even) return "border-b py-6 md:pl-6"

	// if items on left
	if (index % 2 === 0 && index > 1 && index < secondToLastItem)
		return "border-b md:border-r py-6 md:pr-6"

    if (!even && totalLength < 5 && index === secondToLastItem) return "border-b md:border-r md:pr-6 md:border-b-0 py-6 md:py-0 md:pt-6 md:pb-0"

	// if second to last item in an even list greater than 4 items
	if (even && index === secondToLastItem && index > 1) return "md:pl-6"

	// if not even items and the second to last item
	if (!even && index === secondToLastItem) return "md:pr-6 pt-6 md:border-r"

	// if even and the last item
	if (even && index === lastItem) return "md:pr-6 pt-6 md:border-r"
	if (!even && index === lastItem) return "md:pl-6 pt-6"
	return ""
}

// Props for BenefitCard
interface BenefitCardProps {
	isInView: boolean
}

export default function BenefitsSection() {
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
						<span className="text-white">Our</span> Benefits
					</>
				}
				description={`At ${config.TITLE}, we value our employees and are dedicated to their well-being and success. We offer a comprehensive range of benefits designed to support their personal and professional growth.`}
			/>

			<BenefitCard isInView={isInView} />
		</motion.section>
	)
}

function BenefitCard({ isInView }: BenefitCardProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2">
			{values.map((value, index) => (
				<motion.div
					// @ts-expect-errors variant issue
					variants={AnimateInFromBottomVariants}
					initial="hidden"
					animate={isInView ? "visible" : "hidden"}
					custom={index}
					key={value.title}
					className={`border-dashed border-gray-70 w-full ${getBorderLineClassees(index, values.length)} `}
				>
					<div
						className={` ${getBorderRadiusClasses(index, values.length)} h-full flex flex-col gap-6 hover:scale-95 duration-300 ease-in-out transition-all bg-gray-80 p-6 rounded-b-lg rounded-t-[2.5rem] `}
					>
						<div className={`flex items-center gap-3`}>
							<Image
								src={value.icon}
								alt={value.title}
								width={100}
								height={100}
								className="shrink-0 w-14 h-14 "
							/>
							<h3 className="text-xl lg:text-2xl font-semibold text-white">
								{value.title}
							</h3>
						</div>
						<p className="text-gray-30">{value.description}</p>
					</div>
				</motion.div>
			))}
		</div>
	)
}
