using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Strings;

namespace Ukad.UmbracoPackageMapbox.Core.PropertyEditors
{
    public class MapboxRasterLayerMapPropertyValueEditor : DataValueEditor
    {
        private readonly IJsonSerializer _jsonSerializer;

        public MapboxRasterLayerMapPropertyValueEditor(IShortStringHelper shortStringHelper, IJsonSerializer jsonSerializer)
            : base(shortStringHelper, jsonSerializer)
        {
            _jsonSerializer = jsonSerializer;
        }

        public MapboxRasterLayerMapPropertyValueEditor(IShortStringHelper shortStringHelper, IJsonSerializer jsonSerializer, IIOHelper ioHelper, DataEditorAttribute attribute)
            : base(shortStringHelper, jsonSerializer, ioHelper, attribute)
        {
            _jsonSerializer = jsonSerializer;
        }

        //public override IValueRequiredValidator RequiredValidator => new MapboxRasterLayerMapRequiredValidator(_jsonSerializer);
    }
}