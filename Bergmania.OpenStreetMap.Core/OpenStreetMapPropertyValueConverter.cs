﻿using System;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;

namespace Bergmania.OpenStreetMap.Core
{
    public class OpenStreetMapPropertyValueConverter : PropertyValueConverterBase
    {
        private readonly IJsonSerializer _jsonSerializer;
        private readonly MapboxConfig _mapboxConfig;

        public OpenStreetMapPropertyValueConverter(IJsonSerializer jsonSerializer, MapboxConfig mapboxConfig)
        {
	        _jsonSerializer = jsonSerializer;
	        _mapboxConfig = mapboxConfig;
        }

        public override bool IsConverter(IPublishedPropertyType propertyType) => propertyType.EditorAlias.Equals(Constants.EditorAlias);
        
        public override Type GetPropertyValueType(IPublishedPropertyType propertyType) => typeof(OpenStreetMapModel);
        
        public override PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType) => PropertyCacheLevel.Element;
        
        public override object ConvertIntermediateToObject(IPublishedElement owner, IPublishedPropertyType propertyType, PropertyCacheLevel referenceCacheLevel, object inter, bool preview)
        {
            var configuration = propertyType.DataType.ConfigurationAs<OpenStreetMapConfiguration>();
            
            var model = string.IsNullOrWhiteSpace(inter?.ToString()) ? configuration.DefaultPosition : _jsonSerializer.Deserialize<OpenStreetMapModel>(inter.ToString());

            model.Configuration = configuration;
            model.Configuration.AccessToken = _mapboxConfig.AccessToken;

            return model;
        }
    }
}