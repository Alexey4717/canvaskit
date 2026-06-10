export const randomBetween = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomBetween(min, max + 1));
};

export const randomHexColor = (): number => {
  return randomInt(0, 0xffffff);
};
