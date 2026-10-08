import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import type { UmbClassInterface } from "@umbraco-cms/backoffice/class-api";

let accessToken: Promise<string> | undefined;

/** Fetches the access token configured in MapboxConfig:AccessToken (once per backoffice session). */
export function getMapboxAccessToken(host: UmbClassInterface): Promise<string> {
  accessToken ??= requestAccessToken(host).catch((error) => {
    accessToken = undefined;
    throw error;
  });

  return accessToken;
}

async function requestAccessToken(host: UmbClassInterface): Promise<string> {
  const authContext = await host.getContext(UMB_AUTH_CONTEXT);
  if (!authContext) {
    throw new Error("Failed to retrieve Mapbox Settings");
  }

  const config = authContext.getOpenApiConfiguration();
  const response = await fetch(`${config.base}/umbraco/management/api/v1/mapbox/settings`, {
    credentials: config.credentials,
    headers: { Authorization: `Bearer ${await config.token()}` },
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve Mapbox Settings");
  }

  const settings = (await response.json()) as { accessToken?: string };
  return settings?.accessToken || "";
}
