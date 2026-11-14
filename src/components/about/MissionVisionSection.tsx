"use client"

import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"
import SectionIntro from "../commons/SectionIntro"
import Image from "next/image"
import { AnimateInViewLeftOrRightVariants } from "@/lib/variants"
import config from "@/config"

const vmInfos = [
	{
		title: "Mission",
		image: "/images/about/mission.svg",
		description:
			`At ${config.TITLE}, our mission is to empower our customers to achieve financial success. We are dedicated to delivering innovative banking solutions that cater to their unique needs. Through personalized services, expert guidance, and cutting-edge technology, we aim to build strong, lasting relationships with our customers. Our mission is to be their trusted partner, helping them navigate their financial journey and realize their dreams.`,
	},
	{
		title: "Vision",
		image: "/images/about/vision.svg",
		description:
			`Our vision at ${config.TITLE}, is to redefine banking by creating a seamless and personalized experience for our customers. We envision a future where banking is accessible, transparent, and tailored to individual preferences. Through continuous innovation and collaboration, we strive to be at the forefront of the industry, setting new standards for customer-centric banking. Our vision is to be the preferred financial institution, known for our unwavering commitment to excellence, trust, and customer satisfaction.`,
	},
]
export default function MissionVisionSection() {
	return (
		<motion.section
			className="container mx-auto py-12 font-lex flex flex-col gap-12 items-center lg:items-start"
			initial="hidden"
		>
			<SectionIntro
				title={<>Mission & Vision</>}
				description="We envision being a leading force in the industry, driven by innovation, integrity, and inclusivity, creating a brighter financial future for individuals and businesses while maintaining a strong commitment to customer satisfaction and community development"
			/>

			<FVCards />
		</motion.section>
	)
}

function FVCards() {
	const individualRef = useRef<HTMLDivElement>(null)
	const businessRef = useRef<HTMLDivElement>(null)
	const individualInView = useInView(individualRef, { amount: 0.3 })
	const businessInView = useInView(businessRef, { amount: 0.3 })
    
	return (
		<div className="flex flex-col gap-6">
			{vmInfos.map((vm, index) => (
				<motion.div
					// @ts-expect-error variant error
					variants={AnimateInViewLeftOrRightVariants}
					initial="hidden"
					ref={index === 0 ? individualRef : businessRef}
					animate={ index === 0 && individualInView || index === 1 && businessInView
							? "visible"
							: "hidden"
					}
					custom={index}
					key={index}
					className={`${index === 1 && "lg:-mt-[120px]"} flex flex-col md:flex-row items-center w-full`}
				>
					<div
						className={`${index === 1 && "order-2"} w-full max-w-md h-auto relative pt-10 px-10 pb-0 bg-gray-80 rounded-t-3xl md:rounded-b-lg overflow-hidden`}
					>
						<Image
							width={545}
							height={500}
							alt={vm.title}
							src={"/images/abstract/rounded.svg"}
							className="absolute z-10 top-0 right-0 left-0 bottom-0 w-full"
						/>
						<Image
							width={545}
							height={500}
							alt={vm.title}
							src={vm.image}
							className="relative z-30 w-full rounded-t-3xl"
						/>
					</div>
					<div
						className={`flex flex-col ${index === 1 ? "md:border-r-2 p-4 md:border-r-green-80" : "md:border-l-2 p-4 md:border-l-green-80"} md:border-t-0 border-t-green-80 h-fit gap-4`}
					>
						<h3 className="font-semibold text-white text-2xl lg:text-3xl">
							{vm.title}
						</h3>
						<p>{vm.description}</p>
					</div>
				</motion.div>
			))}
		</div>
	)
}
