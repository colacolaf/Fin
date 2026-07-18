"use client"

import * as React from "react"
import LoadingScreen from "@/components/loading-screen"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { SetupWizard } from "@/components/setup/setup-wizard"

export default function Home() {
  const [showLoading, setShowLoading] = React.useState(() => {
    // Only show loading screen once per browser session
    if (typeof window === "undefined") return false
    return !sessionStorage.getItem("fo-loading-seen")
  })

  const [showSetup, setShowSetup] = React.useState(() => {
    if (typeof window === "undefined") return false
    return !localStorage.getItem("fo-setup-complete")
  })

  // If loading screen finishes and setup was already done, ensure wizard stays closed
  React.useEffect(() => {
    if (!showLoading && localStorage.getItem("fo-setup-complete")) {
      setShowSetup(false)
    }
  }, [showLoading])

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
