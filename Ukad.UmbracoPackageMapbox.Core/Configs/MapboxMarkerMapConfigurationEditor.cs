using Umbraco.Cms.Core.IO;

namespace Ukad.UmbracoPackageMapbox.Core.Configs
{
    public class MapboxMarkerMapConfigurationEditor : MapboxConfigurationEditor<MapboxMarkerMapConfiguration>
    {
        public MapboxMarkerMapConfigurationEditor(IIOHelper ioHelper) : base(ioHelper)
        {
        }
    }
}