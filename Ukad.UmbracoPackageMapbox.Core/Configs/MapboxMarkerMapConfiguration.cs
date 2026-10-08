using System.Runtime.Serialization;
using Ukad.UmbracoPackageMapbox.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;

namespace Ukad.UmbracoPackageMapbox.Core.Configs
{
    [DataContract]
    public class MapboxMarkerMapConfiguration
    {
        [DataMember(Name = "accessToken")]
        public string AccessToken { get; set; }

        [DataMember(Name = "defaultPosition")]
        [ConfigurationField("defaultPosition")]
        public MapboxMarkerMapModel DefaultPosition { get; set; }

        [DataMember(Name = "showSearch")]
        [ConfigurationField("showSearch")]
        public bool ShowSearch { get; set; } = false;

        [DataMember(Name = "showSetMarkerByCoordinates")]
        [ConfigurationField("showSetMarkerByCoordinates")]
        public bool ShowSetMarkerByCoordinates { get; set; } = false;

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
    }
}
