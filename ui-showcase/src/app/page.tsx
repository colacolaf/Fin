"use client"

import * as React from "react"
import LoadingScreen from "@/components/loading-screen"
import { DashboardPage } from "@/components/dashboard/dashboard-page"

export default function Home() {
  const [isLoading, setIsLoading] = React.useState(true)

  if (isLoading) {
    return (
      <div className="h-screen w-full">
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      </div>
    )
  }

  return <DashboardPage />
}
