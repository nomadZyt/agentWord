# Prototype Scene Assets

Last updated: 2026-06-02

This folder contains model-generated assets for F-stage prototype-accurate scene
work.

## Assets

- `scene_prototype_base_1536x1024.png`
  - Source: built-in image generation.
  - Original generated path:
    `/Users/user/.codex/generated_images/019e814a-ce51-7933-9c58-2a1f4d1e860e/ig_02b76e963a206366016a1ebf86f75c8190b26f57c0838c7808.png`
  - Purpose: prototype-like base map for the central scene.
  - Size: 1536 x 1024.
  - Status: accepted F-stage base candidate. It removes non-functional side
    rooms and keeps only the functional capacity regions needed for the
    prototype: upper team work hall, middle dispatch/block centers, bottom
    waiting/idle zone, and decorative garden/path edges.

- `scene_prototype_base_raw.png`
  - Earlier copy kept for traceability.

- `scene_prototype_base_clean_raw.png`
  - Copy of the accepted clean base map kept for traceability.

- `scene_prototype_base_rejected_fixed_tables.png`
  - Rejected earlier candidate. It baked fixed task-table placement into the
    base map, which conflicts with dynamic team desk rendering.

- `scene_prototype_base_rejected_side_rooms.png`
  - Rejected earlier candidate. It contained non-functional side rooms that
    consumed layout space without supporting the current prototype flow.

- `scene_prototype_ui_props_sheet_raw.png`
  - Source: built-in image generation.
  - Original generated path:
    `/Users/user/.codex/generated_images/019e814a-ce51-7933-9c58-2a1f4d1e860e/ig_02b76e963a206366016a1eb18ef4908190afa6117564fab338.png`
  - Purpose: raw reusable prop sheet for team desks, center desks, blocked
    center props, waiting tables, route arrows, chairs, plants, wall/corner
    pieces, terminal props, and warning props.
  - Status: raw sheet, not yet sliced and not yet chroma-key cleaned.

## Generation Prompt Summary

The raw prop sheet was generated as a warm kawaii top-down management game asset
sheet on a flat chroma-key background. It requested reusable desk variants,
Task Dispatch Center, Blocked Center, Waiting / Idle Zone tables, route arrows,
chairs, plants, wall/corner props, terminal props, and warning props. It
explicitly excluded characters, mascots, animals, text, numbers, logos, and
watermarks.

The accepted base map was generated as a wide top-down cozy management-game
campus base map matching the prototype composition: one large upper team work
hall, middle Task Dispatch Center and Blocked Center areas, bottom Waiting /
Idle Zone, garden paths, walls, lamps, fences, shrubs, and cozy cartoon campus
details. It explicitly excluded characters, baked task cards, text, numbers,
UI panels, logos, watermarks, and non-functional side rooms.
