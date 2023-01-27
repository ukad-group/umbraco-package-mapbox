using System.Runtime.Serialization;

namespace UkadGroup.UmbracoPackageMapbox.Core.Models
{
    [DataContract]
    public class LatitudeLongitudeModel
    {
        [DataMember(Name = "latitude", IsRequired = true)]
        public decimal Latitude { get; set; }

        [DataMember(Name = "longitude", IsRequired = true)]
        public decimal Longitude { get; set; }
    }
}
