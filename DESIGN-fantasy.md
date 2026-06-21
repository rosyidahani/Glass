---
version: alpha
name: GAME-ANIME-FANTASY-DESIGN-SYSTEM
description: |
  A modern anime fantasy game design system built around soft magical realism, structured like a premium RPG interface. The system avoids neon, cyberpunk, and esports aesthetics entirely, instead using calm mystical palettes inspired by high-fantasy anime worlds. The interface feels like an in-game menu from a cinematic open-world RPG: elegant, readable, and emotionally immersive. All surfaces are grounded in soft dark blues, ivory whites, royal purples, and muted gold accents. Geometry is clean and slightly rounded (4px–12px), never sharp or aggressive. Shadows are subtle and atmospheric, never glowing or neon-like.

colors:
  primary: "#4C6FFF"
  primary-dark: "#3A56CC"
  secondary: "#8B6FCF"
  accent-gold: "#D6B25E"
  accent-sky: "#7EC8FF"

  canvas-dark: "#0F1420"
  canvas-soft-dark: "#171C2B"
  canvas-light: "#F6F3EE"

  surface: "#FFFFFF"
  surface-soft: "#F1EFEA"
  surface-dark: "#121826"

  text-main: "#111827"
  text-muted: "#6B7280"
  text-soft: "#9CA3AF"
  text-inverse: "#FFFFFF"

  border: "#E5E7EB"
  border-dark: "#2A3142"

  success: "#4CAF7A"
  warning: "#E6A23C"
  error: "#E05D5D"

  link: "#4C6FFF"

typography:
  display-xl:
    fontFamily: Inter
    fontSize: 52px
    fontWeight: 800
    lineHeight: 1.1

  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.2

  heading-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.3

  heading-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.4

  heading-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4

  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6

  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6

  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5

  label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 600
    letterSpacing: 0.4px

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 64px

components:

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.body-md}"
    padding: 12px 20px
    rounded: "{rounded.md}"
    height: 44px

  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    border: "1px solid {colors.primary}"
    rounded: "{rounded.md}"

  card-default:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: 20px

  card-character:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: 24px

  card-feature:
    backgroundColor: "{colors.surface-soft}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: 24px

  hero-section:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.text-inverse}"
    padding: 80px 48px

  nav-bar:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-inverse}"
    height: 64px

  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-main}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    height: 44px

  badge:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.full}"
    padding: 4px 10px

  sidebar:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    padding: 16px

---

## Overview

This design system represents a modern anime fantasy game interface inspired by high-quality RPG worlds. It is not futuristic or cyberpunk; instead, it focuses on emotional immersion, magical atmosphere, and clarity of gameplay UI structure.

The interface feels like navigating an in-game menu of a premium open-world RPG:
- soft glowing environments
- character-centric layouts
- calm fantasy UI language
- readable and cinematic presentation

## Design Philosophy

- Fantasy realism, not sci-fi
- Soft magical atmosphere, not neon glow
- Character-driven UI hierarchy
- Clean spacing and readable layout
- UI should feel like part of the game world

## Rules

Do:
- Use soft blue, purple, and gold accents
- Keep UI calm and elegant
- Prioritize readability and immersion
- Use cards for structured content

Don’t:
- No neon colors
- No cyberpunk UI
- No aggressive RGB styling
- No overly sharp angular UI

## Visual Mood

- Magical world interface
- RPG character menu
- Fantasy exploration UI
- Calm, premium, story-driven design