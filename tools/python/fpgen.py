#!/usr/bin/env python3
"""
Empirical Armory fingerprint generator.

The same renderer used for every fingerprint in the logo survey, packaged on its own.
Given the same parameters (including seed and canvas size) it produces exactly the same print.

Usage
  python3 fpgen.py --list                              list the presets
  python3 fpgen.py S01_seed1                           render one preset to out/S01_seed1.svg (+ .png)
  python3 fpgen.py --all                               render every preset
  python3 fpgen.py S01_seed1 --set lam=3.5 seed=7      override parameters on the fly
  python3 fpgen.py S01_seed1 --shape "M10 10 L200 10 L200 300 Z" --canvas 320 320
                                                       print inside your own shape (absolute M L C Q Z commands only)

Needs: Python 3.9+, numpy, pillow. For vector output also the free `potrace` command
(macOS: brew install potrace · Windows: potrace.sourceforge.net · Linux: apt install potrace).
Without potrace you still get the PNG.
"""
import argparse, base64, io, json, math, os, re, shutil, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SS = 3  # supersampling: raster pixels per unit

# ---------------------------------------------------------------- shape
def parse(d, steps=24):
    toks = re.findall(r"[MLCQZ]|-?\d*\.?\d+", d)
    polys, cur, i, pos, start = [], [], 0, (0, 0), (0, 0)
    while i < len(toks):
        t = toks[i]; i += 1
        if t == "M":
            if cur: polys.append(cur)
            pos = (float(toks[i]), float(toks[i+1])); i += 2; start = pos; cur = [pos]
        elif t == "L":
            pos = (float(toks[i]), float(toks[i+1])); i += 2; cur.append(pos)
        elif t == "Q":
            c = (float(toks[i]), float(toks[i+1])); e = (float(toks[i+2]), float(toks[i+3])); i += 4
            for k in range(1, steps + 1):
                u = k / steps
                cur.append(((1-u)**2*pos[0] + 2*(1-u)*u*c[0] + u*u*e[0], (1-u)**2*pos[1] + 2*(1-u)*u*c[1] + u*u*e[1]))
            pos = e
        elif t == "C":
            c1 = (float(toks[i]), float(toks[i+1])); c2 = (float(toks[i+2]), float(toks[i+3])); e = (float(toks[i+4]), float(toks[i+5])); i += 6
            for k in range(1, steps + 1):
                u = k / steps; v = 1 - u
                cur.append((v**3*pos[0] + 3*v*v*u*c1[0] + 3*v*u*u*c2[0] + u**3*e[0], v**3*pos[1] + 3*v*v*u*c1[1] + 3*v*u*u*c2[1] + u**3*e[1]))
            pos = e
        elif t == "Z":
            pos = start
    if cur: polys.append(cur)
    return polys

# ---------------------------------------------------------------- renderer
class Canvas:
    def __init__(self, tw, th):
        self.TW, self.TH = tw, th
        self.W, self.H = tw * SS, th * SS
        self.Xu, self.Yu = np.meshgrid(np.arange(self.W) / SS, np.arange(self.H) / SS)
    def noise(self, rng, cell, amp=1.0):
        gw, gh = int(self.TW / cell) + 3, int(self.TH / cell) + 3
        a = (rng.random((gh, gw)) * 255).astype(np.uint8)
        im = Image.fromarray(a).resize((int(gw * cell * SS), int(gh * cell * SS)), Image.BICUBIC)
        return np.asarray(im, dtype=np.float32)[:self.H, :self.W] / 255.0 * amp
    def mask(self, d, union, blur=1.2):
        im = Image.new("L", (self.W, self.H), 0); dr = ImageDraw.Draw(im)
        for i, p in enumerate(parse(d)):
            dr.polygon([(x * SS, y * SS) for x, y in p], fill=255 if (i == 0 or union) else 0)
        im = im.filter(ImageFilter.GaussianBlur(blur * SS))
        return np.asarray(im, dtype=np.float32) / 255.0, im

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

DEFAULTS = dict(seed=1, kind="loop", core=[150, 110], rot=-10, lam=2.9, ax=1.0, ay=1.12, spiral=0.0,
                fade=[0.2, 0.92], grease=0.9, grease_cell=22, dry=0.5, speck=0.18, heavy=0.0, thick=0.0,
                fdir=[1.0, 0.0], fcenter=None, fmode=None, reverse=False, union=False)

def render(cv, d, p):
    """Returns the ink coverage (0/1 float array, SS px per unit) for shape d with parameters p."""
    p = {**DEFAULTS, **p}
    Xu, Yu, noise = cv.Xu, cv.Yu, cv.noise
    rng = np.random.default_rng(p["seed"])
    m, mim = cv.mask(d, p["union"])
    m_hard = (m + (noise(rng, 5) - 0.5) * 0.55) > 0.5                     # irregular edge
    fdx, fdy = p["fdir"]
    pr = Xu * fdx + Yu * fdy
    x0, x1 = pr[m > 0.5].min(), pr[m > 0.5].max()
    fx = (pr - x0) / (x1 - x0)                                            # 0..1 across the shape, along fdir
    if p["fcenter"] is not None:
        dd = np.hypot(Xu - p["fcenter"][0], Yu - p["fcenter"][1]); fx = dd / dd[m > 0.5].max()
    if p["fmode"] == "edges": fx = 1 - np.abs(2 * fx - 1)
    if p["reverse"]: fx = 1 - fx
    wx = noise(rng, 14, 1) - 0.5; wy = noise(rng, 14, 1) - 0.5
    Xw, Yw = Xu + wx * 5, Yu + wy * 5                                     # organic wobble of the ridges
    c, s = math.cos(math.radians(p["rot"])), math.sin(math.radians(p["rot"]))
    cx, cy = p["core"]
    rx = ((Xw - cx) * c + (Yw - cy) * s) / p["ax"]
    ry = (-(Xw - cx) * s + (Yw - cy) * c) / p["ay"]
    lam = p["lam"]
    if p["kind"] == "whorl":
        phi = np.hypot(rx, ry) + p["spiral"] * lam * np.arctan2(ry, rx) / (2 * math.pi)
    elif p["kind"] == "arch":
        phi = ry + 26 * np.exp(-(rx / 60) ** 2) * smoothstep(90, -20, ry)
    else:  # loop
        dist = np.where(ry < 0, np.hypot(rx, ry), np.abs(rx))
        w = smoothstep(40, 100, ry)
        phi = dist * (1 - w) + (ry * 0.6 + 18) * w
    v = np.cos(2 * math.pi * phi / lam)                                   # the ridges
    t = np.full_like(v, 0.06 - p["thick"])                                # threshold: lower = thicker ridges
    hf = noise(rng, 0.7); pores = noise(rng, 0.45)
    t += (hf - 0.5) * 0.8 + (pores - 0.5) * 0.6                           # breaks and pores
    t += 0.55 * smoothstep(0.62, 0.8, noise(rng, 3.5))                    # small gaps
    t -= p["grease"] * smoothstep(0.58, 0.8, noise(rng, p["grease_cell"])) * (1.2 - fx)   # grease pools
    t -= p["heavy"] * smoothstep(0.3, 0.6, noise(rng, 40)) * (1 - fx)     # heavy pressure
    t += p["dry"] * smoothstep(0.62, 0.85, noise(rng, 20))                # dry patches
    ff = fx + (noise(rng, 10) - 0.5) * 0.22
    t += 1.35 * smoothstep(p["fade"][0], p["fade"][1], ff)                # the fade
    ink = (v > t) & m_hard
    dil = np.asarray(mim.filter(ImageFilter.MaxFilter(int(10 * SS) | 1)), dtype=np.float32) / 255 > 0.3
    sp_p = p["speck"] * np.exp(-((ff - 0.78) / 0.22) ** 2)
    ink = ink | ((noise(rng, 0.45) > 1 - sp_p * 0.9) & dil & (hf > 0.35))  # specks where the print disperses
    return ink.astype(np.float32)

# ---------------------------------------------------------------- output
def to_svg(ink, tw, th, colour, viewbox=None, desc=""):
    if not shutil.which("potrace"):
        return None
    pbm = "_fp_tmp.pbm"; out = "_fp_tmp.svg"
    Image.fromarray(((ink < 0.5) * 255).astype(np.uint8)).convert("1").save(pbm)
    subprocess.run(["potrace", "-s", "--flat", "-t", "3", "-a", "1.0", "-O", "0.4", "-o", out, pbm], check=True)
    t = open(out).read(); os.remove(pbm); os.remove(out)
    g = re.search(r'<g transform="([^"]+)"[^>]*>(.*?)</g>', t, re.S)
    body = re.sub(r'fill="[^"]*"', "", g.group(2))
    vb = viewbox or [0, 0, tw, th]
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" version="1.1" '
            f'viewBox="{vb[0]} {vb[1]} {vb[2]} {vb[3]}" width="{vb[2]}" height="{vb[3]}"><desc>{desc}</desc>'
            f'<g id="fingerprint" fill="{colour}" stroke="none"><g transform="scale({1/SS:.6f})"><g transform="{g.group(1)}">{body}</g></g></g></svg>')

def run(name, preset, outdir="out"):
    tw, th = preset.get("canvas", [420, 420])
    d = preset.get("shape") or f"M-30 -30 L{tw+30} -30 L{tw+30} {th+30} L-30 {th+30} Z"
    cv = Canvas(tw, th)
    ink = render(cv, d, preset["params"])
    os.makedirs(outdir, exist_ok=True)
    a = (ink * 255).astype(np.uint8)
    Image.fromarray(255 - a).save(f"{outdir}/{name}.png")                # black print on white, SS px per unit
    svg = to_svg(ink, tw, th, preset.get("colour", "#1a1715"), preset.get("viewbox"), json.dumps({"canvas": [tw, th], **preset["params"]}))
    if svg: open(f"{outdir}/{name}.svg", "w").write(svg)
    return ink

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    presets = json.load(open(os.path.join(here, "presets.json")))
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*"); ap.add_argument("--all", action="store_true"); ap.add_argument("--list", action="store_true")
    ap.add_argument("--set", nargs="*", default=[]); ap.add_argument("--shape"); ap.add_argument("--canvas", nargs=2, type=int)
    ap.add_argument("--out", default="out")
    a = ap.parse_args()
    if a.list:
        for k, v in presets.items(): print(k)
        sys.exit()
    for n in (list(presets) if a.all else a.names):
        pr = json.loads(json.dumps(presets[n]))
        for kv in a.set:
            k, v = kv.split("=", 1); pr["params"][k] = json.loads(v) if v[:1] in "[{-0123456789tfn" else v
        if a.shape: pr["shape"] = a.shape
        if a.canvas: pr["canvas"] = a.canvas
        run(n, pr, os.path.join(a.out, pr.get("folder", ""))); print("rendered", n)
