![Lit](https://img.shields.io/badge/lit-3.0.0-blue.svg)


## `<async-decoded-image-canvas>`

An image component that uses a cross-browser strategy to decode images off the main thread before rendering to canvas.
This standardizes behavior across Chrome, Firefox, and Safari to prevent main thread blocking.

> 💡 Implements the strategy from [fastDrawImage](https://github.com/myshov/fastDrawImage) by \@myshov and his article on [PerfPlanet](https://calendar.perfplanet.com/2025/non-blocking-image-canvas/).


### `src/AsyncDecodedImageCanvas.ts`:

#### class: `AsyncDecodedImageCanvas`, `async-decoded-image-canvas`

##### Fields

| Name     | Privacy | Type     | Default | Description                         | Inherited From |
| -------- | ------- | -------- | ------- | ----------------------------------- | -------------- |
| `src`    |         | `string` | `''`    | The src of the image to display.    |                |
| `width`  |         | `number` | `150`   | The width of the canvas.            |                |
| `height` |         | `number` | `150`   | The height of the canvas.           |                |
| `alt`    |         | `string` | `''`    | The alternative text for the image. |                |

##### Attributes

| Name     | Field  | Inherited From |
| -------- | ------ | -------------- |
| `src`    | src    |                |
| `width`  | width  |                |
| `height` | height |                |
| `alt`    | alt    |                |

<details><summary>Private API</summary>

##### Fields

| Name                | Privacy | Type                             | Default | Description | Inherited From |
| ------------------- | ------- | -------------------------------- | ------- | ----------- | -------------- |
| `__abortController` | private | `AbortController \| undefined`   |         |             |                |
| `__canvas`          | private | `HTMLCanvasElement \| undefined` |         |             |                |
| `_errorTpl`         | private |                                  |         |             |                |

##### Methods

| Name         | Privacy | Description | Parameters                         | Return                 | Inherited From |
| ------------ | ------- | ----------- | ---------------------------------- | ---------------------- | -------------- |
| `_drawImage` | private |             |                                    |                        |                |
| `_loadImage` | private |             | `src: string, signal: AbortSignal` | `Promise<ImageBitmap>` |                |

</details>

<hr/>

#### Exports

| Kind | Name                      | Declaration             | Module                         | Package |
| ---- | ------------------------- | ----------------------- | ------------------------------ | ------- |
| `js` | `AsyncDecodedImageCanvas` | AsyncDecodedImageCanvas | src/AsyncDecodedImageCanvas.ts |         |

### `src/index.ts`:

#### Exports

| Kind | Name                      | Declaration             | Module                       | Package |
| ---- | ------------------------- | ----------------------- | ---------------------------- | ------- |
| `js` | `AsyncDecodedImageCanvas` | AsyncDecodedImageCanvas | ./AsyncDecodedImageCanvas.js |         |

### `src/define/async-decoded-image-canvas.ts`:

#### Exports

| Kind                        | Name                         | Declaration             | Module                          | Package |
| --------------------------- | ---------------------------- | ----------------------- | ------------------------------- | ------- |
| `custom-element-definition` | `async-decoded-image-canvas` | AsyncDecodedImageCanvas | /src/AsyncDecodedImageCanvas.js |         |

### `src/styles/async-decoded-image-canvas-styles.css.ts`:

#### Variables

| Name     | Description | Type |
| -------- | ----------- | ---- |
| `styles` |             |      |

<hr/>

#### Exports

| Kind | Name     | Declaration | Module                                              | Package |
| ---- | -------- | ----------- | --------------------------------------------------- | ------- |
| `js` | `styles` | styles      | src/styles/async-decoded-image-canvas-styles.css.ts |         |
