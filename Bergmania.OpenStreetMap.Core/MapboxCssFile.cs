using Umbraco.Cms.Core.WebAssets;

namespace Bergmania.OpenStreetMap.Core
{
    internal class MapboxCssFile : CssFile
    {
        public MapboxCssFile()
            : base("/App_Plugins/Bergmania.OpenStreetMap/lib/mapbox/mapbox.css")
        { }
    }
}