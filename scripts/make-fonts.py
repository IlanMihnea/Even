"""Instantiate static TTF instances from the EVEN variable fonts so pdfmake/pdfkit
can embed distinct Regular/Bold/Italic/BoldItalic styles."""
import os
from fontTools import ttLib
from fontTools.varLib.instancer import instantiateVariableFont

FONTS = os.path.join(os.path.dirname(__file__), "..", "api", "_contracts", "fonts")

def make(src, axes, out):
    f = ttLib.TTFont(os.path.join(FONTS, src))
    instantiateVariableFont(f, axes, inplace=True)
    # Drop GSUB so pdfkit doesn't apply the broken fi/fl ligatures
    # ("edificate" -> "edifcate"). Not needed for a Romanian contract.
    for tag in ("GSUB", "GPOS"):
        if tag in f:
            del f[tag]
    f.save(os.path.join(FONTS, out))
    print("  ->", out)

# DM Sans (body) — opsz pinned to text size 14
print("DM Sans:")
make("DMSans-VF.ttf",        {"opsz": 14, "wght": 400}, "DMSans-Regular.ttf")
make("DMSans-VF.ttf",        {"opsz": 14, "wght": 700}, "DMSans-Bold.ttf")
make("DMSans-Italic-VF.ttf", {"opsz": 14, "wght": 400}, "DMSans-Italic.ttf")
make("DMSans-Italic-VF.ttf", {"opsz": 14, "wght": 700}, "DMSans-BoldItalic.ttf")

# Cormorant Garamond (display) — single wght axis
print("Cormorant Garamond:")
make("Cormorant-VF.ttf",        {"wght": 500}, "Cormorant-Regular.ttf")
make("Cormorant-VF.ttf",        {"wght": 700}, "Cormorant-Bold.ttf")
make("Cormorant-Italic-VF.ttf", {"wght": 500}, "Cormorant-Italic.ttf")
make("Cormorant-Italic-VF.ttf", {"wght": 700}, "Cormorant-BoldItalic.ttf")

print("done")
