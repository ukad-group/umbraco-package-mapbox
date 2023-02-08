using Ukad.UmbracoPackageMapbox.Core.Assets;
using Ukad.UmbracoPackageMapbox.Core.NotificationHandlers;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;

namespace Ukad.UmbracoPackageMapbox.Core.Extensions
{
    public static class UmbracoBuilderExtensions
    {
        public static IUmbracoBuilder AddMapbox(this IUmbracoBuilder builder)
        {
            builder.BackOfficeAssets()
                .Append<AutocompleteJsFile>()
                .Append<AutocompleteCssFile>()
                .Append<MapboxMarkerMapControllerJsFile>()
                .Append<MapboxRasterLayerMapControllerJsFile>()
                .Append<StylesCssFile>()
                .Append<MapsFactoryJsFile>();
            builder.RegisterMapboxSettings();
            builder.AddNotificationHandler<ServerVariablesParsingNotification, ServerVariablesParsingHandler>();

            return builder;
        }
    }
}