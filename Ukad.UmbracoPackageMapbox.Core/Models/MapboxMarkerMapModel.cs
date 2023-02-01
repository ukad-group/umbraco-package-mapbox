using Microsoft.AspNetCore.Html;
using System.IO;
using System.Runtime.Serialization;
using System.Text.Encodings.Web;
using Ukad.UmbracoPackageMapbox.Core.Configs;

namespace Ukad.UmbracoPackageMapbox.Core.Models
{
    [DataContract]
    public class MapboxMarkerMapModel : IHtmlContent
    {
        [DataMember(Name = "zoom", IsRequired = true)]
        public double Zoom { get; set; }

        [DataMember(Name = "marker")]
        public LatitudeLongitudeModel Marker { get; set; }

        [DataMember(Name = "boundingBox", IsRequired = true)]
        public BoundingBoxModel BoundingBox { get; set; }

        public MapboxMarkerMapConfiguration Configuration { get; set; }

        public void WriteTo(TextWriter writer, HtmlEncoder encoder)
        {
        }
    }
}
