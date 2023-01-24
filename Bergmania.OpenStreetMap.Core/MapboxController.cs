﻿using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Cms.Web.Common.Attributes;

namespace Bergmania.OpenStreetMap.Core
{
	[PluginController(Constants.PluginName)]
	public class MapboxController : UmbracoApiController
	{
		private readonly MapboxConfig _mapboxConfig;

		public MapboxController(MapboxConfig mapboxConfig)
		{
			_mapboxConfig = mapboxConfig;
		}

		[HttpGet]
		public MapboxConfig GetSettings()
		{
			return _mapboxConfig;
		}
	}
}
