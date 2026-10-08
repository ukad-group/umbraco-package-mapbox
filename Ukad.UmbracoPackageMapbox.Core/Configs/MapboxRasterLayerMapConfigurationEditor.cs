using Umbraco.Cms.Core.IO;

namespace Ukad.UmbracoPackageMapbox.Core.Configs
{
    public class MapboxRasterLayerMapConfigurationEditor : MapboxConfigurationEditor<MapboxRasterLayerMapConfiguration>
    {
        public MapboxRasterLayerMapConfigurationEditor(IIOHelper ioHelper) : base(ioHelper)
        {
        }
    }
}
