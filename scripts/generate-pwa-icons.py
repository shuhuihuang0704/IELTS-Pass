from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
FONT_CANDIDATES = [
    "/System/Library/Fonts/SFNS.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in FONT_CANDIDATES:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


canvas = Image.new("RGB", (512, 512), "#F6F6F8")
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle((48, 48, 464, 464), radius=112, fill="#5B54D6")
draw.rounded_rectangle((74, 74, 438, 438), radius=92, outline="#766FE4", width=4)
font = load_font(168)
draw.text((256, 252), "IP", font=font, fill="white", anchor="mm", stroke_width=1)

canvas.save(ROOT / "public" / "icon-512.png", optimize=True)
canvas.resize((192, 192), Image.Resampling.LANCZOS).save(ROOT / "public" / "icon-192.png", optimize=True)
