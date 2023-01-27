using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace UkadGroup.UmbracoPackageMapbox.Core.Configs
{
    public class MapboxConfig
    {
        [DataMember(Name = "accessToken")]
        [JsonProperty("accessToken")]
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
