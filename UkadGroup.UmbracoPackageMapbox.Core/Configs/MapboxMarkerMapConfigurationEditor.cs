using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;

namespace UkadGroup.UmbracoPackageMapbox.Core.Configs
{
    public class MapboxMarkerMapConfigurationEditor : ConfigurationEditor<MapboxMarkerMapConfiguration>
    {
        public MapboxMarkerMapConfigurationEditor(IIOHelper ioHelper, IEditorConfigurationParser editorConfigurationParser) : base(ioHelper, editorConfigurationParser)
        {
        }
    }
}