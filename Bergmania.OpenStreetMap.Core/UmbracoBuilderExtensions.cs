using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;

namespace Bergmania.OpenStreetMap.Core
{
    public static class UmbracoBuilderExtensions
    {
        public static IUmbracoBuilder AddMapbox(this IUmbracoBuilder builder)
        {
            builder.BackOfficeAssets()
                .Append<AutocompleteJsFile>()
                .Append<AutocompleteCssFile>()
                .Append<OpenStreetMapControllerJsFile>()
                .Append<MapboxJsFile>()
                .Append<MapboxCssFile>()
                .Append<StylesCssFile>();
            builder.RegisterMapboxSettings();
            builder.AddNotificationHandler<ServerVariablesParsingNotification, ServerVariablesParsingHandler>();

            return builder;
        }
    }
}