# E1.4 D Asset Quality Report

Generated at: 2026-06-01

## Summary

- Checked assets: 41
- Passed: 34
- Reported only: 7
- Failed: 0
- Edge rule: non-tile transparent assets and every spritesheet frame must have 0 opaque pixels on the outer 1px edge.

| Group | Total | Passed | Reported | Failed |
| --- | ---: | ---: | ---: | ---: |
| advanced_action_sheets | 6 | 6 | 0 | 0 |
| mvp_proxy_sheets | 4 | 4 | 0 | 0 |
| portraits | 14 | 14 | 0 | 0 |
| props | 10 | 10 | 0 | 0 |
| tiles | 7 | 0 | 7 | 0 |

## Scale Preview Outputs

- 64px contact sheet: `assets/review/d/e1_4_scale_64_contact_sheet.png`
- 96px contact sheet: `assets/review/d/e1_4_scale_96_contact_sheet.png`
- Preview item count: 89. Order and labels are stored in `assets/review/d/e1_4_asset_quality_report.json` under `previewItems`.

## Edge Issues

| Group | Asset | Issue | File |
| --- | --- | --- | --- |
| none | none | none | none |

## Notes

- Tiles are reported instead of failed because some tile assets are allowed to fill their full 128px frame.
- Spritesheets are checked per action frame, not only around the outer sheet boundary.
- Re-run with `pnpm asset:quality`.
