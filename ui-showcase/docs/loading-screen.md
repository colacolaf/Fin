# Finance OS Loading Screen

## Overview

The loading screen is the first thing a user sees when Finance OS starts. It uses the interactive shader lens blur as a full-screen background, gives the user a small color palette to play with, and shows loading progress at the bottom.

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [Shader Lens Blur Background]              │
│                                                             │
│                                                             │
│  ┌──────────────┐                                           │
│  │ Color 1 [■]  │                                           │
│  │ Color 2 [■]  │                                           │
│  │ Color 3 [■]  │                                           │
│  │ Color 4 [■]  │                                           │
│  └──────────────┘                                           │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                    ┌─────────────────────┐  │
│                                    │ Loading message     │  │
│                                    │ [==========] 45%    │  │
│                                    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Actual Words

### Loading Messages

The bottom status area cycles through these messages as progress increases:

1. "Initializing secure local environment..."
2. "Connecting to brokerage APIs..."
3. "Syncing portfolio data..."
4. "Loading debt accounts..."
5. "Preparing retirement projections..."
6. "Waking up AI agents..."
7. "Finance OS is ready."

### Ready State

When progress reaches 100%, the status changes to:

- **Icon:** Check mark
- **Text:** "System Ready"
- **Progress bar:** Full width
- **Percentage:** 100%

## Color Palette Box

A small glassmorphism panel in the bottom-left corner contains four color inputs. Changing a color updates the shader background in real time.

- Color 1
- Color 2
- Color 3
- Color 4

## Behavior

- The shader background reacts to mouse movement.
- Loading takes approximately 6 seconds.
- The color palette is always interactive, even while loading.
- When loading completes, the app can transition to the setup wizard.
