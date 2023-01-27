using System;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using UkadGroup.UmbracoPackageMapbox.Core.Configs;
using Umbraco.Cms.Core.DependencyInjection;

namespace UkadGroup.UmbracoPackageMapbox.Core.Extensions
{
    public static class MapboxBuilderExtensions
    {
        /// <summary>
        /// Registers the Mapbox Settings 
        /// </summary>
        /// <param name="builder"></param>
        /// <param name="defaultOptions"></param>
        /// <returns></returns>
        public static IUmbracoBuilder RegisterMapboxSettings(this IUmbracoBuilder builder, Action<MapboxConfig> defaultOptions = default)
        {
            // if the MapboxConfig Service is registered then we assume this has been added before so we don't do it again. 
            if (builder.Services.FirstOrDefault(x => x.ServiceType == typeof(MapboxConfig)) != null)
            {
                return builder;
            }

            var options = builder.Services.AddSingleton(r =>
            {
                var ret = new MapboxConfig(builder.Config);

                if (defaultOptions != default)
                {
                    //Override with custom details
                    defaultOptions.Invoke(ret);
                }
                return ret;
            });

            if (defaultOptions != default)
            {
                //options..Configure(defaultOptions);
            }

            return builder;
        }
    }
}
