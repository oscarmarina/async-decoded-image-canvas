import {html, LitElement, nothing, render, type PropertyValues} from 'lit';
import {property, query} from 'lit/decorators.js';
import {UAParser} from 'ua-parser-js';
import {styles} from './styles/async-decoded-image-canvas-styles.css.js';

const parser = new UAParser(navigator.userAgent);
const isChromium = () => parser.getEngine().name === 'Blink';

/**
 * ![Lit](https://img.shields.io/badge/lit-3.0.0-blue.svg)
 *
 *
 * ## `<async-decoded-image-canvas>`
 *
 * An image component that uses a cross-browser strategy to decode images off the main thread before rendering to canvas.
 * This standardizes behavior across Chrome, Firefox, and Safari to prevent main thread blocking.
 *
 * > 💡 Implements the strategy from [fastDrawImage](https://github.com/myshov/fastDrawImage) by \@myshov and his article on [PerfPlanet](https://calendar.perfplanet.com/2025/non-blocking-image-canvas/).
 *
 * @attribute src - The source of the image.
 * @attribute width - The width of the canvas.
 * @attribute height - The height of the canvas.
 * @attribute alt - The alternative text for the image.
 */
export class AsyncDecodedImageCanvas extends LitElement {
  private __abortController?: AbortController;

  static override styles = [styles];

  /**
   * The src of the image to display.
   */
  @property({type: String, reflect: true, useDefault: true})
  src = '';

  /**
   * The width of the canvas.
   */
  @property({type: Number, reflect: true})
  width = 150;

  /**
   * The height of the canvas.
   */
  @property({type: Number, reflect: true})
  height = 150;

  /**
   * The alternative text for the image.
   */
  @property({type: String})
  alt = '';

  @query('canvas') private __canvas?: HTMLCanvasElement;

  override updated(props: PropertyValues) {
    super.updated(props);
    if (props.has('src') || props.has('width') || props.has('height')) {
      this._drawImage();
    }
  }

  override render() {
    return html` <canvas
      id="canvas"
      width="${this.width}"
      height="${this.height}"
      aria-label="${this.alt || nothing}"
      aria-hidden="${this.alt ? nothing : 'true'}"
      role="img"
    ></canvas>`;
  }

  private get _errorTpl() {
    return html`<svg
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="22 16 16 10 5 22"></polyline>
      <line x1="3" y1="3" x2="21" y2="21"></line>
    </svg>`;
  }

  private async _drawImage() {
    if (this.__abortController) {
      this.__abortController.abort();
    }
    this.__abortController = new AbortController();
    const signal = this.__abortController.signal;
    const canvas = this.__canvas;
    const ctx = canvas?.getContext('2d');

    if (!this.src) {
      ctx?.clearRect(0, 0, this.width, this.height);
      return;
    }

    try {
      const bitmap = await this._loadImage(this.src, signal);

      if (signal.aborted) {
        bitmap.close();
        return;
      }

      ctx?.clearRect(0, 0, this.width, this.height);
      ctx?.drawImage(bitmap, 0, 0, this.width, this.height);
      bitmap.close();
    } catch {
      if (!signal.aborted) {
        render(this._errorTpl, this.renderRoot, this.renderOptions);
      }
    }
  }

  private async _loadImage(src: string, signal: AbortSignal): Promise<ImageBitmap> {
    if (isChromium()) {
      const response = await fetch(src, {signal});
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      return createImageBitmap(blob);
    } else {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';

        const onAbort = () => {
          image.onload = null;
          image.onerror = null;
          image.src = '';
          reject(new DOMException('Aborted', 'AbortError'));
        };

        signal.addEventListener('abort', onAbort);

        image.onload = () => {
          signal.removeEventListener('abort', onAbort);
          image
            .decode()
            .then(() => createImageBitmap(image))
            .then(resolve)
            .catch(reject);
        };
        image.onerror = (err) => {
          signal.removeEventListener('abort', onAbort);
          reject(err);
        };
        image.src = src;
      });
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'async-decoded-image-canvas': AsyncDecodedImageCanvas;
  }
}
