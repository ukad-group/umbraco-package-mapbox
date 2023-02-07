using Umbraco.Cms.Core.WebAssets;

namespace Ukad.UmbracoPackageMapbox.Core.Assets
{
    internal class TurfJsFile : JavaScriptFile
    {
        public TurfJsFile()
            : base("/App_Plugins/Ukad.UmbracoPackageMapbox/lib/Turf.js/turf.min.js")
        { }
    }
}
