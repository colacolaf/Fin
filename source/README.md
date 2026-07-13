# Finance OS UI Source

This directory contains reusable source components for the Finance OS desktop app.

## Components

### `loading-screen.tsx`

Full-screen loading experience with an interactive shader background.

**Features**
- Interactive shader lens blur background
- Color palette box in the bottom-left corner
- Loading progress messages and percentage at the bottom
- "System Ready" state when loading completes

**Dependencies**
- `react`, `react-dom`
- `motion` (Framer Motion)
- `jotai`
- `lucide-react`
- `@/components/ui/shader-lens-blur`
- `@/lib/utils`

**Usage**
```tsx
import LoadingScreen from "@/source/loading-screen"

export default function App() {
  return <LoadingScreen onComplete={() => console.log("ready")} />
}
```

### `setup-wizard.tsx`

Multi-step onboarding wizard with a large numbered step indicator.

**Features**
- Three-step onboarding flow
- Left panel with large step number and dot progress indicator
- Feature carousel on step 1
- Account type selection on step 2
- Tips list on step 3

**Dependencies**
- `react`, `react-dom`
- `motion` (Framer Motion)
- `lucide-react`
- `@/components/ui/onboarding`
- `@/components/ui/button`
- `@/lib/utils`

**Usage**
```tsx
import SetupWizard from "@/source/setup-wizard"

export default function App() {
  return <SetupWizard onComplete={() => console.log("done")} />
}
```

## Notes

- These components assume a Next.js + Tailwind CSS + shadcn/ui project setup.
- The loading screen shares the shader `configAtom` with the standalone shader demo. To isolate it, pass a local config or scope the atom.
- Both components are designed to fill their parent container. Use `h-full w-full` on the parent or pass a custom `className`.
