import {css} from 'lit';

export const styles = css`
  :host {
    --_async-decoded-image-canvas-width: var(--async-decoded-image-canvas-width);
    --_async-decoded-image-canvas-height: var(--async-decoded-image-canvas-height);
    display: block;
    box-sizing: border-box;
  }

  :host([hidden]),
  [hidden] {
    display: none !important;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  canvas {
    display: block;
    width: var(--_async-decoded-image-canvas-width);
    height: var(--_async-decoded-image-canvas-height);
  }

  svg {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: auto;
  }
`;
