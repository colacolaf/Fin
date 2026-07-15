# Blurred Wallpaper Background

## Overview

The blurred wallpaper background sits behind the Finance OS app like a frosted window. It displays the user's desktop wallpaper with a light blur so the image remains visible while any text or icons behind it are unreadable.

## Behavior

- Renders a full-screen, fixed-position layer behind app content (`-z-10`).
- Loads the wallpaper from `ui-showcase/public/wallpaper.jpg` by default.
- Applies a light CSS blur (default `6px`) so the wallpaper is recognizable but softened.
- Shows a dark fallback gradient while the image loads or if it fails to load.
- Adds a very subtle darkening overlay (`bg-black/5`) to keep app content readable.

## Configuration

### Wallpaper

Place your wallpaper image at:

```
ui-showcase/public/wallpaper.jpg
```

Or set the environment variable:

```bash
NEXT_PUBLIC_WALLPAPER_PATH=/my-wallpaper.jpg
```

### Blur Amount

The component accepts an optional `blur` prop (number, default `6`). Increase it for more privacy, decrease it for more wallpaper detail.

```tsx
<BlurredWallpaperBackground imageSrc="/wallpaper.jpg" blur={4} />
```

## Design Rationale

This background is intentionally minimal. It keeps the user's wallpaper visible with just enough blur to hide desktop text and icons, acting like a window behind the app rather than a decorative effect.
