using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;

namespace Bergmania.OpenStreetMap.Core
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
			// if the GoogleMapsConfig Service is registered then we assume this has been added before so we don't do it again. 
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
