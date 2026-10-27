"""Builds the LIAM name-seal mark with the letters outlined (no font needed).

Fetches Special Elite (TTF) from Google Fonts subset to "LIAM", turns each
glyph into an SVG path and writes the seal SVGs. Then run
`node scripts/build-icons.mjs` for the PNG / ICO sizes.

    pip install fonttools
    python scripts/make-seal.py .
"""
import io
import re
import sys
import urllib.parse
import urllib.request

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

REPO = sys.argv[1]

css = urllib.request.urlopen(
	'https://fonts.googleapis.com/css2?family=Special+Elite&text=' + urllib.parse.quote('LIAM')
).read().decode()
url = re.search(r"src: url\((.+?)\) format\('(?:truetype|opentype)'\)", css).group(1)
font = TTFont(io.BytesIO(urllib.request.urlopen(url).read()))
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font['head'].unitsPerEm
cap = font['OS/2'].sCapHeight or int(upm * 0.7)

RED = '#b3362b'
CREAM = '#f8f1df'


from fontTools.pens.boundsPen import BoundsPen


def bounds(ch):
	bp = BoundsPen(glyphs)
	glyphs[cmap[ord(ch)]].draw(bp)
	return bp.bounds


# Scale from the real ink height of "L" (the subset's OS/2 cap height is unreliable).
_lx0, _ly0, _lx1, _ly1 = bounds('L')
INK_CAP = _ly1 - _ly0


def glyph_path(ch, cx, baseline, cap_px):
	"""Path for `ch`, scaled so the ink cap height = cap_px, centred on cx, bottom on baseline."""
	xmin, ymin, xmax, ymax = bounds(ch)
	s = cap_px / INK_CAP
	mid = (xmin + xmax) / 2
	pen = SVGPathPen(glyphs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
	# Font units are y-up; SVG is y-down.
	t = TransformPen(pen, (s, 0, 0, -s, cx - mid * s, baseline + ymin * s))
	glyphs[cmap[ord(ch)]].draw(t)
	return pen.getCommands()


def seal(size=100, rx=7, inset=7, frame=2.2, cap_px=26):
	letters = [('L', 33, 45), ('I', 67, 45), ('A', 33, 79), ('M', 67, 79)]
	d = ' '.join(glyph_path(ch, x, y, cap_px) for ch, x, y in letters)
	return (
		f'<rect x="6" y="6" width="88" height="88" rx="{rx}" fill="{RED}"/>'
		f'<rect x="{6 + inset}" y="{6 + inset}" width="{88 - 2 * inset}" height="{88 - 2 * inset}" rx="3" fill="none" stroke="{CREAM}" stroke-width="{frame}"/>'
		f'<path d="{d}" fill="{CREAM}"/>'
	)


def svg(body, view='0 0 100 100', title='Liam 偵探手記'):
	return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}"><title>{title}</title>{body}</svg>\n'


# Main mark (transparent ground), used for favicon.svg and in-page. Wrapped in
# <g id="seal"> so the intro can draw it with <use href="/favicon.svg#seal">
# (an inline SVG, which unlike an <img> never counts as the page's LCP).
mark = svg(f'<g id="seal">{seal()}</g>')
open(f'{REPO}/src/lib/assets/brand/seal.svg', 'w', encoding='utf-8').write(mark)
open(f'{REPO}/static/favicon.svg', 'w', encoding='utf-8').write(mark)

# Small-size variant: thicker frame, bigger letters, so 16-32px stays crisp.
small = svg(seal(rx=8, inset=6, frame=3, cap_px=28))
open(f'{REPO}/src/lib/assets/brand/seal-small.svg', 'w', encoding='utf-8').write(small)

# App icons sit on index-card stock with breathing room (iOS / Android mask the corners).
icon = svg(
	f'<rect width="100" height="100" fill="{CREAM}"/><g transform="translate(14 14) scale(.72)">{seal()}</g>'
)
open(f'{REPO}/src/lib/assets/brand/app-icon.svg', 'w', encoding='utf-8').write(icon)
print('ok', upm, cap)
