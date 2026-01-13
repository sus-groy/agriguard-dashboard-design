"use client"

import { useState } from "react"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { FieldMonitor } from "@/components/field-monitor"
import { PestDiagnostic } from "@/components/pest-diagnostic"
import { IpmStrategy } from "@/components/ipm-strategy"
import { VoicePartner } from "@/components/voice-partner"
import { OverviewDashboard } from "@/components/overview-dashboard"

export default function AgriGuardDashboard() {
  const [activeView, setActiveView] = useState<string>("overview")

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <OverviewDashboard />
      case "health-map":
        return <FieldMonitor />
      case "diagnostic":
        return <PestDiagnostic />
      case "strategy":
        return <IpmStrategy />
      default:
        return <OverviewDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileSidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex-1 pb-24 overflow-auto">{renderContent()}</main>

      {/* VoicePartner component is kept here for now */}
      <VoicePartner />
    </div>
  )
}
