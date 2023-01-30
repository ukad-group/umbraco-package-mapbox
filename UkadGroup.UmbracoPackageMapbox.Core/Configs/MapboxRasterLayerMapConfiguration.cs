using System.Runtime.Serialization;
using UkadGroup.UmbracoPackageMapbox.Core.Models;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;

namespace UkadGroup.UmbracoPackageMapbox.Core.Configs
{
    public class MapboxRasterLayerMapConfiguration
    {
        [DataMember(Name = "accessToken")]
        public string AccessToken { get; set; }

        [DataMember(Name = "defaultImage")]
        [ConfigurationField("defaultImage", "Default Image", "imagepicker")]
        public string DefaultImage { get; set; }

        [DataMember(Name = "showSetLayerByCoordinates")]
        [ConfigurationField("showSetLayerByCoordinates", "Show Set Layer By Coordinates", Constants.BooleanView, Description = "Set Layer By Coordinates field's above map.")]
        public bool ShowSetLayerByCoordinates { get; set; } = false;

        [DataMember(Name = "allowClear")]
        [ConfigurationField("allowClear", "Allow Clear", Constants.BooleanView, Description = "Allow clearing previous layer.")]
        public bool AllowClear { get; set; } = true;

        [DataMember(Name = "scrollWheelZoom")]
        [ConfigurationField("scrollWheelZoom", "Scroll wheel zoom", Constants.BooleanView, Description = "Enable scroll wheel zoom in property editor?")]
        public bool ScrollWheelZoom { get; set; } = true;

        [DataMember(Name = "showZoom")]
        [ConfigurationField("showZoom", "Show Zoom", Constants.BooleanView, Description = "Show zoom level above map.")]
        public bool ShowZoom { get; set; } = false;
    }
}
