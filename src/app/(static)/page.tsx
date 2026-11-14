import Banner from "@/components/commons/Banner"
import FrequentlyAskedQuestions from "@/components/commons/FrequentlyAskedQuestions"
import TestimonialSection from "@/components/commons/Testimonials"
import HeroSection from "@/components/home/HeroSection"
import OurFeatures from "@/components/home/OurFeatures"
import ProductsSection from "@/components/home/ProductsSection"
import UseCasesSection from "@/components/home/UseCasesSection"
import Image from "next/image"

export default function Home() {
	return (
		<>
			<Image
				src="/images/abstract/top-left-dots.svg"
				className="absolute top-0 left-0 w-auto h-64 md:w-auto md:h-96 "
				alt="HOME"
				width={40}
				height={40}
			/>
			<HeroSection />
			<ProductsSection />
			<UseCasesSection />
			<OurFeatures />
			<FrequentlyAskedQuestions />
			<TestimonialSection />
			<Banner />
		</>
	)
}
