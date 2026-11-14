"use client"

import React from "react"
import BackgroundImageRightTop from "../commons/BackgroundImageRightTop"
import FormIntro from "./FormIntro"

export default function FormSection({ form, title, description }: { form: React.ReactNode, title: string, description: string }) {
	return (
		<section className="w-full flex flex-col items-center justify-center min-h-[50vh] pt-24">
			<div className="border-gray-70 border-[0.5px] w-full max-w-md lg:max-w-xl flex flex-col p-12 rounded-xl relative bg-cover bg-[url(/images/auth/login.jpg)]">
				<BackgroundImageRightTop />
				
				<FormIntro title={title} description={description} />
				{form}
			</div>
		</section>
	)
}
