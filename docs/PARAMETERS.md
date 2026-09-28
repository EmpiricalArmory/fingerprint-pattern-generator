# Recipe fields

A recipe is the app’s full set of settings as JSON. Units are canvas units, which are points (pt) in Illustrator.

## Canvas and shape

| Field | Meaning |
|---|---|
| `w`, `h` | Canvas size. Part of the recipe: the same settings on another canvas size give a different random layout. |
| `shape` | `schilt`, `sheet`, `square` (rounded square), `circle`, or `custom` (your uploaded SVG; the SVG itself is not stored in the recipe) |
| `blade` | Schilt only: blade length above the shoulders, in blade widths |
| `tilt` | Schilt only: rotation of the shape (the print does not rotate with it) |
| `margin` | Space between the shape and the canvas edge |

## Pattern

| Field | Meaning |
|---|---|
| `kind` | `loop`, `whorl` or `arch` |
| `rot` | Rotation of the ridge pattern, degrees |
| `core` | Centre of the pattern `[x, y]`; drag on the preview to set it |
| `spiral` | Whorl only: how much the rings spiral |
| `lam` | Distance between ridges |
| `ax`, `ay` | Stretch of the pattern across / along |

## Ink

| Field | Meaning | Standard | Crisp | Light | Heavy |
|---|---|---|---|---|---|
| `thick` | Ridge thickness; higher is fatter, negative thinner | 0.1 | −0.28 | 0.1 | 0.3 |
| `heavy` | Broad areas pressed solid | 1.5 | 0 | 0.3 | 2.3 |
| `grease` | Dark grease pools between ridges | 1.3 | 0 | 0.35 | 1.9 |
| `dry` | Pale patches where ridges break up | 0.5 | 0.9 | 1.2 | 0.5 |
| `grease_cell` | Size of the grease pools | 22 | 22 | 22 | 22 |
| `speck` | Loose specks where the print fades | 0.18 | 0.18 | 0.18 | 0.18 |
| `seed` | Random layout; any whole number | 1 | 1 | 1 | 1 |

## Fade

| Field | Meaning |
|---|---|
| `fmode` | `dir` (along a direction), `radial` (out from a point) or `edges` (heavy at both edges) |
| `fdir` | Direction the print fades toward: `[1,0]` right, `[-1,0]` left, `[0,-1]` up, `[0,1]` down |
| `fade` | `[start, end]` as fractions across the shape (0 = heavy side). A start of 1.5 or more means no fade. |
| `fcenter` | Radial fade centre `[x, y]`; shift-drag on the preview to set it |

## Colour

| Field | Meaning |
|---|---|
| `mode` | `negative`, `positive`, `white`, `cutout` or `custom` |
| `ink`, `ground`, `paper` | Colours of the ridges, the shape behind them, and the preview background |
| `inkNone`, `groundNone`, `paperNone` | `true` makes that part transparent. Ridges set to none are cut out of the ground. Paper is preview only. |
