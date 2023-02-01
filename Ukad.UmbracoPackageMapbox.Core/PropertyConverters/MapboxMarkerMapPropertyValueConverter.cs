using System;
using UkadGroup.UmbracoPackageMapbox.Core.Configs;
using UkadGroup.UmbracoPackageMapbox.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;

namespace UkadGroup.UmbracoPackageMapbox.Core.PropertyConverters
{
    public class MapboxMarkerMapPropertyValueConverter : PropertyValueConverterBase
    {
        private readonly IJsonSerializer _jsonSerializer;
        private readonly MapboxConfig _mapboxConfig;

        public MapboxMarkerMapPropertyValueConverter(IJsonSerializer jsonSerializer, MapboxConfig mapboxConfig)
        {
            _jsonSerializer = jsonSerializer;
            _mapboxConfig = mapboxConfig;
        }

        public override bool IsConverter(IPublishedPropertyType propertyType) => propertyType.EditorAlias.Equals(Constants.MarkerMapEditorAlias);

        public override Type GetPropertyValueType(IPublishedPropertyType propertyType) => typeof(MapboxMarkerMapModel);

        public override PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType) => PropertyCacheLevel.Element;

        public override object ConvertIntermediateToObject(IPublishedElement owner, IPublishedPropertyType propertyType, PropertyCacheLevel referenceCacheLevel, object inter, bool preview)
        {
            var configuration = propertyType.DataType.ConfigurationAs<MapboxMarkerMapConfiguration>();

            var model = string.IsNullOrWhiteSpace(inter?.ToString()) ? configuration.DefaultPosition : _jsonSerializer.Deserialize<MapboxMarkerMapModel>(inter.ToString());

            model.Configuration = configuration;
            model.Configuration.AccessToken = _mapboxConfig.AccessToken;

            return model;
        }
    }
}
