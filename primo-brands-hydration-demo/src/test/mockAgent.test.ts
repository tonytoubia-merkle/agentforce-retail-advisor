import { describe, it, expect } from 'vitest';
import { generateMockResponse } from '@/services/mock/mockAgent';

describe('generateMockResponse', () => {
  it('returns moisturizer product for hydration query', async () => {
    const response = await generateMockResponse('I need a moisturizer');
    expect(response.message).toContain('Hydra-Calm');
    expect(response.uiDirective?.action).toBe('SHOW_PRODUCT');
    expect(response.uiDirective?.payload.products).toHaveLength(1);
    expect(response.uiDirective?.payload.products![0].id).toBe('moisturizer-sensitive');
  });

  it('returns travel products for travel query', async () => {
    const response = await generateMockResponse('I am going on a trip to India');
    expect(response.uiDirective?.action).toBe('SHOW_PRODUCTS');
    expect(response.uiDirective?.payload.products!.length).toBeGreaterThan(1);
    expect(response.uiDirective?.payload.sceneContext?.setting).toBe('travel');
  });

  it('initiates checkout for purchase intent', async () => {
    const response = await generateMockResponse('buy it');
    expect(response.uiDirective?.action).toBe('INITIATE_CHECKOUT');
  });

  it('returns cleanser for cleanser query', async () => {
    const response = await generateMockResponse('I need a face wash');
    expect(response.uiDirective?.action).toBe('SHOW_PRODUCT');
    expect(response.uiDirective?.payload.products![0].category).toBe('cleanser');
  });

  it('returns serums for serum query', async () => {
    const response = await generateMockResponse('show me serums');
    expect(response.uiDirective?.action).toBe('SHOW_PRODUCTS');
    expect(response.uiDirective?.payload.products!.every((p) => p.category === 'serum')).toBe(true);
  });

  it('returns sunscreen for SPF query', async () => {
    const response = await generateMockResponse('I need sunscreen');
    expect(response.uiDirective?.action).toBe('SHOW_PRODUCT');
    expect(response.uiDirective?.payload.products![0].id).toBe('sunscreen-lightweight');
  });

  it('returns acne products for breakout query', async () => {
    const response = await generateMockResponse('I have acne');
    expect(response.uiDirective?.action).toBe('SHOW_PRODUCT');
    expect(response.uiDirective?.payload.products![0].id).toBe('cleanser-acne');
  });

  it('returns anti-aging products for wrinkle query', async () => {
    const response = await generateMockResponse('help with wrinkles');
    expect(response.uiDirective?.action).toBe('SHOW_PRODUCTS');
    expect(response.uiDirective?.payload.products!.length).toBe(2);
  });

  it('returns routine for routine query', async () => {
    const response = await generateMockResponse('build me a skincare routine');
    expect(response.uiDirective?.action).toBe('SHOW_PRODUCTS');
    expect(response.uiDirective?.payload.products!.length).toBe(4);
  });

  it('resets scene for goodbye', async () => {
    const response = await generateMockResponse('thanks bye');
    expect(response.uiDirective?.action).toBe('RESET_SCENE');
  });

  it('returns suggested actions for unmatched query', async () => {
    const response = await generateMockResponse('asdfghjkl');
    expect(response.suggestedActions).toBeDefined();
    expect(response.suggestedActions!.length).toBeGreaterThan(0);
    expect(response.uiDirective).toBeUndefined();
  });

  it('returns greeting for hello', async () => {
    const response = await generateMockResponse('hello');
    expect(response.message).toContain('Welcome');
    expect(response.suggestedActions!.length).toBeGreaterThan(0);
  });
});
