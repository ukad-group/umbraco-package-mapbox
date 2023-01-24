using Bergmania.OpenStreetMap.Core;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Newtonsoft.Json;

// ReSharper disable once CheckNamespace
namespace Umbraco.Extensions
{
	public static class OpenStreetMapExtensions
	{
		public static IHtmlContent MapboxRendering(this OpenStreetMapModel model)
		{
			return new HtmlString(@$"<div data-mapboxopenstreetmap='{JsonConvert.SerializeObject(model)}' data-mapboxopenstreetmapdefaultconfig='{JsonConvert.SerializeObject(model.Configuration)}' style='width: 100%; height: 400px;'></div>");
		}

		public static IHtmlContent MapboxScripts(this IHtmlHelper htmlHelper)
		{
			return new HtmlString(@"
<link href=""https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.css"" rel=""stylesheet"">
<script src=""https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.js""></script>
<script>

let elements = document.querySelectorAll('[data-mapboxopenstreetmap]');
        
elements.forEach(elem => {
            
let data = JSON.parse(elem.getAttribute('data-mapboxopenstreetmap'));
let config = JSON.parse(elem.getAttribute('data-mapboxopenstreetmapdefaultconfig'));

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
        data.marker?.longitude ?? boundingBox.getCenter().lng,
        data.marker?.latitude ?? boundingBox.getCenter().lat,
    ],
    zoom: data.zoom,
}).fitBounds(boundingBox);

if (data.marker && data.marker.longitude && data.marker.latitude) {
    const marker = new mapboxgl.Marker({ draggable: false })
        .setLngLat([
            data.marker.longitude,
            data.marker.latitude,
        ])
        .addTo(map);
}
    });
</script>");
		}
	}
}
