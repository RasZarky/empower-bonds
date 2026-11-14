import BenefitsSection from "@/components/careers/BenefitSection"
import JobOpeningSection from "@/components/careers/JobOpeningSection"
import ValuesSection from "@/components/careers/ValuesSection"
import Banner from "@/components/commons/Banner"
import FrequentlyAskedQuestions from "@/components/commons/FrequentlyAskedQuestions"
import Hero from "@/components/commons/NonHomeHeroSection"
import config from "@/config"
import React from "react"

export default function CareersPage() {
	return (
		<>
			<Hero
				title={
					<h1 className="text-white font-semibold text-2xl lg:text-4xl">
						Welcome to{" "}
						<span className="text-green-80">
							{config.TITLE}
						</span>{" "}
						Careers
					</h1>
				}
				content="Join our team and embark on a rewarding journey in the banking industry. At YourBank, we are committed to fostering a culture of excellence and providing opportunities for professional growth. With a focus on innovation, customer service, and integrity, we strive to make a positive impact in the lives of our customers and communities. Join us today and be a part of our mission to shape the future of banking."
				image="/images/career/hero.svg"
			/>
      <ValuesSection />
      <BenefitsSection />
      <JobOpeningSection />
			<FrequentlyAskedQuestions />
			<Banner />
		</>
	)
}
