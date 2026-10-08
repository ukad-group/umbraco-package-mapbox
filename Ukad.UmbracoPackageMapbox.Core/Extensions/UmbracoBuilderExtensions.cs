using Umbraco.Cms.Core.DependencyInjection;

namespace Ukad.UmbracoPackageMapbox.Core.Extensions
{
    public static class UmbracoBuilderExtensions
    {
        public static IUmbracoBuilder AddMapbox(this IUmbracoBuilder builder)
        {
            builder.RegisterMapboxSettings();

            return builder;
        }
    }
}