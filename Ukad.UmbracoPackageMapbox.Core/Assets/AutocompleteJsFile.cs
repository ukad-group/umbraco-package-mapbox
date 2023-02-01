using Umbraco.Cms.Core.WebAssets;

namespace Ukad.UmbracoPackageMapbox.Core.Assets
{
    internal class AutocompleteJsFile : JavaScriptFile
    {
        public AutocompleteJsFile()
            : base("/App_Plugins/Ukad.UmbracoPackageMapbox/lib/autocomplete/js/autocomplete.min.js")
        { }
    }
}
