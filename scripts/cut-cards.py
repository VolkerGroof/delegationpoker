"""One-shot: cut the 7 delegation cards out of the source PNG.

The source `Delegation Poker Cards.png` is a 4-col x 2-row grid:
    1 Tell    | 2 Sell    | 3 Consult | 4 Agree
    5 Advise  | 6 Inquire | 7 Delegate| (Management 3.0 credit -- ignored)

We split the image into 8 equal cells, auto-crop transparent/white margins
per cell, and save the first 7 as numbered card PNGs.

Also generates a face-down `back.png` in the Groof purple.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "Delegation Poker Cards.png"
OUT = ROOT / "public" / "cards"
OUT.mkdir(parents=True, exist_ok=True)

CARD_NAMES = [
    (1, "tell"),
    (2, "sell"),
    (3, "consult"),
    (4, "agree"),
    (5, "advise"),
    (6, "inquire"),
    (7, "delegate"),
]

GROOF_PURPLE = (91, 65, 214, 255)
GROOF_CYAN = (34, 183, 238, 255)


def trim(img: Image.Image, bg=(255, 255, 255, 0)) -> Image.Image:
    """Trim outer transparent / near-white pixels."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    # Build a mask of "non-background" pixels: alpha > 8 AND not nearly white
    px = img.load()
    w, h = img.size
    left, top, right, bottom = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            if r > 245 and g > 245 and b > 245:
                continue
            if x < left:
                left = x
            if x > right:
                right = x
            if y < top:
                top = y
            if y > bottom:
                bottom = y
            found = True
    if not found:
        return img
    pad = 8
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(w, right + 1 + pad)
    bottom = min(h, bottom + 1 + pad)
    return img.crop((left, top, right, bottom))


def cut_cards():
    src = Image.open(SRC).convert("RGBA")
    W, H = src.size
    cw, ch = W // 4, H // 2
    for i, (num, name) in enumerate(CARD_NAMES):
        col = i % 4
        row = i // 4
        cell = src.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
        cropped = trim(cell)
        out_path = OUT / f"{num}-{name}.png"
        cropped.save(out_path, "PNG")
        print(f"  {out_path.name}: {cropped.size}")


def make_back():
    """A simple, branded face-down card.

    Solid Groof purple background with rounded corners, a thin cyan inner
    border, and the word 'Groof' in white centered vertically.
    """
    w, h = 360, 480
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = 36
    d.rounded_rectangle((0, 0, w, h), radius=radius, fill=GROOF_PURPLE)
    d.rounded_rectangle((14, 14, w - 14, h - 14), radius=radius - 8,
                        outline=GROOF_CYAN, width=4)
    # Diagonal stripes pattern
    for offset in range(-h, w, 28):
        d.line([(offset, 0), (offset + h, h)], fill=(255, 255, 255, 24), width=4)
    # Centered "Groof" text
    text = "Groof"
    font = None
    for candidate in [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]:
        try:
            font = ImageFont.truetype(candidate, 64)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    d.text(((w - tw) // 2 - bbox[0], (h - th) // 2 - bbox[1]), text,
           fill=(255, 255, 255, 255), font=font)
    out_path = OUT / "back.png"
    img.save(out_path, "PNG")
    print(f"  {out_path.name}: {img.size}")


if __name__ == "__main__":
    print("Cutting cards from", SRC)
    cut_cards()
    print("Generating back.png")
    make_back()
    print("Done.")
