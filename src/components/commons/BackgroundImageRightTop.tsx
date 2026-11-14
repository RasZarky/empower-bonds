import Image from "next/image"
import React from "react"

export default function BackgroundImageRightTop({ image }: { image?: string }) {
	return (
		<>
			{/* Background decorative image */}
			<Image
				className="absolute z-20 lg:h-auto w-52 top-0 right-0"
				src={image || "/images/abstract/right-rounded-dots.png"}
				alt="Decorative background"
				width={180}
				height={180}
			/>
		</>
	)
}
