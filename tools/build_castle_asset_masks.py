from pathlib import Path
import cv2, numpy as np

ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "assets" / "game-icons"
OUT_ROOT = ASSET_ROOT / "masks"

SOURCES = {
    "archer": "archer.webp",
    "swordsman": "swordsman.webp",
    "spearman": "spearman.webp",
    "cavalry": "cavalry.webp",
    "ladder": "ladder.webp",
    "ram": "ram.webp",
    "catapult": "catapult.webp",
    "scorpion": "scorpion.webp",
    "siege-tower": "siege-tower.webp",
    "coins": "coins.webp",
    "dragon-glass": "dragon-glass.webp",
    "fish": "fish.webp",
    "grain": "grain.webp",
    "grapes": "grapes.webp",
    "horses": "horses.webp",
    "iron": "iron.webp",
    "meat": "meat.webp",
    "stone": "stone.webp",
    "tar": "tar.webp",
    "wood": "wood.webp",
}

def segment_alpha(path: Path, max_side: int = 768) -> np.ndarray:
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        raise RuntimeError(f"Unable to read {path}")

    oh, ow = image.shape[:2]
    scale = min(1.0, max_side / max(ow, oh))
    small = cv2.resize(
        image,
        (max(1, round(ow * scale)), max(1, round(oh * scale))),
        interpolation=cv2.INTER_AREA,
    )
    h, w = small.shape[:2]

    mask = np.full((h, w), cv2.GC_PR_BGD, dtype=np.uint8)
    border = max(2, round(min(h, w) * 0.02))
    mask[:border, :] = cv2.GC_BGD
    mask[-border:, :] = cv2.GC_BGD
    mask[:, :border] = cv2.GC_BGD
    mask[:, -border:] = cv2.GC_BGD

    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

    probable_fg = (gray < 205) | ((hsv[:, :, 1] > 30) & (gray < 238))
    sure_fg = (gray < 145) | ((hsv[:, :, 1] > 65) & (gray < 225))
    mask[probable_fg] = cv2.GC_PR_FGD
    mask[sure_fg] = cv2.GC_FGD

    cv2.grabCut(small, mask, None, None, None, 3, cv2.GC_INIT_WITH_MASK)
    alpha = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8) * 255

    components, labels, stats, _ = cv2.connectedComponentsWithStats((alpha > 0).astype(np.uint8), 8)
    clean = np.zeros_like(alpha)
    min_area = max(20, int(0.0005 * h * w))
    for idx in range(1, components):
        if stats[idx, cv2.CC_STAT_AREA] >= min_area:
            clean[labels == idx] = 255

    alpha = cv2.morphologyEx(
        clean,
        cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)),
        iterations=1,
    )
    alpha = cv2.resize(alpha, (ow, oh), interpolation=cv2.INTER_LINEAR)
    return cv2.GaussianBlur(alpha, (0, 0), 0.6)

def contour_path(alpha: np.ndarray) -> str:
    h, w = alpha.shape
    binary = (alpha >= 80).astype(np.uint8) * 255
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    parts = []
    for contour in contours:
        if cv2.contourArea(contour) < 20:
            continue
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, max(0.8, perimeter * 0.004), True)
        points = approx.reshape(-1, 2)
        if len(points) < 3:
            continue
        parts.append("M " + " ".join(f"{int(x)},{int(y)}" for x, y in points) + " Z")

    return " ".join(parts)

def main() -> None:
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    for name, filename in SOURCES.items():
        source = ASSET_ROOT / filename
        if not source.exists():
            raise RuntimeError(f"Missing source asset: {source}")
        alpha = segment_alpha(source)
        path = contour_path(alpha)
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="0 0 {cv2.imread(str(source), cv2.IMREAD_GRAYSCALE).shape[1]} '
            f'{cv2.imread(str(source), cv2.IMREAD_GRAYSCALE).shape[0]}" '
            f'preserveAspectRatio="none"><path fill="#fff" fill-rule="evenodd" d="{path}"/></svg>\n'
        )
        (OUT_ROOT / f"{name}.svg").write_text(svg, encoding="utf-8")
        print(f"generated {name}.svg")

if __name__ == "__main__":
    main()
