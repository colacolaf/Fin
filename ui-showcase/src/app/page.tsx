import OnboardingDemo from "@/components/onboarding-demo"
import ChoicePollDemo from "@/components/choice-poll-demo"
import SortableListDemo from "@/components/sortable-list-demo"
import ShaderLensBlurDemo from "@/components/shader-lens-blur-demo"
import LoadingCarouselDemo from "@/components/loading-carousel-demo"
import LoadingScreen from "@/components/loading-screen"
import SetupWizard from "@/components/setup-wizard"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground md:p-12">
      <div className="mx-auto max-w-6xl space-y-24">
        <header className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Finance OS UI Showcase</h1>
          <p className="text-muted-foreground">
            Exact component previews from the provided source code.
          </p>
          <Link
            href="/dashboard-template"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Open Dashboard Template
          </Link>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Setup Wizard</h2>
          <OnboardingDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Choice Poll</h2>
          <ChoicePollDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Sortable List</h2>
          <SortableListDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Shader Lens Blur</h2>
          <ShaderLensBlurDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Loading Carousel</h2>
          <LoadingCarouselDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Loading Screen</h2>
          <p className="text-muted-foreground">
            Full-screen loading experience with shader background, color palette, and progress messages.
          </p>
          <div className="relative h-[600px] overflow-hidden rounded-2xl border">
            <LoadingScreen />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Setup Wizard (Numbered Steps)</h2>
          <p className="text-muted-foreground">
            Onboarding wizard with a large step number indicator.
          </p>
          <div className="relative h-[600px] overflow-hidden rounded-2xl border bg-muted/30">
            <SetupWizard />
          </div>
        </section>
      </div>
    </main>
  )
}
