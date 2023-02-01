using Umbraco.Cms.Core.WebAssets;

namespace Ukad.UmbracoPackageMapbox.Core.Assets
{
    internal class MapboxJsFile : JavaScriptFile
    {
        public MapboxJsFile()
            : base("/App_Plugins/Ukad.UmbracoPackageMapbox/lib/mapbox/mapbox.js")
        { }
    }
}
