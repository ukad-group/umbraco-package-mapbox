using System;
using UkadGroup.UmbracoPackageMapbox.Core.Configs;
using UkadGroup.UmbracoPackageMapbox.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;

namespace UkadGroup.UmbracoPackageMapbox.Core.PropertyConverters
{
    public class MapboxRasterLayerMapPropertyValueConverter : PropertyValueConverterBase
    {
        private readonly IJsonSerializer _jsonSerializer;
        private readonly MapboxConfig _mapboxConfig;

        public MapboxRasterLayerMapPropertyValueConverter(IJsonSerializer jsonSerializer, MapboxConfig mapboxConfig)
        {
            _jsonSerializer = jsonSerializer;
            _mapboxConfig = mapboxConfig;
        }

        public override bool IsConverter(IPublishedPropertyType propertyType) => propertyType.EditorAlias.Equals(Constants.RasterLayerMapEditorAlias);

        public override Type GetPropertyValueType(IPublishedPropertyType propertyType) => typeof(MapboxRasterLayerMapModel);

        public override PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType) => PropertyCacheLevel.Element;

        public override object ConvertIntermediateToObject(IPublishedElement owner, IPublishedPropertyType propertyType, PropertyCacheLevel referenceCacheLevel, object inter, bool preview)
        {
            var configuration = propertyType.DataType.ConfigurationAs<MapboxRasterLayerMapConfiguration>();

            var model = string.IsNullOrWhiteSpace(inter?.ToString()) ? new MapboxRasterLayerMapModel() : _jsonSerializer.Deserialize<MapboxRasterLayerMapModel>(inter.ToString());

            model.Configuration = configuration;
            model.Configuration.AccessToken = _mapboxConfig.AccessToken;

            return model;
        }
    }
}
