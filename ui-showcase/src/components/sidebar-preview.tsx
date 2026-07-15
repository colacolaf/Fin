"use client"

import {
  BlocksIcon,
  CircleIcon,
  HexagonIcon,
  OctagonIcon,
  PentagonIcon,
  SquareIcon,
  TriangleIcon,
} from "lucide-react"
import { Dock, DockCard, DockCardInner, DockDivider } from "@/components/ui/dock"
import { BrowserWindow } from "@/components/ui/mock-browser-window"

const financeAgents = [
  { label: "Portfolio Agent", active: true },
  { label: "Debt Agent" },
  { label: "Retirement Agent" },
  { label: "Analytics", badge: "new" },
  { label: "Settings" },
]

const gradients = [
  "https://products.ls.graphics/mesh-gradients/images/03.-Snowy-Mint_1-p-130x130q80.jpeg",
  "https://products.ls.graphics/mesh-gradients/images/04.-Hopbush_1-p-130x130q80.jpeg",
  "https://products.ls.graphics/mesh-gradients/images/06.-Wisteria-p-130x130q80.jpeg",
  "https://products.ls.graphics/mesh-gradients/images/09.-Light-Sky-Blue-p-130x130q80.jpeg",
  "https://products.ls.graphics/mesh-gradients/images/12.-Tumbleweed-p-130x130q80.jpeg",
  "https://products.ls.graphics/mesh-gradients/images/15.-Perfume_1-p-130x130q80.jpeg",
  null,
  "https://products.ls.graphics/mesh-gradients/images/36.-Pale-Chestnut-p-130x130q80.jpeg",
]

const openIcons = [
  <CircleIcon key="circle" className="h-5 w-5 fill-black stroke-black" />,
  <TriangleIcon key="triangle" className="h-5 w-5 fill-black stroke-black" />,
  <SquareIcon key="square" className="h-5 w-5 fill-black stroke-black" />,
  <PentagonIcon key="pentagon" className="h-5 w-5 fill-black stroke-black" />,
  <HexagonIcon key="hexagon" className="h-5 w-5 fill-black stroke-black" />,
  <OctagonIcon key="octagon" className="h-5 w-5 fill-black stroke-black" />,
  null,
  <BlocksIcon key="blocks" className="h-5 w-5 fill-black stroke-black" />,
]

export function SidebarPreview() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground md:p-12">
      <div className="mx-auto max-w-6xl space-y-16">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Finance OS — Sidebar Options
          </h1>
          <p className="text-muted-foreground">
            Two navigation concepts for the dashboard. Pick one to integrate.
          </p>
        </header>

        {/* Option 1: macOS-style Dock */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Option 1: macOS Dock</h2>
            <span className="text-sm text-muted-foreground">
              Hover over the dock items to see the magnification animation.
            </span>
          </div>
          <div className="relative flex h-[400px] items-center justify-center overflow-hidden rounded-2xl border bg-muted/30">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Dashboard content area</p>
            </div>
            <DockDemo />
          </div>
        </section>

        {/* Option 2: Professional Sidebar */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Option 2: Professional Sidebar</h2>
            <span className="text-sm text-muted-foreground">
              Clean left sidebar with agent names, analytics, and settings.
            </span>
          </div>
          <div className="flex justify-center rounded-2xl border bg-muted/30 p-6">
            <BrowserWindow
              variant="chrome"
              headerStyle="full"
              url="https://fin.os/dashboard"
              size="xl"
              showSidebar
              sidebarPosition="left"
              sidebarItems={financeAgents}
            >
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Main content area. Only the sidebar/navigation shell is being previewed.
                </p>
              </div>
            </BrowserWindow>
          </div>
        </section>
      </div>
    </main>
  )
}

function DockDemo() {
  return (
    <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
      <Dock>
        {gradients.map((src, index) =>
          src ? (
            <DockCard key={src} id={`${index}`} index={index}>
              <DockCardInner src={src} id={`${index}`}>
                {openIcons[index]}
              </DockCardInner>
            </DockCard>
          ) : (
            <DockDivider key={index} />
          )
        )}
      </Dock>
    </div>
  )
}
