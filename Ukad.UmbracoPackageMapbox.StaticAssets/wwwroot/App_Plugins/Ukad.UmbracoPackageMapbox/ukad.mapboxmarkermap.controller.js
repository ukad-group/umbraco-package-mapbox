angular
    .module("umbraco")
    .controller("Ukad.UmbracoPackageMapbox.MarkerMap.Controller", [
        "$scope",
        "$element",
        "$timeout",
        "userService",
        "umbRequestHelper",
        "$http",
        function (
            $scope,
            $element,
            $timeout,
            userService,
            umbRequestHelper,
            $http
        ) {
            const vm = this;

            vm.setMarker = setMarker;
            vm.clearMarker = clearMarker;
            vm.setZoom = setZoom;

            vm.inputId = "search_" + String.CreateGuid();
            vm.inputLatId = "marker_Lat_" + String.CreateGuid();
            vm.inputLngId = "marker_Lng_" + String.CreateGuid();
            vm.inputZoomId = "zoom_" + String.CreateGuid();
            vm.mapId = "map_" + String.CreateGuid();
            vm.coordinatesId = "coordinates_" + String.CreateGuid();

            $element.find("[data-map]")[0].id = vm.mapId;
            $element.find("[data-coordinates]")[0].id = vm.coordinatesId;

            vm.showLoader = true;
            vm.error = "";
            vm.currentMarker = null;
            vm.accessToken = "";

            vm.showSearch =
                $scope.model.config.showSearch != null
                    ? Object.toBoolean($scope.model.config.showSearch)
                    : false;
            vm.showSetMarkerByCoordinates =
                $scope.model.config.showSetMarkerByCoordinates != null
                    ? Object.toBoolean(
                          $scope.model.config.showSetMarkerByCoordinates
                      )
                    : false;
            vm.showZoom =
                $scope.model.config.showZoom != null
                    ? Object.toBoolean($scope.model.config.showZoom)
                    : false;
            vm.allowClear =
                $scope.model.config.allowClear != null
                    ? Object.toBoolean($scope.model.config.allowClear)
                    : true;
            vm.scrollWheelZoom =
                $scope.model.config.scrollWheelZoom != null
                    ? Object.toBoolean($scope.model.config.scrollWheelZoom)
                    : true;
            vm.showZoom =
                $scope.model.config.showZoom != null
                    ? Object.toBoolean($scope.model.config.showZoom)
                    : false;
            vm.roundZoomToNatural =
                $scope.model.config.roundZoomToNatural != null
                    ? Object.toBoolean($scope.model.config.roundZoomToNatural)
                    : false;

            async function initMapboxMap() {
                const defaultValue = {
                    marker: { latitude: -54.975556, longitude: -1.621667 },
                    boundingBox: {
                        southWestCorner: {
                            latitude: -54.970495269313204,
                            longitude: -1.6278648376464846,
                        },
                        northEastCorner: {
                            latitude: -54.97911600936982,
                            longitude: -1.609625816345215,
                        },
                    },
                    zoom: 9,
                };

                const initValue =
                    $scope.model.value ||
                    $scope.model.config.defaultPosition ||
                    defaultValue;

                isBoundingBoxExists =
                    initValue?.boundingBox?.southWestCorner?.longitude &&
                    initValue?.boundingBox?.southWestCorner?.latitude &&
                    initValue?.boundingBox?.northEastCorner?.longitude &&
                    initValue?.boundingBox?.northEastCorner?.latitude;

                isMarkerExists =
                    initValue.marker?.latitude && initValue.marker?.longitude;

                vm.coordinatesBox = document.getElementById(vm.coordinatesId);

                if (isMarkerExists) {
                    vm.coordinatesBox.style.display = "block";
                    vm.coordinatesBox.innerHTML = `Longitude: ${initValue.marker.longitude}<br />Latitude: ${initValue.marker.latitude}`;
                }

                if (vm.accessToken === "") {
                    vm.error =
                        "No Mapbox access token set, Maps Editor cannot load.";
                    vm.showLoader = true;
                    return;
                } else {
                    vm.error = "";
                    vm.showLoader = false;
                }

                vm.map = new mapboxgl.Map({
                    accessToken: vm.accessToken,
                    container: vm.mapId,
                    animate: false,
                    style: "mapbox://styles/mapbox/streets-v12",
                    zoom: initValue.zoom,
                    projection: "equirectangular",
                });

                if (isMarkerExists) {
                    vm.map.jumpTo({
                        center: [
                            initValue.marker?.longitude,
                            initValue.marker?.latitude,
                        ],
                    });
                } else if (isBoundingBoxExists) {
                    const boundingBox = getBoundingBox(initValue);
                    vm.map.jumpTo({
                        center: [
                            boundingBox.getCenter().lng,
                            boundingBox.getCenter().lat,
                        ],
                    });
                } else {
                    vm.map.jumpTo({
                        center: [
                            defaultValue.marker.longitude,
                            defaultValue.marker.latitude,
                        ],
                    });
                }

                if (isBoundingBoxExists) {
                    vm.map.fitBounds(getBoundingBox(initValue), { center: getBoundingBox(initValue).getCenter() });
                }

                vm.map.addControl(new mapboxgl.NavigationControl());
                vm.map.dragRotate.disable();
                vm.map.touchZoomRotate.disableRotation();

                if (vm.scrollWheelZoom == false) {
                    vm.map.scrollZoom.disable();
                }

                const mapDiv = document.getElementById(vm.mapId);
                mapDiv.appendChild(vm.coordinatesBox);

                vm.map.on("click", onMapClick);
                vm.map.on("moveend", updateModel);
                vm.map.on("zoomstart", () => {
                    vm.startZoom = vm.map.getZoom()
                });
                vm.map.on("zoomend", updateZoom);

                vm.map.on("contextmenu", function () {
                    if (
                        vm.allowClear !== true &&
                        Object.toBoolean($scope.model.config.allowClear) !==
                            true
                    ) {
                        return;
                    }
                    clearMarker();
                });

                if (isMarkerExists) {
                    vm.currentMarker = new mapboxgl.Marker({ draggable: true })
                        .setLngLat([
                            initValue.marker.longitude,
                            initValue.marker.latitude,
                        ])
                        .addTo(vm.map);

                    if (vm.showSetMarkerByCoordinates) {
                        vm.inputLat = initValue.marker.latitude;
                        vm.inputLng = initValue.marker.longitude;
                    }
                }

                if (vm.currentMarker) {
                    vm.currentMarker.on("dragend", updateModel);
                }

                if (vm.showSearch) {
                    userService.getCurrentUser().then(function (currentUser) {
                        $timeout(function () {});
                        initAutocompleteSearch(currentUser.locale);
                    });
                }

                vm.map.on("load", (e) => {
                    vm.map.resize();
                    vm.map.setZoom(initValue.zoom);
                });

                if (vm.showZoom) {
                    vm.inputZoom = initValue.zoom;
                }

                vm.map.on("idle", (e) => {
                    vm.map.resize();
                    vm.map.setZoom(vm.map.getZoom());
                });
            }

            function getBoundingBox(initValue) {
                const southWest = new mapboxgl.LngLat(
                    initValue.boundingBox.southWestCorner.longitude,
                    initValue.boundingBox.southWestCorner.latitude
                );
                const northEast = new mapboxgl.LngLat(
                    initValue.boundingBox.northEastCorner.longitude,
                    initValue.boundingBox.northEastCorner.latitude
                );

                return (boundingBox = new mapboxgl.LngLatBounds(
                    southWest,
                    northEast
                ));
            }

            function clearMarker(e, skipUpdate) {
                if (vm.currentMarker) {
                    vm.currentMarker.remove(vm.map);
                    vm.currentMarker = null;
                    vm.coordinatesBox.style.display = "none";
                }

                if (!skipUpdate) {
                    updateModel();
                }
            }

            function setMarker() {
                if (
                    !Number.isFinite(vm.inputLat) ||
                    !Number.isFinite(vm.inputLng)
                ) {
                    return;
                }

                clearMarker();

                const lngLat = [vm.inputLng, vm.inputLat];

                vm.map.jumpTo({
                    center: lngLat,
                });
                vm.currentMarker = new mapboxgl.Marker({ draggable: true })
                    .setLngLat(lngLat)
                    .addTo(vm.map);

                if (vm.currentMarker) {
                    vm.currentMarker.on("dragend", updateModel);
                }

                updateModel();
            }

            function setZoom() {
                if (!Number.isFinite(vm.inputZoom)) {
                    return;
                }

                if (vm.inputZoom < 0) {
                    vm.inputZoom = 0;
                }

                vm.map.setZoom(vm.inputZoom);
                updateModel();
            }

            function onMapClick(e) {
                clearMarker(e, true);

                vm.map.jumpTo({
                    center: e.lngLat,
                });

                vm.currentMarker = new mapboxgl.Marker({ draggable: true })
                    .setLngLat([e.lngLat.lng, e.lngLat.lat])
                    .addTo(vm.map);

                if (vm.currentMarker) {
                    vm.currentMarker.on("dragend", updateModel);
                    var coordinates = e.lngLat;
                    vm.coordinatesBox.style.display = "block";
                    vm.coordinatesBox.innerHTML = `Longitude: ${coordinates.lng}<br />Latitude: ${coordinates.lat}`;
                }
            }

            function updateZoom() { 
                $timeout(() => {
                    const zoom = vm.map.getZoom();
                    const deltaZoom = vm.startZoom != null
                        ? zoom - vm.startZoom
                        : 0;

                    if (vm.roundZoomToNatural && deltaZoom != 0) {
                        if (deltaZoom >= 0.5 || deltaZoom <= -0.5) {
                            vm.map.setZoom(Math.round(zoom))
                        }
                        else if (deltaZoom > 0) {
                            vm.map.setZoom(Math.round(zoom + 1))
                        }
                        else {
                            vm.map.setZoom(Math.round(zoom - 1))
                        }
                    }

                    vm.startZoom = null
                    updateModel()
                }, 0);
            }

            function updateModel() {
                $timeout(function () {
                    $scope.model.value = {};
                    $scope.model.value.marker = {};

                    const zoom = vm.roundZoomToNatural
                        ? Math.round(vm.map.getZoom())
                        : vm.map.getZoom();
                    $scope.model.value.zoom = zoom;
                    vm.inputZoom = zoom;

                    if (!$scope.model.value.boundingBox) {
                        $scope.model.value.boundingBox = {};
                    }
                    if (!$scope.model.value.boundingBox.southWestCorner) {
                        $scope.model.value.boundingBox.southWestCorner = {};
                    }
                    if (!$scope.model.value.boundingBox.northEastCorner) {
                        $scope.model.value.boundingBox.northEastCorner = {};
                    }

                    const northEastCorner = vm.map.getBounds().getNorthEast();
                    const southWestCorner = vm.map.getBounds().getSouthWest();

                    $scope.model.value.boundingBox.northEastCorner.latitude =
                        northEastCorner.lat;
                    $scope.model.value.boundingBox.northEastCorner.longitude =
                        northEastCorner.lng;
                    $scope.model.value.boundingBox.southWestCorner.latitude =
                        southWestCorner.lat;
                    $scope.model.value.boundingBox.southWestCorner.longitude =
                        southWestCorner.lng;

                    if (vm.currentMarker) {
                        const marker = vm.currentMarker.getLngLat();

                        if (!$scope.model.value.marker) {
                            $scope.model.value.marker = {};
                        }

                        $scope.model.value.marker.latitude = marker.lat;
                        $scope.model.value.marker.longitude = marker.lng;
                        vm.inputLat = marker.lat;
                        vm.inputLng = marker.lng;
                    } else {
                        $scope.model.value.marker = null;
                        vm.inputLat = null;
                        vm.inputLng = null;
                    }
                }, 0);
            }

            function initAutocompleteSearch(language) {
                new Autocomplete(vm.inputId, {
                    selectFirst: true,
                    howManyCharacters: 2,

                    // onSearch
                    onSearch: ({ currentValue }) => {
                        const limit = 5;
                        const api = `https://nominatim.openstreetmap.org/search?format=geojson&limit=${limit}&q=${encodeURI(
                            currentValue
                        )}&accept-language=${language}`;

                        return new Promise((resolve) => {
                            fetch(api)
                                .then((response) => response.json())
                                .then((data) => {
                                    resolve(data.features);
                                })
                                .catch((error) => {
                                    console.error(error);
                                });
                        });
                    },
                    // nominatim GeoJSON format parse this part turns json into the list of
                    // records that appears when you type.
                    onResults: ({ currentValue, matches, template }) => {
                        const regex = new RegExp(currentValue, "gi");

                        // if the result returns 0 we
                        // show the no results element
                        return matches === 0
                            ? template
                            : matches
                                  .map((element) => {
                                      return `
                                  <li class="loupe">
                                    <p>
                                      ${element.properties.display_name.replace(
                                          regex,
                                          (str) => `<b>${str}</b>`
                                      )}
                                    </p>
                                  </li> `;
                                  })
                                  .join("");
                    },

                    // we add an action to enter or click
                    onSubmit: ({ object }) => {
                        const { display_name, category } = object.properties;
                        const coords = object.geometry.coordinates;

                        // custom id for marker
                        const customId = String.CreateGuid();

                        const popup = new mapboxgl.Popup({
                            offset: 25,
                        }).setText(display_name);
                        const marker = new mapboxgl.Marker({
                            title: display_name,
                            id: customId,
                            draggable: true,
                        })
                            .setLngLat([coords[0], coords[1]])
                            .setPopup(popup)
                            .addTo(vm.map);

                        const bbox = object.bbox;
                        const southWest = new mapboxgl.LngLat(bbox[0], bbox[1]);
                        const northEast = new mapboxgl.LngLat(bbox[2], bbox[3]);
                        const boundingBox = new mapboxgl.LngLatBounds(
                            southWest,
                            northEast
                        );

                        vm.map.fitBounds(boundingBox, { center: boundingBox.getCenter() });

                        if (vm.currentMarker) {
                            vm.currentMarker.remove();
                        }

                        vm.currentMarker = marker;

                        if (vm.currentMarker) {
                            vm.currentMarker.on("dragend", updateModel);
                        }

                        updateModel();

                        vm.map.jumpTo({
                            center: vm.currentMarker.getLngLat(),
                        });
                    },

                    // get index and data from li element after
                    // hovering over li with the mouse or using
                    // arrow keys ↓ | ↑
                    //onSelectedItem: ({ index, element, object }) => {
                    //    console.log('onSelectedItem:', index, element, object);
                    //},

                    // the method presents no results element
                    noResults: ({ currentValue, template }) =>
                        template(
                            `<li>No results found: "${currentValue}"</li>`
                        ),
                });
            }

            async function getSettings() {
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
            }

            getSettings().then(async (accessToken) => {
                vm.accessToken = accessToken;
                initMapboxMap();
            });
        },
    ]);
