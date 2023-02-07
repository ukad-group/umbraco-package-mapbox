using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Newtonsoft.Json;
using Ukad.UmbracoPackageMapbox.Core.Models;

// ReSharper disable once CheckNamespace
namespace Ukad.UmbracoPackageMapbox.Core.Extensions
{
    public static class MapboxExtensions
    {
        public static IHtmlContent RenderMarkerMap(this MapboxMarkerMapModel model)
        {
            return new HtmlString(@$"<div data-mapboxmarkermap='{JsonConvert.SerializeObject(model)}' data-mapboxmarkermapdefaultconfig='{JsonConvert.SerializeObject(model.Configuration)}' style='width: 100%; height: 400px;'></div>");
        }

        public static IHtmlContent RenderRasterLayerMap(this MapboxRasterLayerMapModel model)
        {
            return new HtmlString(@$"<div data-mapboxrasterlayermap='{JsonConvert.SerializeObject(model)}' data-mapboxrasterlayermapdefaultconfig='{JsonConvert.SerializeObject(model.Configuration)}' style='width: 100%; height: 400px;'></div>");
        }

        public static IHtmlContent MapboxScripts(this IHtmlHelper htmlHelper)
        {
            return new HtmlString(@"
<link href=""https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.css"" rel=""stylesheet"">
<script src=""https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.js""></script>
<script src=""https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js""></script>
<script>

let markermapelements = document.querySelectorAll('[data-mapboxmarkermap]'); 
markermapelements.forEach(elem => {
            
let markermapdata = JSON.parse(elem.getAttribute('data-mapboxmarkermap'));
let markermapconfig = JSON.parse(elem.getAttribute('data-mapboxmarkermapdefaultconfig'));

if(!markermapconfig.accessToken)
{
const error = document.createElement('p');
error.innerText = 'No Mapbox access token set, Maps Editor cannot load.';
elem.appendChild(error);
return;
}

const southWest = new mapboxgl.LngLat(
    markermapdata.boundingBox.southWestCorner.longitude,
    markermapdata.boundingBox.southWestCorner.latitude
);
const northEast = new mapboxgl.LngLat(
    markermapdata.boundingBox.northEastCorner.longitude,
    markermapdata.boundingBox.northEastCorner.latitude
);
const boundingBox = new mapboxgl.LngLatBounds(southWest, northEast);

const map = new mapboxgl.Map({
	accessToken: markermapconfig.accessToken,
    container: elem,
    animate: false,
    style: ""mapbox://styles/mapbox/streets-v12"",
    center: [
        markermapdata.marker?.longitude ?? boundingBox.getCenter().lng,
        markermapdata.marker?.latitude ?? boundingBox.getCenter().lat,
    ],
    zoom: markermapdata.zoom,
    projection: ""equirectangular"",
}).fitBounds(boundingBox);

if (markermapdata.marker && markermapdata.marker.longitude && markermapdata.marker.latitude) {
    const marker = new mapboxgl.Marker({ draggable: false })
        .setLngLat([
            markermapdata.marker.longitude,
            markermapdata.marker.latitude,
        ])
        .addTo(map);
}
    });


let rasterlayermapelements = document.querySelectorAll('[data-mapboxrasterlayermap]');
rasterlayermapelements.forEach(elem => {
            
let data = JSON.parse(elem.getAttribute('data-mapboxrasterlayermap'));
let config = JSON.parse(elem.getAttribute('data-mapboxrasterlayermapdefaultconfig'));

if(!config.accessToken)
{
const error = document.createElement('p');
error.innerText = 'No Mapbox access token set, Maps Editor cannot load.';
elem.appendChild(error);
return;
}

const southWest = new mapboxgl.LngLat(
    data.boundingBox.southWestCorner.longitude,
    data.boundingBox.southWestCorner.latitude
);
const northEast = new mapboxgl.LngLat(
    data.boundingBox.northEastCorner.longitude,
    data.boundingBox.northEastCorner.latitude
);
const boundingBox = new mapboxgl.LngLatBounds(southWest, northEast);

const map = new mapboxgl.Map({
	accessToken: config.accessToken,
    container: elem,
    animate: false,
    style: ""mapbox://styles/mapbox/streets-v12"",
    center: [
        boundingBox.getCenter().lng,
        boundingBox.getCenter().lat,
    ],
    zoom: data.zoom,
    projection: ""equirectangular"",
}).fitBounds(boundingBox);


map.on(""load"", () => 
		{

if (data.image
&& data.topLeftPoint?.longitude && data.topLeftPoint?.latitude
&& data.topRightPoint?.longitude && data.topRightPoint?.latitude
&& data.bottomLeftPoint?.longitude && data.bottomLeftPoint?.latitude
&& data.bottomRightPoint?.longitude && data.bottomRightPoint?.latitude) 
			{

                         map.addSource(""image"", {
                         type: ""image"",
                         url: data.image,
                         coordinates: [
                            [data.topLeftPoint.longitude, data.topLeftPoint.latitude],
                            [data.topRightPoint.longitude, data.topRightPoint.latitude],
                            [data.bottomRightPoint.longitude, data.bottomRightPoint.latitude],
                            [data.bottomLeftPoint.longitude, data.bottomLeftPoint.latitude]]
                        });

                        map.addLayer({
                            id: ""image"",
                            type: ""raster"",
                            source: ""image"",
                            paint: {
                                ""raster-fade-duration"": 0,
                            },
                        });

			}


		});



    });


</script>");
        }
    }
}
