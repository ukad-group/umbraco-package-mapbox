using Microsoft.Extensions.Configuration;
using System.Runtime.Serialization;

namespace Ukad.UmbracoPackageMapbox.Core.Configs
{
    public class MapboxConfig
    {
        [DataMember(Name = "accessToken")]
        public string AccessToken { get; set; }

        public MapboxConfig()
        {
        }

        internal MapboxConfig(IConfiguration configuration)
        {
            if (configuration != null)
            {
                var configSection = configuration.GetSection(Constants.SectionName).Get<MapboxConfig>();
                AccessToken = configSection?.AccessToken;
            }
        }
    }
}
