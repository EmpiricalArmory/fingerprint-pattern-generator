# Python renderer (optional)

`fpgen.py` is the renderer used for the fingerprints in the Empirical Armory logo survey. It is not needed by the website.

Requirements: Python 3.9+, `pip install numpy pillow`, and the free `potrace` for vector output (macOS: `brew install potrace`).

```
python3 fpgen.py --list                                      # the 72 presets in presets.json
python3 fpgen.py fp_loop_standard_fadeout-right              # → out/fadeout-right/…svg and .png
python3 fpgen.py fp_loop_standard_fadeout-right --set seed=7 # change any parameter
```

`PARAMETERS-python-set.md` in `docs/` describes these presets. The look matches the web app, but the random generator differs, so the same seed gives a different layout here than in the app.
