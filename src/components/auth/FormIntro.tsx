import React from "react"

export default function FormIntro({
	title,
	description,
}: {
	title: string
	description: string
}) {
	return <div className="flex flex-col items-center mb-14 max-w-xs mx-auto gap-1">
        <h4 className="text-3xl text-green-80 font-semibold">{title}</h4>
        <p className="text-sm text-center">{description}</p>
    </div>
}
