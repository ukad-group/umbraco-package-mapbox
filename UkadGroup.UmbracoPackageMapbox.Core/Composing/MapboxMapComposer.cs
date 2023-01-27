using UkadGroup.UmbracoPackageMapbox.Core.Extensions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace UkadGroup.UmbracoPackageMapbox.Core.Composing
{
    public class MapboxMapComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            builder.AddMapbox();
        }
    }
}