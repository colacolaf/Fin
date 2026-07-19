"use client"

import * as React from "react"
import LoadingScreen from "@/components/loading-screen"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { SetupWizard } from "@/components/setup/setup-wizard"

export default function Home() {
  const [showLoading, setShowLoading] = React.useState(false)
  const [showSetup, setShowSetup] = React.useState(false)

  // After mount, read from localStorage to avoid hydration mismatch
  React.useEffect(() => {
    const loadingSeen = sessionStorage.getItem("fo-loading-seen")
    const setupComplete = localStorage.getItem("fo-setup-complete")
    setShowLoading(!loadingSeen)
    setShowSetup(!setupComplete)
  }, [])

  const handleLoadingComplete = React.useCallback(() => {
    sessionStorage.setItem("fo-loading-seen", "1")
    setShowLoading(false)
  }, [])

  const handleSetupClose = React.useCallback(() => {
    setShowSetup(false)
  }, [])

  if (showLoading) {
    return (
      <div className="h-screen w-full">
        <LoadingScreen onComplete={handleLoadingComplete} />
      </div>
    )
  }

  return (
    <>
      <DashboardPage />
      <SetupWizard open={showSetup} onClose={handleSetupClose} />
    </>
  )
}
