import Image from 'next/image'
import React from 'react'

export default function BackgroundImageLeftTop({image}:{image?:string}) {
  return (
    <>
      {/* Background decorative image */}
      <Image
        className="absolute z-20 lg:h-full top-0 left-0"
        src={image || "/images/abstract/left-rounded-dots.png"}
        alt="Decorative background"
        width={180}
        height={180}
      />
    </>
  )
}
