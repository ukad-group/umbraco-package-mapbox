using Ukad.UmbracoPackageMapbox.Core.Configs;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;

namespace Ukad.UmbracoPackageMapbox.Core.PropertyEditors
{

    /// <summary>
    /// Represents a decimal property and parameter editor.
    /// </summary>
    [DataEditor(
        Constants.RasterLayerMapEditorAlias,
        ValueType = ValueTypes.Json)]
    public class MapboxRasterLayerMapPropertyEditor : DataEditor
    {
        private readonly IIOHelper _ioHelper;

        public MapboxRasterLayerMapPropertyEditor(
            IDataValueEditorFactory dataValueEditorFactory,
            IIOHelper ioHelper)
            : base(dataValueEditorFactory)
        {
            _ioHelper = ioHelper;
        }

        /// <inheritdoc />
        protected override IDataValueEditor CreateValueEditor() => DataValueEditorFactory.Create<MapboxRasterLayerMapPropertyValueEditor>(Attribute);

        /// <inheritdoc />
        protected override IConfigurationEditor CreateConfigurationEditor() => new MapboxRasterLayerMapConfigurationEditor(_ioHelper);
    }
}