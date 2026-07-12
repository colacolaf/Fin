/**
 * App.tsx — minimal placeholder shell after the full frontend demolition.
 *
 * Why there's no <BrowserRouter>: every page-level route, the sidebar, top
 * bar, command palette, and ocean canvas were deleted in the same pass. The
 * only thing we render for the user is the `<Placeholder />` splash below.
 *
 * When the rebuild lands, this file becomes the routing root again — until
 * then, this is intentionally a 1-component app.
 */
import Placeholder from './Placeholder';

export default function App() {
  return <Placeholder />;
}
