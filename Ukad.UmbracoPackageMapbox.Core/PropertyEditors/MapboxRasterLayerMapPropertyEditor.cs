using Ukad.UmbracoPackageMapbox.Core.Configs;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;

namespace Ukad.UmbracoPackageMapbox.Core.PropertyEditors
{

    /// <summary>
    /// Represents a decimal property and parameter editor.
    /// </summary>
    [DataEditor(
        Constants.RasterLayerMapEditorAlias,
        EditorType.PropertyValue | EditorType.MacroParameter,
        Constants.RasterLayerMapEditorName,
        Constants.RasterLayerMapEditorView,
        Icon = Constants.RasterLayerMapEditorIcon,
        ValueType = ValueTypes.Json)]
    public class MapboxRasterLayerMapPropertyEditor : DataEditor
    {
        private readonly IIOHelper _ioHelper;
        private readonly IEditorConfigurationParser _editorConfigurationParser;

        public MapboxRasterLayerMapPropertyEditor(
            IDataValueEditorFactory dataValueEditorFactory,
            IIOHelper ioHelper,
            IEditorConfigurationParser editorConfigurationParser,
            EditorType type = EditorType.PropertyValue)
            : base(dataValueEditorFactory, type)
        {
            _ioHelper = ioHelper;
            _editorConfigurationParser = editorConfigurationParser;
        }

        /// <inheritdoc />
        protected override IDataValueEditor CreateValueEditor() => DataValueEditorFactory.Create<MapboxRasterLayerMapPropertyValueEditor>(Attribute);

        /// <inheritdoc />
        protected override IConfigurationEditor CreateConfigurationEditor() => new MapboxRasterLayerMapConfigurationEditor(_ioHelper, _editorConfigurationParser);
    }
}