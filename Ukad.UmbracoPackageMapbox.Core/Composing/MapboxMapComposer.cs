using Ukad.UmbracoPackageMapbox.Core.Extensions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace Ukad.UmbracoPackageMapbox.Core.Composing
{
    public class MapboxMapComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            builder.AddMapbox();
        }
    }
}