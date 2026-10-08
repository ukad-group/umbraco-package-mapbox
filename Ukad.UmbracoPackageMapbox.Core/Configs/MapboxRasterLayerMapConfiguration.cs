using System.Runtime.Serialization;
using System.Xml.Linq;
using Umbraco.Cms.Core.PropertyEditors;

namespace Ukad.UmbracoPackageMapbox.Core.Configs
{
	[DataContract]
	public class MapboxRasterLayerMapConfiguration
    {
        [DataMember(Name = "accessToken")]
        public string AccessToken { get; set; }

        [DataMember(Name = "defaultImage")]
        [ConfigurationField("defaultImage")]
        public string DefaultImage { get; set; }

        [DataMember(Name = "showSetLayerByCoordinates")]
        [ConfigurationField("showSetLayerByCoordinates")]
        public bool ShowSetLayerByCoordinates { get; set; } = false;

        [DataMember(Name = "allowClear")]
        [ConfigurationField("allowClear")]
        public bool AllowClear { get; set; } = true;

        [DataMember(Name = "scrollWheelZoom")]
        [ConfigurationField("scrollWheelZoom")]
        public bool ScrollWheelZoom { get; set; } = true;

        [DataMember(Name = "showZoom")]
        [ConfigurationField("showZoom")]
        public bool ShowZoom { get; set; } = false;

        [DataMember(Name = "roundZoomToNatural")]
        [ConfigurationField("roundZoomToNatural")]
        public bool RoundZoomToNatural { get; set; } = true;

        [DataMember(Name = "showOpacity")]
        [ConfigurationField("showOpacity")]
        public bool ShowOpacity { get; set; } = true;
    }
}
