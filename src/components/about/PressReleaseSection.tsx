"use client"

import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"
import SectionIntro from "../commons/SectionIntro"
import Image from "next/image"
import { zoomVariants } from "@/lib/variants"
import config from "@/config"

const pressReleases = [
	{
		image: "/images/about/press-1.svg",
		title: `${config.TITLE} Launches New Rewards Program to Enhance Customer Loyalty and Satisfaction`,
		date: new Date().toDateString(),
		location: "Boston",
		description:
			`${config.TITLE}  is pleased to announce the introduction of our new Rewards Program, aimed at rewarding our loyal customers and enhancing their banking experience. The program offers exclusive benefits, discounts, and personalized offers tailored to individual customer preferences. With this initiative, ${config.TITLE} reaffirms its commitment to delivering exceptional value and building lasting relationships with our valued customers.`,
	},
	{
		image: "/images/about/press-2.svg",
		title: `${config.TITLE} Expands Branch Network with Opening of New Location in Chennai`,
		date: new Date().toDateString(),
		location: "Chennai",
		description:
			`${config.TITLE} is excited to announce the grand opening of our newest branch in [City]. This expansion is a testament to our continued commitment to serving our customers and providing them with convenient access to our comprehensive range of banking services. The new branch will feature state-of-the-art facilities, a team of dedicated professionals, and a personalized approach to banking, further strengthening our presence in the local community.`,
	},
	{
		image: "/images/about/press-3.svg",
		title: `${config.TITLE} Launches New Rewards Program to Enhance Customer Loyalty and Satisfaction`,
		date: new Date().toDateString(),
		location: "New York",
		description:
			`${config.TITLE} is excited to unveil our new Sustainable Banking Initiative, demonstrating our commitment to environmental responsibility. This initiative includes a range of sustainable banking products and services, such as green loans, eco-friendly investment options, and paperless banking solutions. By incorporating sustainable practices into our operations, we aim to contribute to a greener future while providing innovative banking solutions to our customers.`,
	},
	{
		image: "/images/about/press-4.svg",
		title: `${config.TITLE} Launches Sustainable Banking Initiative to Promote Environmental Responsibility`,
		date: new Date().toDateString(),
		location: "Boston",
		description:
			`${config.TITLE} is excited to unveil our new Sustainable Banking Initiative, demonstrating our commitment to environmental responsibility. This initiative includes a range of sustainable banking products and services, such as green loans, eco-friendly investment options, and paperless banking solutions. By incorporating sustainable practices into our operations, we aim to contribute to a greener future while providing innovative banking solutions to our customers.`,
	},
]

export default function PressReleaseSection() {
	const ref = useRef<HTMLDivElement>(null)
	const isInView = useInView(ref)

	return (
		<motion.section
			className="container mx-auto py-12 font-lex flex flex-col gap-12 items-center lg:items-start"
			initial="hidden"
		>
			<SectionIntro
				title={<>Press Releases</>}
				description={`Stay updated with the latest happenings and exciting developments at ${config.TITLE} through our press releases.`}
			/>

			<PressCard ref={ref} isInView={isInView} />
		</motion.section>
	)
}

function PressCard({
	isInView,
	ref,
}: {
	isInView: boolean
	ref: React.RefObject<HTMLDivElement | null>
}) {
	return (
		<motion.div
			ref={ref}
			className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
		>
			{pressReleases.map((press, index) => (
				<motion.article
					// @ts-expect-error variant issue
					variants={zoomVariants(index)}
					initial="hidden"
					animate={isInView ? "visible" : "hidden"}
                    custom={index}
					key={index}
					className="hover:bg-gray-70 ease-in-out duration-300 cursor-pointer rounded-xl p-6 flex flex-col gap-6 bg-gray-80"
				>
					<Image
						src={press.image}
						alt={press.title}
						width={582}
						height={277}
						className="rounded-t-xl"
					/>
					<h4 className="text-2xl text-white font-semibold">
						{press.title}
					</h4>
					<div className="flex items-center flex-wrap gap-2">
						<span className="bg-gray-90 p-1 rounded-full text-nowrap text-xs">
							Location: {press.location}
						</span>
						<span className="bg-gray-90 p-1 rounded-full text-nowrap text-xs">
							Date: {press.date}
						</span>
					</div>
					<p>{press.description}</p>
				</motion.article>
			))}
		</motion.div>
	)
}
