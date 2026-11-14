import MissionVisionSection from "@/components/about/MissionVisionSection"
import PressReleaseSection from "@/components/about/PressReleaseSection"
import Hero from "@/components/commons/NonHomeHeroSection"
import config from "@/config"
import React from "react"

export default function AboutPage() {
	return (
		<>
			<Hero
				title={
					<div>
						<span className="text-xs text-white">
							Welcome to ${config.TITLE}
						</span>
						<h1 className="text-white font-semibold text-2xl lg:text-4xl">
							Where Banking Meets{" "}
							<span className="text-green-80">Excellence!</span>
						</h1>
					</div>
				}
				content={`At ${config.TITLE}, we believe that banking should be more than just transactions. It should be an experience that empowers individuals and businesses to thrive and reach their financial goals. As a trusted financial institution, we are committed to delivering exceptional banking services that go beyond expectations. With a focus on innovation, personalized solutions, and unwavering integrity, we strive to provide the best banking experience for our valued customers. Join us on this exciting journey and discover a new level of banking excellence.`}
				image="/images/about/hero.svg"
			/>
      <MissionVisionSection />
      <PressReleaseSection />
		</>
	)
}
