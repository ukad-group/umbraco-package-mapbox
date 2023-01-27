using Umbraco.Cms.Core.WebAssets;

namespace UkadGroup.UmbracoPackageMapbox.Core.Assets
{
    internal class MapboxJsFile : JavaScriptFile
    {
        public MapboxJsFile()
            : base("/App_Plugins/UkadGroup.UmbracoPackageMapbox/lib/mapbox/mapbox.js")
        { }
    }
}
