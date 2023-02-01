using System.Runtime.Serialization;

namespace Ukad.UmbracoPackageMapbox.Core.Models
{
    [DataContract]
    public class BoundingBoxModel
    {
        [DataMember(Name = "northEastCorner", IsRequired = true)]
        public LatitudeLongitudeModel NorthEastCorner { get; set; }

        [DataMember(Name = "southWestCorner", IsRequired = true)]
        public LatitudeLongitudeModel SouthWestCorner { get; set; }
    }
}
