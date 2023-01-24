using System;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Html;

namespace Bergmania.OpenStreetMap.Core
{
    [DataContract]
    public class OpenStreetMapModel : IHtmlContent
    {
        [DataMember(Name = "zoom", IsRequired = true)]
        public double Zoom { get; set; }
        
        [DataMember(Name = "marker")]
        public LatitudeLongitudeModel Marker { get; set; }
        
        [DataMember(Name = "boundingBox", IsRequired = true)]
        public BoundingBoxModel BoundingBox { get; set; }
        
        public OpenStreetMapConfiguration Configuration { get; set; }
        public void WriteTo(TextWriter writer, HtmlEncoder encoder)
        {
        }
    }

    [DataContract]
    public class BoundingBoxModel
    {
        [DataMember(Name = "northEastCorner", IsRequired = true)]
        public LatitudeLongitudeModel NorthEastCorner { get; set; }
        
        [DataMember(Name = "southWestCorner", IsRequired = true)]
        public LatitudeLongitudeModel SouthWestCorner { get; set; }
    }

    [DataContract]
    public class LatitudeLongitudeModel
    {
        [DataMember(Name = "latitude", IsRequired = true)]
        public decimal Latitude { get; set; }
        
        [DataMember(Name = "longitude", IsRequired = true)]
        public decimal Longitude { get; set; }
    }
}