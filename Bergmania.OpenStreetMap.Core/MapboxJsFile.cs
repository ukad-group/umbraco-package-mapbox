using Umbraco.Cms.Core.WebAssets;

namespace Bergmania.OpenStreetMap.Core
{
    internal class MapboxJsFile : JavaScriptFile
    {
        public MapboxJsFile()
            : base("/App_Plugins/Bergmania.OpenStreetMap/lib/mapbox/mapbox.js")
        { }
    }
}