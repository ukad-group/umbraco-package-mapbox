using UkadGroup.UmbracoPackageMapbox.Core.Assets;
using UkadGroup.UmbracoPackageMapbox.Core.Services;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;

namespace UkadGroup.UmbracoPackageMapbox.Core.Extensions
{
    public static class UmbracoBuilderExtensions
    {
        public static IUmbracoBuilder AddMapbox(this IUmbracoBuilder builder)
        {
            builder.BackOfficeAssets()
                .Append<AutocompleteJsFile>()
                .Append<AutocompleteCssFile>()
                .Append<MapboxMarkerMapControllerJsFile>()
                .Append<MapboxJsFile>()
                .Append<MapboxCssFile>()
                .Append<StylesCssFile>();
            builder.RegisterMapboxSettings();
            builder.AddNotificationHandler<ServerVariablesParsingNotification, ServerVariablesParsingHandler>();

            return builder;
        }
    }
}