"use client"

import * as React from "react"

interface BlurredWallpaperBackgroundProps {
  /** Source (local path or URL) of the wallpaper image to show through the glass. */
  imageSrc: string
  /** Blur radius applied to the wallpaper. */
  blur?: number
}

export default function BlurredWallpaperBackground({
  imageSrc,
  blur = 6,
}: BlurredWallpaperBackgroundProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false)

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-900">
      {/* Fallback gradient shown while the image loads or if it fails */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black transition-opacity duration-700"
        style={{ opacity: imageLoaded ? 0 : 1 }}
      />

      {/* Wallpaper layer — lightly blurred so the image is visible but text is unreadable */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: `url(${imageSrc})`,
          opacity: imageLoaded ? 1 : 0,
          filter: `blur(${blur}px)`,
        }}
      />

      {/* Hidden image used to detect load state */}
      <img
        src={imageSrc}
        alt=""
        aria-hidden="true"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(false)}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />

      {/* Very light darkening layer to keep app content readable */}
      <div className="absolute inset-0 bg-black/5" />
    </div>
  )
}
