import React from 'react'

export default function SectionIntro({title, description}: {title: React.ReactNode, description: React.ReactNode}) {
  return (
		<header className="flex flex-col items-center text-center md:items-start lg:text-left gap-4">
			<h2 className="text-3xl font-semibold text-green-80">{title}</h2>
			<p className="text-gray-300 max-w-3xl">{description}</p>
		</header>
  )
}
