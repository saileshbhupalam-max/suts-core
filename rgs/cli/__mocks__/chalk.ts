/**
 * Mock for chalk (ESM-only package)
 */

const passThrough = (str: string): string => str;

// Create chainable bold object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bold: any = Object.assign(passThrough, {
  cyan: passThrough,
  red: passThrough,
  green: passThrough,
  yellow: passThrough,
  blue: passThrough,
  gray: passThrough,
  white: passThrough,
});

const chalk = {
  green: passThrough,
  red: passThrough,
  yellow: passThrough,
  blue: passThrough,
  cyan: passThrough,
  gray: passThrough,
  white: passThrough,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bold,
};

export default chalk;
