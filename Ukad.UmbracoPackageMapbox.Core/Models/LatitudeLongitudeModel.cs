using System.Runtime.Serialization;

namespace Ukad.UmbracoPackageMapbox.Core.Models
{
    [DataContract]
    public class LatitudeLongitudeModel
    {
        [DataMember(Name = "latitude")]
        public decimal Latitude { get; set; }

        [DataMember(Name = "longitude")]
        public decimal Longitude { get; set; }
    }
}
