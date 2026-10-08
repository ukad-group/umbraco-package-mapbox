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
        Constants.MarkerMapEditorAlias,
        ValueType = ValueTypes.Json)]
    public class MapboxMarkerMapPropertyEditor : DataEditor
    {
        private readonly IIOHelper _ioHelper;

        public MapboxMarkerMapPropertyEditor(
            IDataValueEditorFactory dataValueEditorFactory,
            IIOHelper ioHelper)
            : base(dataValueEditorFactory)
        {
            _ioHelper = ioHelper;
        }

        /// <inheritdoc />
        protected override IDataValueEditor CreateValueEditor() => DataValueEditorFactory.Create<MapboxMarkerMapPropertyValueEditor>(Attribute);

        /// <inheritdoc />
        protected override IConfigurationEditor CreateConfigurationEditor() => new MapboxMarkerMapConfigurationEditor(_ioHelper);
    }
}