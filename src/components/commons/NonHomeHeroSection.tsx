"use client"

import React from "react"
import BackgroundImageRightTop from "./BackgroundImageRightTop"
import { motion } from "framer-motion"
import { RandomElementVariants } from "@/lib/variants"

interface HeroProps {
	title: React.ReactNode
	content: string
	image: string
}

const Hero: React.FC<HeroProps> = ({ title, content, image }) => {
	return (
		<section className="max-h-[540px] lg:max-h-[70vh] h-screen container mx-auto lp-4 lg:p-12 font-lex overflow-hidden bg-gray-80 rounded-xl mt-14 relative">
			<BackgroundImageRightTop />

			<div className="relative z-30 w-full h-full">
				<motion.div
					initial="hidden"
					// @ts-expect-error variant error
					variants={RandomElementVariants(1)}
					animate="visible"
					className="min-h-[45vh] lg:min-h-auto text-center lg:text-left z-10 absolute lg:top-0 left-0 bottom-0 right-0  lg:bottom-auto w-full md:max-w-xl lg:max-w-2xl p-6 lg:p-14 bg-gray-90 rounded-l-xl rounded-br-xl lg:rounded-br-[3.5rem] rounded-tr-xl lg:rounded-tr-none overflow-hidden flex flex-col gap-6"
				>
					{title}
					<p className="text-sm lg:text-base">{content}</p>
				</motion.div>
				<motion.img
					initial="hidden"
					// @ts-expect-error variant error
					variants={RandomElementVariants(2)}
					animate="visible"
					src={image}
					alt={"hero image"}
					width={900}
					height={500}
					className="relative lg:float-right right-0 top-0 w-full lg:w-[55vw] object-cover lg:h-[60vh] rounded-xl"
				/>
			</div>
		</section>
	)
}

export default Hero
