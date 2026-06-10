interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const hexToRgba = (hexColor: number, alpha = 1): RgbaColor => {
  const r = (hexColor >> 16) & 0xff;
  const g = (hexColor >> 8) & 0xff;
  const b = hexColor & 0xff;

  return { r, g, b, a: alpha };
};
