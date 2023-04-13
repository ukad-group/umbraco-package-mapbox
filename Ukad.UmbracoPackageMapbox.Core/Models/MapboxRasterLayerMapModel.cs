using System.IO;
using System.Runtime.Serialization;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Html;
using Ukad.UmbracoPackageMapbox.Core.Configs;

namespace Ukad.UmbracoPackageMapbox.Core.Models
{
    [DataContract]
    public class MapboxRasterLayerMapModel : IHtmlContent
    {
        [DataMember(Name = "zoom", IsRequired = true)]
        public double Zoom { get; set; }

        [DataMember(Name = "topLeftPoint")]
        public LatitudeLongitudeModel TopLeftPoint { get; set; }

        [DataMember(Name = "topRightPoint")]
        public LatitudeLongitudeModel TopRightPoint { get; set; }

        [DataMember(Name = "bottomLeftPoint")]
        public LatitudeLongitudeModel BottomLeftPoint { get; set; }

        [DataMember(Name = "bottomRightPoint")]
        public LatitudeLongitudeModel BottomRightPoint { get; set; }

        [DataMember(Name = "boundingBox", IsRequired = true)]
        public BoundingBoxModel BoundingBox { get; set; }

        [DataMember(Name = "image")]
        public string Image { get; set; }

        [DataMember(Name = "opacity", IsRequired = true)]
        public double Opacity { get; set; }

        public MapboxRasterLayerMapConfiguration Configuration { get; set; }

        public void WriteTo(TextWriter writer, HtmlEncoder encoder)
        {
        }
    }
}
