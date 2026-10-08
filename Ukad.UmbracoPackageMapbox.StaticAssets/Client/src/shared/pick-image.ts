import { UMB_MEDIA_PICKER_MODAL, UmbMediaUrlRepository } from "@umbraco-cms/backoffice/media";
import { UMB_MODAL_MANAGER_CONTEXT } from "@umbraco-cms/backoffice/modal";
import type { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";

// Key of Umbraco's built-in "Image" media type, matching the old picker's onlyImages option.
const IMAGE_MEDIA_TYPE_KEY = "cc07b313-0843-4aa8-bbda-871c8da728c8";

/**
 * Opens the media picker for a single image and returns its URL as a site-relative path
 * (e.g. "/media/abc123/image.png"), the same format the Umbraco 13 editors stored.
 * Returns undefined when the picker is closed without a selection.
 */
export async function pickImageUrl(host: UmbLitElement): Promise<string | undefined> {
  const modalManager = await host.getContext(UMB_MODAL_MANAGER_CONTEXT);
  if (!modalManager) {
    return undefined;
  }

  const modal = modalManager.open(host, UMB_MEDIA_PICKER_MODAL, {
    data: {
      multiple: false,
      pickableFilter: (item) => item.mediaType.unique === IMAGE_MEDIA_TYPE_KEY,
    },
  });

  const result = await modal.onSubmit().catch(() => undefined);
  const unique = result?.selection?.[0];
  if (!unique) {
    return undefined;
  }

  const { data } = await new UmbMediaUrlRepository(host).requestItems([unique]);
  const url = data?.[0]?.url;
  if (!url) {
    return undefined;
  }

  const parsed = new URL(url, window.location.origin);
  return parsed.origin === window.location.origin ? parsed.pathname + parsed.search : url;
}
