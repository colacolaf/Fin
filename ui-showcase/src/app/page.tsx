import BlurredWallpaperBackground from "@/components/blurred-wallpaper-background"

export default function Home() {
  return (
    <BlurredWallpaperBackground
      // Place your own wallpaper at ui-showcase/public/wallpaper.jpg
      // or set NEXT_PUBLIC_WALLPAPER_PATH to another local path.
      // Remote URLs can be blocked by CORB and are not recommended.
      imageSrc={process.env.NEXT_PUBLIC_WALLPAPER_PATH || "/wallpaper.jpg"}
    />
  )
}
