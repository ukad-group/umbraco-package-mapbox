using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Ukad.UmbracoPackageMapbox.Testsite;

public class Program
{
    public static void Main(string[] args)
        => CreateHostBuilder(args)
            .Build()
            .Run();

    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureUmbracoDefaults()
            .ConfigureLogging(x => x.ClearProviders())
            .ConfigureWebHostDefaults(webBuilder => webBuilder.UseStartup<Startup>());
}
