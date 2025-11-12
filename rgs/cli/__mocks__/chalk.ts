/**
 * Mock for chalk (ESM-only package)
 */

const passThrough = (str: string) => str;

const bold = {
  cyan: passThrough,
};

const chalk = {
  green: passThrough,
  red: passThrough,
  yellow: passThrough,
  blue: passThrough,
  cyan: passThrough,
  gray: passThrough,
  white: passThrough,
  bold,
};

export default chalk;
