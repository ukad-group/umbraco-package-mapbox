using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;

namespace UkadGroup.UmbracoPackageMapbox.Core.PropertyEditors
{
    public class MapboxRasterLayerMapPropertyValueEditor : DataValueEditor
    {
        private readonly IJsonSerializer _jsonSerializer;

        public MapboxRasterLayerMapPropertyValueEditor(ILocalizedTextService localizedTextService, IShortStringHelper shortStringHelper, IJsonSerializer jsonSerializer)
            : base(localizedTextService, shortStringHelper, jsonSerializer)
        {
            _jsonSerializer = jsonSerializer;
        }

        public MapboxRasterLayerMapPropertyValueEditor(ILocalizedTextService localizedTextService, IShortStringHelper shortStringHelper, IJsonSerializer jsonSerializer, IIOHelper ioHelper, DataEditorAttribute attribute)
            : base(localizedTextService, shortStringHelper, jsonSerializer, ioHelper, attribute)
        {
            _jsonSerializer = jsonSerializer;
        }

        //public override IValueRequiredValidator RequiredValidator => new MapboxRasterLayerMapRequiredValidator(_jsonSerializer);
    }
}