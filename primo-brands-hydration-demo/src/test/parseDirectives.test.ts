import { describe, it, expect } from 'vitest';
import { parseUIDirective } from '@/services/agentforce/parseDirectives';

describe('parseUIDirective', () => {
  it('parses directive from metadata', () => {
    const response = {
      message: 'Here are some products',
      metadata: {
        uiDirective: {
          action: 'SHOW_PRODUCTS',
          payload: { products: [] },
        },
      },
    };

    const result = parseUIDirective(response);
    expect(result).toBeDefined();
    expect(result!.action).toBe('SHOW_PRODUCTS');
  });

  it('parses directive from embedded JSON in rawText', () => {
    const response = {
      message: 'Here are products',
      rawText: 'Some text {"uiDirective": {"action": "SHOW_PRODUCT", "payload": {"products": []}}} more text',
    };

    const result = parseUIDirective(response);
    expect(result).toBeDefined();
    expect(result!.action).toBe('SHOW_PRODUCT');
  });

  it('returns undefined when no directive present', () => {
    const response = {
      message: 'Just a plain response',
    };

    const result = parseUIDirective(response);
    expect(result).toBeUndefined();
  });

  it('prefers metadata over rawText', () => {
    const response = {
      message: 'test',
      metadata: {
        uiDirective: {
          action: 'INITIATE_CHECKOUT',
          payload: {},
        },
      },
      rawText: '{"uiDirective": {"action": "SHOW_PRODUCT", "payload": {}}}',
    };

    const result = parseUIDirective(response);
    expect(result!.action).toBe('INITIATE_CHECKOUT');
  });
});
