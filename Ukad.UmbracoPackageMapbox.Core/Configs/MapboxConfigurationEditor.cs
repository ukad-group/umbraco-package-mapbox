using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;

namespace Ukad.UmbracoPackageMapbox.Core.Configs
{
    public abstract class MapboxConfigurationEditor<TConfiguration> : ConfigurationEditor<TConfiguration>
        where TConfiguration : class, new()
    {
        protected MapboxConfigurationEditor(IIOHelper ioHelper) : base(ioHelper)
        {
            DefaultConfiguration = GetDefaults();
        }

        // Umbraco 13 gave the settings and the editors the C# default for every key missing from the stored
        // configuration (e.g. data types saved before a setting existed), so keep doing that.
        public override IDictionary<string, object> ToConfigurationEditor(IDictionary<string, object> configuration)
        {
            var result = new Dictionary<string, object>(configuration);
            foreach (var (key, value) in DefaultConfiguration)
            {
                result.TryAdd(key, value);
            }

            return result;
        }

        private static Dictionary<string, object> GetDefaults()
        {
            var defaults = new TConfiguration();

            return typeof(TConfiguration).GetProperties()
                .Select(property => (Field: property.GetCustomAttribute<ConfigurationFieldAttribute>(), Value: property.GetValue(defaults)))
                .Where(x => x.Field != null && x.Value != null)
                .ToDictionary(x => x.Field.Key, x => x.Value);
        }
    }
}
