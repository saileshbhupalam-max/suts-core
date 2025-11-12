/**
 * Mock for ora (ESM-only package)
 */

interface Ora {
  start: () => Ora;
  succeed: (text?: string) => Ora;
  fail: (text?: string) => Ora;
  text: string;
}

const mockOra = (text: string): Ora => {
  let currentText = text;

  return {
    start: () => mockOra(currentText),
    succeed: (successText?: string) => {
      if (successText !== undefined) {
        currentText = successText;
      }
      return mockOra(currentText);
    },
    fail: (failText?: string) => {
      if (failText !== undefined) {
        currentText = failText;
      }
      return mockOra(currentText);
    },
    get text() {
      return currentText;
    },
    set text(value: string) {
      currentText = value;
    },
  };
};

export default mockOra;
export type { Ora };
