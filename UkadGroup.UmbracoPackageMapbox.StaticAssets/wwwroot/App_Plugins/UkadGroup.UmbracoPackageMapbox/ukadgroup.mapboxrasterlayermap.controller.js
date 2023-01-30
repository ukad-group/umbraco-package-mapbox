angular
    .module("umbraco")
    .controller("UkadGroup.UmbracoPackageMapbox.RasterLayerMap.Controller", [
        "$scope",
        "$element",
        "$timeout",
        "userService",
        "umbRequestHelper",
        "$http",
        "editorService",
        function (
            $scope,
            $element,
            $timeout,
            userService,
            umbRequestHelper,
            $http,
            editorService
        ) {
            const vm = this;

            vm.setMarker = setMarker;
            vm.clearMarker = clearMarker;
            vm.setZoom = setZoom;

            vm.inputId = "osm_search_" + String.CreateGuid();
            vm.inputLatId = "osm_Lat_" + String.CreateGuid();
            vm.inputLngId = "osm_Lng_" + String.CreateGuid();
            vm.inputZoomId = "osm_Zoom_" + String.CreateGuid();
            vm.mapId = "map_" + String.CreateGuid();

            $element.find("[data-map]")[0].id = vm.mapId;

            vm.showLoader = true;
            vm.error = "";
            vm.currentMarker = null;
            vm.accessToken = "";

            vm.image =
                $scope.model.config.defaultImage != null
                    ? $scope.model.config.defaultImage
                    : "";
            vm.showSetLayerByCoordinates =
                $scope.model.config.showSetLayerByCoordinates != null
                    ? Object.toBoolean(
                          $scope.model.config.showSetLayerByCoordinates
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

                if (vm.accessToken === "") {
                    vm.error =
                        "No Mapbox access token set, Maps Editor cannot load.";
                    vm.showLoader = true;
                    return;
                } else {
                    vm.error = "";
                    vm.showLoader = false;
                }

                const southWest = new mapboxgl.LngLat(
                    initValue.boundingBox.southWestCorner.longitude,
                    initValue.boundingBox.southWestCorner.latitude
                );
                const northEast = new mapboxgl.LngLat(
                    initValue.boundingBox.northEastCorner.longitude,
                    initValue.boundingBox.northEastCorner.latitude
                );
                const boundingBox = new mapboxgl.LngLatBounds(
                    southWest,
                    northEast
                );

                vm.map = new mapboxgl.Map({
                    accessToken: vm.accessToken,
                    container: vm.mapId,
                    animate: false,
                    style: "mapbox://styles/mapbox/streets-v12",
                    center: [
                        initValue.marker?.longitude ??
                            boundingBox.getCenter().lng,
                        initValue.marker?.latitude ??
                            boundingBox.getCenter().lat,
                    ],
                    zoom: initValue.zoom,
                }).fitBounds(boundingBox);

                vm.map.addControl(new mapboxgl.NavigationControl());
                vm.map.dragRotate.disable();
                vm.map.touchZoomRotate.disableRotation();

                if (vm.scrollWheelZoom == false) {
                    vm.map.scrollZoom.disable();
                }

                vm.map.on("click", onMapClick);
                vm.map.on("moveend", updateModel);
                vm.map.on("zoomend", updateModel);

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

                if (initValue.marker) {
                    vm.currentMarker = new mapboxgl.Marker({ draggable: true })
                        .setLngLat([
                            initValue.marker.longitude,
                            initValue.marker.latitude,
                        ])
                        .addTo(vm.map);

                    if (vm.showSetLayerByCoordinates) {
                        vm.inputLat = initValue.marker.latitude;
                        vm.inputLng = initValue.marker.longitude;
                    }
                }

                if (vm.currentMarker) {
                    vm.currentMarker.on("dragend", updateModel);
                }

                vm.map.on("load", (e) => {
                    vm.map.resize();
                    vm.map.fitBounds(boundingBox);
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

            $scope.selectImage = function(item) {
                editorService.mediaPicker({
                    onlyImages: true,
                    multiPicker: false,
                    callback: function (item) {
                        $scope.value = {
                            id: item.id,
                            icon: item.icon,
                            name: item.name,
                            image: item.image,
                            alt: getValueOf(item.properties, "Alt"),
                        };
                    },
                    close: function () {
                        editorService.close();
                    },
                    submit: function (data) {
                        console.log(data.selection[0]);
                        processSelection(data.selection[0].image);
                        editorService.close();
                    },
                });
            }

            function processSelection(selection) {
                vm.image = selection;
            }

            $scope.removeImage = function()
            {
                vm.image = '';
            }

            function clearMarker(e, skipUpdate) {
                if (vm.currentMarker) {
                    vm.currentMarker.remove(vm.map);
                    vm.currentMarker = null;
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
                }
            }

            function updateModel() {
                $timeout(function () {
                    $scope.model.value = {};
                    $scope.model.value.marker = {};

                    $scope.model.value.zoom = vm.map.getZoom();
                    vm.inputZoom = vm.map.getZoom();

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
