# Parameter chart

Every file is `fp_<pattern>_<weight>_<fade>.svg`. Its settings are the pattern row + the weight row + the fade row below, plus the fixed values. The same table, one line per file, is in `parameters.csv`; each SVG also carries its full recipe in its `<desc>`.

## Pattern

| Name | kind | rot | core | spiral |
|---|---|---|---|---|
| `loop` | loop | −10 | 210, 405 | 0 |
| `whorl` | whorl | −10 | 210, 210 | 0.5 |
| `arch` | arch | 0 | 210, 210 | 0 |

## Weight

| Name | thick | heavy | grease | dry | Look |
|---|---|---|---|---|---|
| `standard` | 0.1 | 1.5 | 1.3 | 0.5 | The survey’s main print (Rounds 12–13, 40–48) |
| `crisp` | −0.28 | 0 | 0 | 0.9 | Thin, even ridges, no grease (Rounds 15, 39, 45: white ridges on black) |
| `light` | 0.1 | 0.3 | 0.35 | 1.2 | Dry, delicate touch |
| `heavy` | 0.3 | 2.3 | 1.9 | 0.5 | Hard press, nearly solid |

## Fade

| Name | fdir | fcenter | fade (start → end) |
|---|---|---|---|
| `nofade` | 1, 0 | – | 1.6 → 2.2 (never reached, so no fade) |
| `fadeout-right` | 1, 0 | – | 0.25 → 0.95 |
| `fadeout-left` | −1, 0 | – | 0.25 → 0.95 |
| `fadeout-up` | 0, −1 | – | 0.25 → 0.95 |
| `fadeout-down` | 0, 1 | – | 0.25 → 0.95 |
| `fadeout-radial` | 1, 0 | 210, 210 | 0.20 → 0.95 |

Fade start and end are fractions of the way across the sheet, from the heavy side (0) to the far side (1).

## Fixed in every file

| Parameter | Value |
|---|---|
| canvas | 420 × 420 units |
| lam (ridge spacing) | 2.9 |
| ax, ay | 1.0, 1.12 |
| grease_cell | 22 |
| speck | 0.18 |
| seed | 1 |

## What each parameter does

| Parameter | Effect |
|---|---|
| kind | Ridge layout: loop, whorl or arch |
| rot | Rotation of the ridge layout, degrees |
| core | Centre of the pattern, in units from the top-left |
| spiral | Whorl only: how much the rings spiral |
| thick | Ridge thickness: higher is fatter, negative is thinner |
| heavy | Broad areas pressed hard enough to print solid |
| grease | Dark grease pools between ridges |
| dry | Pale patches where ridges break up |
| fdir | Direction the print fades toward |
| fcenter | Fade outward from this point instead |
| fade | Where the fade starts and ends |
| lam | Distance between ridges, in units |
| ax, ay | Stretch of the pattern across / along |
| grease_cell | Size of the grease pools, in units |
| speck | Loose specks where the print disperses |
| seed | Random layout; any whole number |
| canvas | Size of the rendered area; part of the recipe (a different size gives a different layout) |
