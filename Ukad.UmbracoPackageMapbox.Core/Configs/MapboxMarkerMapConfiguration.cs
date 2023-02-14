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
        [ConfigurationField("defaultPosition", "Default Position", Constants.MarkerMapEditorView)]
        public MapboxMarkerMapModel DefaultPosition { get; set; }

        [DataMember(Name = "showSearch")]
        [ConfigurationField("showSearch", "Show Search", Constants.BooleanView, Description = "Show search field above map.")]
        public bool ShowSearch { get; set; } = false;

        [DataMember(Name = "showSetMarkerByCoordinates")]
        [ConfigurationField("showSetMarkerByCoordinates", "Show Set Marker By Coordinates", Constants.BooleanView, Description = "Set Marker By Coordinates field's above map.")]
        public bool ShowSetMarkerByCoordinates { get; set; } = false;

        [DataMember(Name = "allowClear")]
        [ConfigurationField("allowClear", "Allow Clear", Constants.BooleanView, Description = "Allow clearing previous marker.")]
        public bool AllowClear { get; set; } = true;

        [DataMember(Name = "scrollWheelZoom")]
        [ConfigurationField("scrollWheelZoom", "Scroll wheel zoom", Constants.BooleanView, Description = "Enable scroll wheel zoom in property editor?")]
        public bool ScrollWheelZoom { get; set; } = true;

        [DataMember(Name = "showZoom")]
        [ConfigurationField("showZoom", "Show Zoom", Constants.BooleanView, Description = "Show zoom level above map.")]
        public bool ShowZoom { get; set; } = false;

        [DataMember(Name = "roundZoomToNatural")]
        [ConfigurationField("roundZoomToNatural", "Round Zoom", Constants.BooleanView, Description = "Round Zoom to natural numbers.")]
        public bool RoundZoomToNatural { get; set; } = true;
    }
}
