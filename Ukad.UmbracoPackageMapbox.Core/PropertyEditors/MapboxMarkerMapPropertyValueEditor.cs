using Ukad.UmbracoPackageMapbox.Core.Validators;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Strings;

namespace Ukad.UmbracoPackageMapbox.Core.PropertyEditors
{
    public class MapboxMarkerMapPropertyValueEditor : DataValueEditor
    {
        private readonly IJsonSerializer _jsonSerializer;

        public MapboxMarkerMapPropertyValueEditor(IShortStringHelper shortStringHelper, IJsonSerializer jsonSerializer)
            : base(shortStringHelper, jsonSerializer)
        {
            _jsonSerializer = jsonSerializer;
        }

        public MapboxMarkerMapPropertyValueEditor(IShortStringHelper shortStringHelper, IJsonSerializer jsonSerializer, IIOHelper ioHelper, DataEditorAttribute attribute)
            : base(shortStringHelper, jsonSerializer, ioHelper, attribute)
        {
            _jsonSerializer = jsonSerializer;
        }

        public override IValueRequiredValidator RequiredValidator => new MapboxMarkerMapRequiredValidator(_jsonSerializer);
    }
}