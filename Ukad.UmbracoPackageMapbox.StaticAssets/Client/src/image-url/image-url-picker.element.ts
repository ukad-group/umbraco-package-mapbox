import { css, customElement, html, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbChangeEvent } from "@umbraco-cms/backoffice/event";
import type { UmbPropertyEditorUiElement } from "@umbraco-cms/backoffice/property-editor";
import { pickImageUrl } from "../shared/pick-image.js";

/**
 * Picks an image and stores its URL as a plain string, like the "imagepicker" setting
 * editor the raster layer map's "Default Image" used in Umbraco 13.
 */
@customElement("ukad-mapbox-image-url-picker")
export class UkadMapboxImageUrlPickerElement extends UmbLitElement implements UmbPropertyEditorUiElement {
  @property()
  value?: string;

  async #pick() {
    const url = await pickImageUrl(this);
    if (url) {
      this.value = url;
      this.dispatchEvent(new UmbChangeEvent());
    }
  }

  #remove() {
    this.value = "";
    this.dispatchEvent(new UmbChangeEvent());
  }

  override render() {
    if (!this.value) {
      return html`<uui-button class="add" look="placeholder" label="Add image" @click=${this.#pick}>
        <uui-icon name="icon-add"></uui-icon>
      </uui-button>`;
    }

    return html`
      <button type="button" class="image" @click=${this.#pick}><img src=${this.value} alt="" /></button>
      <div class="actions">
        <uui-button look="secondary" compact label="Edit" @click=${this.#pick}></uui-button>
        <uui-button look="primary" color="danger" compact label="Remove" @click=${this.#remove}></uui-button>
      </div>
    `;
  }

  static override styles = css`
    .add,
    .image {
      width: 144px;
      height: 144px;
    }

    .image {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 1px solid var(--uui-color-border);
      background: var(--uui-color-surface);
      cursor: pointer;
    }

    .image img {
      max-width: 100%;
      max-height: 100%;
    }

    .actions {
      display: flex;
      gap: var(--uui-size-space-2);
      margin-top: var(--uui-size-space-2);
    }
  `;
}

export default UkadMapboxImageUrlPickerElement;

declare global {
  interface HTMLElementTagNameMap {
    "ukad-mapbox-image-url-picker": UkadMapboxImageUrlPickerElement;
  }
}
