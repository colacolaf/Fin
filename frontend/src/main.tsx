import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from './registerSW'

// Ponytail: StrictMode dropped. The ocean canvas owns a raw THREE.WebGLRenderer
// without r3f's auto-cleanup; React 19 double-mount in dev leaks WebGL contexts,
// re-runs the bloom composer twice, and spams THREE.Clock deprecation warnings.
// Re-enable once the canvas migrates to a fiber-rooted renderer.
createRoot(document.getElementById('root')!).render(<App />)

// Register service worker for PWA / offline support
registerSW();