import FrequentlyAskedQuestions from "@/components/commons/FrequentlyAskedQuestions"
import Hero from "@/components/commons/NonHomeHeroSection"
import HowWeProtectYouSection from "@/components/security/HowWeProtectYouSection"
import config from "@/config"
import React from "react"

export default function SecurityPage() {
	return (
		<>
			<Hero
				title={
					<h1 className="text-white font-semibold text-2xl lg:text-4xl">
						Your Security is Our{" "}
						<span className="text-green-80">Top Priority!</span>
					</h1>
				}
				content={`
					At ${config.TITLE}, we understand the importance of keeping your financial information secure. We employ robust security measures and advanced technologies to protect your personal and financial data. Rest assured that when you bank with us, your security is our utmost priority.
					`}
				image="/images/security/hero.svg"
			/>
			<HowWeProtectYouSection />
			<FrequentlyAskedQuestions />
		</>
	)
}
