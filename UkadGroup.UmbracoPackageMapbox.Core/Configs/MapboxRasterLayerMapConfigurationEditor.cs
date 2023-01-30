using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;

namespace UkadGroup.UmbracoPackageMapbox.Core.Configs
{
    public class MapboxRasterLayerMapConfigurationEditor : ConfigurationEditor<MapboxRasterLayerMapConfiguration>
    {
        public MapboxRasterLayerMapConfigurationEditor(IIOHelper ioHelper, IEditorConfigurationParser editorConfigurationParser) : base(ioHelper, editorConfigurationParser)
        {
        }
    }
}
