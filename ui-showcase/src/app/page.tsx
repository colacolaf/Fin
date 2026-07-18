"use client"

import * as React from "react"
import LoadingScreen from "@/components/loading-screen"
import { DashboardPage } from "@/components/dashboard/dashboard-page"

export default function Home() {
  const [showLoading, setShowLoading] = React.useState(() => {
    // Only show loading screen once per browser session
    if (typeof window === "undefined") return false
    return !sessionStorage.getItem("fo-loading-seen")
  })

  const handleLoadingComplete = React.useCallback(() => {
    sessionStorage.setItem("fo-loading-seen", "1")
    setShowLoading(false)
  }, [])

  if (showLoading) {
    return (
      <div className="h-screen w-full">
        <LoadingScreen onComplete={handleLoadingComplete} />
      </div>
    )
  }

  return <DashboardPage />
}
