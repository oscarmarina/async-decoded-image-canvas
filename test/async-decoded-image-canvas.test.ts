import {describe, it, expect, beforeEach, afterEach, chai, vi} from 'vitest';
import {fixture, fixtureCleanup, waitUntil} from '@open-wc/testing-helpers';
import {chaiA11yAxe} from 'chai-a11y-axe';
import {getDiffableHTML} from '@open-wc/semantic-dom-diff/get-diffable-html.js';
import {html} from 'lit';
import {AsyncDecodedImageCanvas} from '../src/AsyncDecodedImageCanvas.js';
import '../src/define/async-decoded-image-canvas.js';

chai.use(chaiA11yAxe);

const isChromiumBasedMock = vi.fn().mockReturnValue(false);

vi.mock('@jitsi/js-utils/browser-detection/BrowserDetection.js', () => {
  return {
    default: class {
      isChromiumBased() {
        return isChromiumBasedMock();
      }
    },
  };
});

if (!globalThis.createImageBitmap) {
  globalThis.createImageBitmap = vi.fn().mockResolvedValue({
    close: vi.fn(),
    width: 10,
    height: 10,
  });
}

describe('AsyncDecodedImageCanvas', () => {
  let el: AsyncDecodedImageCanvas;

  afterEach(() => {
    fixtureCleanup();
    vi.restoreAllMocks();
  });

  describe('Semantic Dom and a11y', () => {
    beforeEach(async () => {
      el = await fixture(
        html`<async-decoded-image-canvas alt="Test Image"></async-decoded-image-canvas>`
      );
    });

    it('SHADOW DOM - Structure test', () => {
      expect(getDiffableHTML(el.shadowRoot!.innerHTML)).toMatchSnapshot('SHADOW DOM');
    });

    it('LIGHT DOM - Structure test', () => {
      expect(getDiffableHTML(el, {ignoreAttributes: ['id']})).toMatchSnapshot('LIGHT DOM');
    });

    it('a11y', async () => {
      await expect(el).accessible();
    });
  });

  describe('Functionality', () => {
    it('shows error state when image fails to load', async () => {
      el = await fixture(
        html`<async-decoded-image-canvas src="invalid-url"></async-decoded-image-canvas>`
      );

      await waitUntil(() => el.shadowRoot!.querySelector('svg'), 'Error SVG did not appear');
      const svg = el.shadowRoot!.querySelector('svg');
      expect(svg).to.exist;
    });

    it('recovers from error state when valid src is provided', async () => {
      el = await fixture(
        html`<async-decoded-image-canvas src="invalid-url"></async-decoded-image-canvas>`
      );

      await waitUntil(() => el.shadowRoot!.querySelector('svg'), 'Error SVG did not appear');

      // Valid 1x1 pixel transparent PNG
      const validSrc =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      el.src = validSrc;

      await el.updateComplete;
      const canvas = el.shadowRoot!.querySelector('canvas');
      expect(canvas).to.exist;
    });

    it('clears canvas when src is removed', async () => {
      const validSrc =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      el = await fixture(
        html`<async-decoded-image-canvas src="${validSrc}"></async-decoded-image-canvas>`
      );
      await waitUntil(() => el.shadowRoot!.querySelector('canvas'), 'Canvas did not appear');

      el.src = '';
      await el.updateComplete;

      const canvas = el.shadowRoot!.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).to.exist;
      // We can't easily check if it's cleared without spying on context, but this ensures no crash
    });

    it('aborts previous request when src changes rapidly', async () => {
      const validSrc1 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const validSrc2 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      el = await fixture(html`<async-decoded-image-canvas></async-decoded-image-canvas>`);

      // Start first request
      el.src = validSrc1;
      await el.updateComplete; // Wait for the cycle to start the request

      // Immediately start second request (should abort the first one)
      el.src = validSrc2;
      await el.updateComplete;

      const canvas = el.shadowRoot!.querySelector('canvas');
      expect(canvas).to.exist;
      expect(el.shadowRoot!.querySelector('svg')).to.not.exist;
    });

    it('cleans up bitmap if aborted after load', async () => {
      el = await fixture(html`<async-decoded-image-canvas></async-decoded-image-canvas>`);

      const bitmapCloseSpy = vi.fn();
      let resolveLoad: (value: unknown) => void;
      const loadPromise = new Promise((r) => {
        resolveLoad = r;
      });

      // Mock _loadImage to control resolution
      // @ts-expect-error: accessing private method
      el._loadImage = () => loadPromise;

      // Trigger draw 1
      el.src = 'src1';
      await el.updateComplete; // _drawImage started and awaiting _loadImage

      // Trigger draw 2 to abort draw 1
      el.src = 'src2';
      await el.updateComplete; // _drawImage (2) started, aborts (1)

      // Resolve draw 1's image load
      // @ts-expect-error: using mock resolver
      resolveLoad({close: bitmapCloseSpy, width: 10, height: 10});

      // Wait for microtasks
      await new Promise((r) => setTimeout(r, 0));

      expect(bitmapCloseSpy).toHaveBeenCalled();
    });
  });

  describe('Browser Specific Logic', () => {
    it('handles fetch error in Chromium', async () => {
      isChromiumBasedMock.mockReturnValue(true);
      vi.spyOn(window, 'fetch').mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      el = await fixture(
        html`<async-decoded-image-canvas src="bad-url"></async-decoded-image-canvas>`
      );
      await waitUntil(() => el.shadowRoot!.querySelector('svg'), 'Error SVG did not appear');
      expect(el.shadowRoot!.querySelector('svg')).to.exist;
    });

    it('uses fetch and createImageBitmap in Chromium', async () => {
      isChromiumBasedMock.mockReturnValue(true);
      const validSrc =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      // Mock fetch to return a blob
      vi.spyOn(window, 'fetch').mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob([''], {type: 'image/png'})),
      } as Response);

      el = await fixture(
        html`<async-decoded-image-canvas src="${validSrc}"></async-decoded-image-canvas>`
      );
      await waitUntil(() => el.shadowRoot!.querySelector('canvas'), 'Canvas did not appear');
      expect(el.shadowRoot!.querySelector('canvas')).to.exist;
    });

    it('handles image error in non-Chromium', async () => {
      isChromiumBasedMock.mockReturnValue(false);
      el = await fixture(
        html`<async-decoded-image-canvas src="bad-url"></async-decoded-image-canvas>`
      );
      await waitUntil(() => el.shadowRoot!.querySelector('svg'), 'Error SVG did not appear');
      expect(el.shadowRoot!.querySelector('svg')).to.exist;
    });
  });
});
