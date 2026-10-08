using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Ukad.UmbracoPackageMapbox.Core.Configs;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;

namespace Ukad.UmbracoPackageMapbox.Core.Controllers
{
    [ApiVersion("1.0")]
    [VersionedApiBackOfficeRoute("mapbox")]
    [ApiExplorerSettings(GroupName = Constants.PluginName)]
    public class MapboxController : ManagementApiControllerBase
    {
        private readonly MapboxConfig _mapboxConfig;

        public MapboxController(MapboxConfig mapboxConfig)
        {
            _mapboxConfig = mapboxConfig;
        }

        [HttpGet("settings")]
        public MapboxConfig GetSettings()
        {
            return _mapboxConfig;
        }
    }
}
