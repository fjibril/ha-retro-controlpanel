// Setup file for vitest to ensure DOM is available
import { beforeAll } from 'vitest';

beforeAll(() => {
  // Ensure customElements is defined
  if (typeof customElements === 'undefined') {
    global.customElements = {
      define: () => {},
      get: () => undefined,
      whenDefined: () => Promise.resolve(),
    } as any;
  }
});
