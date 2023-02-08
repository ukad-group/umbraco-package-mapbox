angular
    .module("umbraco.resources")
    .factory(
        "MapboxMapsFactory",
        function ($q, $window, $http, umbRequestHelper) {
            "use strict";

            const jsUrl =
                "https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.js";
            const cssUrl =
                "https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.css";

            function getScripts() {
                return document.querySelectorAll(`script[src="${jsUrl}"]`);
            }

            return {
                initialize: async function (callback) {
                    const scripts = getScripts();
                    if (scripts.length > 0) {
                        scripts[0].addEventListener("load", callback);
                    } else {
                        var script = document.createElement("script");
                        script.src = jsUrl;
                        script.addEventListener("load", callback);
                        document.head.appendChild(script);

                        var css = document.createElement("link");
                        css.href = cssUrl;
                        css.setAttribute("rel", "stylesheet");
                        document.head.appendChild(css);
                    }
                },

                getSettings: async function () {
                    const response = await umbRequestHelper.resourcePromise(
                        $http.get(
                            umbRequestHelper.getApiUrl(
                                "mapboxBaseUrl",
                                "GetSettings"
                            )
                        ),
                        "Failed to retrieve Mapbox Settings"
                    );

                    return response?.accessToken || "";
                },
            };
        }
    );
