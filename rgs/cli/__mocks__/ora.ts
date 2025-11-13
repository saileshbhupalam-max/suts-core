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
    start: (): Ora => mockOra(currentText),
    succeed: (successText?: string): Ora => {
      if (successText !== undefined) {
        currentText = successText;
      }
      return mockOra(currentText);
    },
    fail: (failText?: string): Ora => {
      if (failText !== undefined) {
        currentText = failText;
      }
      return mockOra(currentText);
    },
    get text(): string {
      return currentText;
    },
    set text(value: string) {
      currentText = value;
    },
  };
};

export default mockOra;
export type { Ora };
