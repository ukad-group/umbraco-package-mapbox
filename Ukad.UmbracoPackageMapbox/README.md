# Ukad.UmbracoPackageMapbox
Mapbox property editors for Umbraco 17.  
Allows to create new datatypes of types "Mapbox Marker Map" and "Mapbox Raster Layer Map".

## Supported Umbraco versions

| Package version | Umbraco version |
| --------------- | --------------- |
| 0.1.21 and later | 17.7.1 and later 17.x |
| up to 0.1.20 | 10 – 13 |

## Upgrading from Umbraco 13

Existing data types, content and data type settings keep working without any data migration:

1. Upgrade your site to Umbraco 17.7.1 or later as described in the [Umbraco upgrade documentation](https://docs.umbraco.com/umbraco-cms/fundamentals/setup/upgrading). Start from the latest Umbraco 13 release.
2. Update `Ukad.UmbracoPackageMapbox` to 0.1.21 or later. You can do this before or after running the Umbraco upgrade.
3. Keep the `MapboxConfig:AccessToken` setting as it is.

Breaking changes in 0.1.21:

- The public `/umbraco/api/Mapbox/Mapbox/GetSettings` endpoint was removed. The backoffice editors now read the access token from `/umbraco/management/api/v1/mapbox/settings`, which requires a signed-in backoffice user.
- The package targets .NET 10 and Umbraco 17 only. The AngularJS backoffice files were replaced by web components.
- The models are serialized with System.Text.Json instead of Newtonsoft.Json, as in the rest of Umbraco 17. Property names and values are unchanged.

Other changes in 0.1.21:

- The editors only change a stored value when you edit that map. The Umbraco 13 editors rewrote zoom and bounding box whenever a page was opened, so saving a page could change its maps.
- Raster maps saved before image opacity existed are shown at 100% opacity. 0.1.20 threw an error on the website for these values and did not show their image in the backoffice.
- Data types saved before the "Round Zoom" and "Show Image Opacity" settings existed get those settings (both on) the next time they are saved. These are the values the editors already used.

## Licensing
The UmbracoPackageMapbox project is licensed under the [MIT license](https://github.com/ukad-group/umbraco-package-mapbox/blob/master/LICENSE).  
This project includes some code from [Bergmania.OpenStreetMap](https://github.com/bergmania/Bergmania.OpenStreetMap), also MIT licensed.

## Marker map features
- Click on exact location on map to place marker
- Search for address using autocomplete and place marker
- Drag marker around
- Set default bounding box & zoom level on Data Type settings
- Marker position is saved on the property to use the same on your website
- Zoom level is saved on the property to use the same on your website
- Bounding box is saved on the property to use the same on your website
- Set the marker on specific coordinates
- Set the zoom level

## Raster layer map features
- Click on exact location on map to place image
- Drag image around
- Stretch image with dots
- Select default image on Data Type settings
- Image position is saved on the property to use the same on your website
- Image url is saved on the property to use the same on your website
- Zoom level is saved on the property to use the same on your website
- Bounding box is saved on the property to use the same on your website
- Set the zoom level

## Configuration
You can configure the Access Token in AppSettings as per below.  
Add the following to your appsettings.json file or equivalent settings provider (Azure KeyVault, Environment, etc.):

```json
  "MapboxConfig": {
    "AccessToken": ""
  }
```

## Test site
A test side is included with basic content saved in a SqLite (for v10 + v11). 

### Demo site Umbraco Backoffice Login Details

**Username**: me@mail.com  
**Password**: 1234567890
  
