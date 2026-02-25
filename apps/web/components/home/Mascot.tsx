"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { IconCloud } from "@/components/ui/icon-cloud"
import { Skeleton } from "@/components/ui/skeleton"

const slugs = [
  "typescript", "javascript", "react", "tailwindcss", "docker", "git", "gitlab", "nodedotjs", "lucide", "npm", "pnpm", "deno"
]

const images = slugs.map(
  (slug) => `https://cdn.simpleicons.org/${slug}/${slug}`,
)

type MascotProps = {
  /**
   * The size (width) of the mascot image container in pixels.
   * @default 400
   */
  size?: number
  className?: string
}

export function Mascot({ size = 320, className = "" }: MascotProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  // const { theme, systemTheme } = useTheme() // <-- 2. REMOVE THIS LINE

  if (!isMounted) {
    // Render a skeleton on the server and during initial hydration to prevent layout shift
    return (
      <div
        className={className}
        style={{ width: `${size}px`, height: `${size * 1.25}px` }}
      >
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    )
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="pointer-events-none absolute bottom-[140px] z-0 h-[380px] w-[380px] sm:-right-[120px] sm:-top-[60px]">
        <IconCloud images={[...images, "/images/bun.svg", "/images/nextjs.svg", "/images/github.svg", "/images/mdx.svg", "/images/shadcn.svg"]} />
      </div>

      <div
        className="relative z-10"
        style={{
          width: `${size}px`,
          // Using an aspect ratio based on the original sm size (400x500)
          height: `${size * 1.25}px`,
        }}
      >
        {!isLoaded && (
          <Skeleton className="absolute inset-0 h-full w-full rounded-full" />
        )}
        <Image
          src="/images/mascot.png"
          alt="Mascot"
          fill
          sizes={`(max-width: 768px) 300px, ${size}px`}
          className={`transition-opacity duration-300 ease-in-out ${isLoaded ? "opacity-100" : "opacity-0"
            }`}
          onLoad={() => setIsLoaded(true)}
          priority
        />
      </div>
    </div>
  )
}
