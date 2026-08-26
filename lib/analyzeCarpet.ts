export type ScanResult = {
  annotatedImage: string;
  visualScore: number;
  flaggedTiles: number;
  totalTiles: number;
  flaggedPercent: number;
};

type Tile = {
  x: number;
  y: number;
  width: number;
  height: number;
  brightness: number;
  greenBalance: number;
  score: number;
};

const keepBetween = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

function middleValue(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function readTile(
  pixels: Uint8ClampedArray,
  imageWidth: number,
  x: number,
  y: number,
  width: number,
  height: number,
): Tile {
  let brightnessTotal = 0;
  let greenTotal = 0;
  let samples = 0;

  // Every second pixel is enough for this small visual screen and keeps it fast.
  for (let row = y; row < y + height; row += 2) {
    for (let column = x; column < x + width; column += 2) {
      const pixel = (row * imageWidth + column) * 4;
      const red = pixels[pixel];
      const green = pixels[pixel + 1];
      const blue = pixels[pixel + 2];

      brightnessTotal += (red + green + blue) / 3;
      greenTotal += green - (red + blue) / 2;
      samples += 1;
    }
  }

  return {
    x,
    y,
    width,
    height,
    brightness: brightnessTotal / samples,
    greenBalance: greenTotal / samples,
    score: 0,
  };
}

/**
 * Finds regions that look different from the rest of one carpet photo.
 * This is visual comparison, not mold or bacteria identification.
 */
export async function analyzeCarpetPhoto(file: File): Promise<ScanResult> {
  const photo = await createImageBitmap(file);
  const longestSide = 720;
  const scale = Math.min(1, longestSide / Math.max(photo.width, photo.height));
  const imageWidth = Math.max(1, Math.round(photo.width * scale));
  const imageHeight = Math.max(1, Math.round(photo.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    photo.close();
    throw new Error("This browser could not prepare the image scanner.");
  }

  context.drawImage(photo, 0, 0, imageWidth, imageHeight);
  photo.close();

  const pixels = context.getImageData(0, 0, imageWidth, imageHeight).data;
  const columns = 8;
  const rows = Math.max(5, Math.round((imageHeight / imageWidth) * columns));
  const tileWidth = imageWidth / columns;
  const tileHeight = imageHeight / rows;
  const tiles: Tile[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = Math.floor(column * tileWidth);
      const y = Math.floor(row * tileHeight);
      const width = Math.min(imageWidth - x, Math.ceil(tileWidth));
      const height = Math.min(imageHeight - y, Math.ceil(tileHeight));
      tiles.push(readTile(pixels, imageWidth, x, y, width, height));
    }
  }

  // The photo becomes its own baseline, so no personal image leaves the browser.
  const normalBrightness = middleValue(tiles.map((tile) => tile.brightness));
  const normalGreen = middleValue(tiles.map((tile) => tile.greenBalance));

  for (const tile of tiles) {
    const darker = keepBetween((normalBrightness - tile.brightness - 8) / 45, 0, 1);
    const greener = keepBetween((tile.greenBalance - normalGreen - 4) / 26, 0, 1);
    tile.score = Math.round(100 * (darker * 0.6 + greener * 0.4));
  }

  const flagged = tiles.filter((tile) => tile.score >= 34);
  context.lineWidth = Math.max(2, imageWidth / 280);
  context.strokeStyle = "rgba(111, 226, 255, 0.95)";

  flagged.forEach((tile) => {
    context.fillStyle = "rgba(196, 255, 45, 0.28)";
    context.fillRect(tile.x, tile.y, tile.width, tile.height);
    context.strokeRect(tile.x + 1, tile.y + 1, tile.width - 2, tile.height - 2);
  });

  const strongest = [...tiles].sort((a, b) => b.score - a.score).slice(0, 6);
  const visualScore = Math.round(
    strongest.reduce((total, tile) => total + tile.score, 0) / strongest.length,
  );

  return {
    annotatedImage: canvas.toDataURL("image/jpeg", 0.88),
    visualScore,
    flaggedTiles: flagged.length,
    totalTiles: tiles.length,
    flaggedPercent: Math.round((flagged.length / tiles.length) * 100),
  };
}
