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
        Constants.MarkerMapEditorAlias,
        EditorType.PropertyValue | EditorType.MacroParameter,
        Constants.MarkerMapEditorName,
        Constants.MarkerMapEditorView,
        Icon = Constants.MarkerMapEditorIcon,
        ValueType = ValueTypes.Json)]
    public class MapboxMarkerMapPropertyEditor : DataEditor
    {
        private readonly IIOHelper _ioHelper;
        private readonly IEditorConfigurationParser _editorConfigurationParser;

        public MapboxMarkerMapPropertyEditor(
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
        protected override IDataValueEditor CreateValueEditor() => DataValueEditorFactory.Create<MapboxMarkerMapPropertyValueEditor>(Attribute);

        /// <inheritdoc />
        protected override IConfigurationEditor CreateConfigurationEditor() => new MapboxMarkerMapConfigurationEditor(_ioHelper, _editorConfigurationParser);
    }
}