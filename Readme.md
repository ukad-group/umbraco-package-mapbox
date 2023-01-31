# UkadGroup.UmbracoPackageMapbox
Mapbox property editors for Umbraco 9+.  
Allows to create new datatypes of types "Mapbox Marker Map" and "Mapbox Raster Layer Map".

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
- Set the image on specific coordinates
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
  
