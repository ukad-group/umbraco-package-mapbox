﻿angular
    .module("umbraco")
    .controller("Ukad.UmbracoPackageMapbox.RasterLayerMap.Controller", [
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

            vm.updatePoints = updatePoints;
            vm.clearPoints = clearPoints;
            vm.setZoom = setZoom;
            vm.selectImage = selectImage;
            vm.removeImage = removeImage;

            vm.topLeftInputLatId = "topleft_Lat_" + String.CreateGuid();
            vm.topLeftInputLngId = "topleft_Lng_" + String.CreateGuid();

            vm.topRightInputLatId = "topright_Lat_" + String.CreateGuid();
            vm.topRightInputLngId = "topright_Lng_" + String.CreateGuid();

            vm.bottomLeftInputLatId = "bottomleft_Lat_" + String.CreateGuid();
            vm.bottomLeftInputLngId = "bottomleft_Lng_" + String.CreateGuid();

            vm.bottomRightInputLatId = "bottomright_Lat_" + String.CreateGuid();
            vm.bottomRightInputLngId = "bottomright_Lng_" + String.CreateGuid();

            vm.inputZoomId = "zoom_" + String.CreateGuid();
            vm.mapId = "map_" + String.CreateGuid();

            $element.find("[data-map]")[0].id = vm.mapId;

            vm.showLoader = true;
            vm.error = "";
            vm.image = "";
            vm.imageAspectRatio = null;

            vm.dots = {
                topLeft: [],
                topRight: [],
                bottomRight: [],
                bottomLeft: [],
            };

            vm.accessToken = "";

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
            vm.roundZoomToNatural =
                $scope.model.config.roundZoomToNatural != null
                    ? Object.toBoolean($scope.model.config.roundZoomToNatural)
                    : false;

            async function initMapboxMap() {
                const defaultValue = {
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

                const initValue = $scope.model.value || defaultValue;

                initImageWithPoints(initValue);

                isBoundingBoxExists =
                    initValue?.boundingBox?.southWestCorner?.longitude &&
                    initValue?.boundingBox?.southWestCorner?.latitude &&
                    initValue?.boundingBox?.northEastCorner?.longitude &&
                    initValue?.boundingBox?.northEastCorner?.latitude;

                isPlacedImageExists =
                    vm.image &&
                    vm.dots.topLeft[0] &&
                    vm.dots.topLeft[1] &&
                    vm.dots.topRight[0] &&
                    vm.dots.topRight[1] &&
                    vm.dots.bottomLeft[0] &&
                    vm.dots.bottomLeft[1] &&
                    vm.dots.bottomRight[0] &&
                    vm.dots.bottomRight[1];

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

                vm.initBox = isBoundingBoxExists
                    ? getBoundingBox(initValue)
                    : getBoundingBox(defaultValue);

                vm.map.jumpTo({
                    center: vm.initBox.getCenter()
                });
                vm.map.fitBounds(vm.initBox, { center: vm.initBox.getCenter() });

                vm.map.addControl(new mapboxgl.NavigationControl());
                vm.map.dragRotate.disable();
                vm.map.touchZoomRotate.disableRotation();

                if (vm.scrollWheelZoom == false) {
                    vm.map.scrollZoom.disable();
                }

                if (vm.showZoom) {
                    vm.inputZoom = initValue.zoom;
                }

                vm.map.on("contextmenu", function () {
                    if (
                        vm.allowClear !== true &&
                        Object.toBoolean($scope.model.config.allowClear) !==
                            true
                    ) {
                        return;
                    }

                    //TODO clear points
                    //clearPoints();
                });

                vm.map.on("load", () => {
                    const canvas = vm.map.getCanvasContainer();

                    const sizeMultiplier = 0.15;
                    let rotationDot = [0, 0];
                    const mapContainer = document.getElementById(vm.mapId);
                    let containerSize = {
                        width: mapContainer.offsetWidth,
                        height: mapContainer.height,
                    };
                    let mouseDownCoords;
                    let isDragging = false;
                    let imageDraggingStartDots;
                    let isDraggingDot = false;

                    const img = new Image();
                    img.onload = function () {
                        vm.imageAspectRatio = this.width / this.height;
                    };
                    img.src = vm.image;

                    const drawImage = () => {
                        if (vm.map.getLayer("image")) {
                            vm.map.removeLayer("image");
                        }
                        if (vm.map.getSource("image")) {
                            vm.map.removeSource("image");
                        }

                        vm.map.addSource("image", {
                            type: "image",
                            url: vm.image,
                            coordinates: Object.values(vm.dots),
                        });
                        vm.map.addLayer({
                            id: "image",
                            type: "raster",
                            source: "image",
                            paint: {
                                "raster-fade-duration": 0,
                            },
                        });
                        vm.map.on("mousedown", (e) => {
                            const isOnImage = isPointInsidePolygon(
                                e.lngLat.toArray(),
                                Object.values(vm.dots)
                            );
                            if (!isOnImage) return;

                            vm.map.dragPan.disable();
                            vm.map.once("mouseup", () => {
                                vm.map.dragPan.enable();
                            });
                        });
                    };

                    const drawScaleDots = () => {
                        Object.values(vm.dots).map((dot, dotIndex) => {
                            const pointName = Object.keys(vm.dots)[dotIndex];
                            const pointId = `point-${dotIndex}`;

                            if (vm.map.getLayer(pointId)) {
                                vm.map.removeLayer(pointId);
                            }
                            if (vm.map.getSource(pointId)) {
                                vm.map.removeSource(pointId);
                            }

                            vm.map.addSource(pointId, {
                                type: "geojson",
                                data: getDotGeoJson(dot),
                            });
                            vm.map.addLayer({
                                id: pointId,
                                type: "circle",
                                source: pointId,
                                paint: {
                                    "circle-radius": 7,
                                    "circle-color": "#3bb2d0",
                                },
                            });
                            vm.map.on("mouseenter", pointId, () => {
                                vm.map.setPaintProperty(
                                    pointId,
                                    "circle-color",
                                    "#F84C4C"
                                );
                                canvas.style.cursor = "move";
                            });

                            vm.map.on("mouseleave", pointId, () => {
                                vm.map.setPaintProperty(
                                    pointId,
                                    "circle-color",
                                    "#3bb2d0"
                                );
                                canvas.style.cursor = "";
                            });

                            vm.map.on("mousedown", pointId, (e) => {
                                e.preventDefault();

                                canvas.style.cursor = "grab";
                                setLayerProperty("image", 0.5);

                                const onDragPoint = (e) => {
                                    isDraggingDot = true;
                                    vm.dots = calcScaledCoordinates(vm.dots, dotIndex, e.lngLat);
                                    vm.map
                                        .getSource("image")
                                        ?.setCoordinates(
                                            Object.values(vm.dots)
                                    );
                                    rotationDot = calcRotationDotCoordinates(vm.dots);
                                    if (rotationDot) {
                                        vm.map
                                            .getSource("rotation-dot")
                                            ?.setData(getDotGeoJson(rotationDot));
                                    }
                                };

                                vm.map.on("mousemove", onDragPoint);
                                vm.map.once("mouseup", (e) => {
                                    isDraggingDot = false;
                                    setLayerProperty("image", 1);
                                    vm.map.off("mousemove", onDragPoint);
                                });
                            });
                        });
                    };

                    const drawRotationDot = () => {
                        if (vm.map.getLayer("rotation-dot")) {
                            vm.map.removeLayer("rotation-dot");
                        }
                        if (vm.map.getSource("rotation-dot")) {
                            vm.map.removeSource("rotation-dot");
                        }

                        rotationDot = calcRotationDotCoordinates(vm.dots);
                        if (rotationDot) {
                            vm.map.addSource("rotation-dot", {
                                type: "geojson",
                                data: getDotGeoJson(rotationDot),
                            });
                        }
                        vm.map.addLayer({
                            id: "rotation-dot",
                            type: "circle",
                            source: "rotation-dot",
                            paint: {
                                "circle-radius": 7,
                                "circle-color": "#3bb2d0",
                            },
                        });

                        vm.map.on("mouseenter", "rotation-dot", () => {
                            vm.map.setPaintProperty("rotation-dot", "circle-color", "#F84C4C");
                            canvas.style.cursor = "ew-resize";
                        });

                        vm.map.on("mouseleave", "rotation-dot", () => {
                            vm.map.setPaintProperty("rotation-dot", "circle-color", "#3bb2d0");
                            canvas.style.cursor = "";
                        });

                        vm.map.on("mousedown", "rotation-dot", (e) => {
                            e.preventDefault();

                            canvas.style.cursor = "grab";
                            setLayerProperty("image", 0.5);

                            const onDragPoint = (e) => {
                                isDraggingDot = true;

                                vm.map
                                    .getSource("image")
                                    ?.setCoordinates(
                                        Object.values(
                                            calcRotatedCoordinates(vm.dots, rotationDot, e.lngLat)
                                        )
                                    );
                            };

                            vm.map.on("mousemove", onDragPoint);
                            vm.map.once("mouseup", (e) => {
                                vm.dots = calcRotatedCoordinates(vm.dots, rotationDot, e.lngLat);

                                for (let i = 0; i < 4; i++) {
                                    const pointId = `point-${i}`;

                                    vm.map
                                        .getSource(pointId)
                                        ?.setData(getDotGeoJson(Object.values(vm.dots)[i]));

                                    setTimeout(() => {
                                        setLayerProperty(pointId, 1, "circle-opacity");
                                    }, 100);
                                }

                                rotationDot = calcRotationDotCoordinates(vm.dots);

                                vm.map.getSource("image")?.setCoordinates(Object.values(vm.dots));
                                if (rotationDot) {
                                    vm.map
                                        .getSource("rotation-dot")
                                        ?.setData(getDotGeoJson(rotationDot));
                                }

                                isDraggingDot = false;
                                setLayerProperty("image", 1);
                                vm.map.off("mousemove", onDragPoint);
                            });
                        });
                    };

                    vm.map.on("mousedown", (e) => {
                        mouseDownCoords = e.lngLat.toArray();
                        imageDraggingStartDots = vm.dots;
                    });

                    vm.map.on("mousemove", (e) => {
                        if (isDraggingDot || !imageDraggingStartDots) return;

                        isDragging =
                            mouseDownCoords &&
                            e.lngLat.toArray().join("") !==
                                mouseDownCoords.join("");

                        if (!isDragging) return;

                        setLayerProperty("image", 0.5);

                        const coords = e.lngLat.toArray();
                        const delta = mouseDownCoords.map(
                            (value, i) => coords[i] - value
                        );

                        vm.dots = {
                            topLeft: imageDraggingStartDots.topLeft.map(
                                (value, i) => value + delta[i]
                            ),
                            topRight: imageDraggingStartDots.topRight.map(
                                (value, i) => value + delta[i]
                            ),
                            bottomRight: imageDraggingStartDots.bottomRight.map(
                                (value, i) => value + delta[i]
                            ),
                            bottomLeft: imageDraggingStartDots.bottomLeft.map(
                                (value, i) => value + delta[i]
                            ),
                        };

                        for (let i = 0; i < 4; i++) {
                            const pointId = `point-${i}`;
                            vm.map
                                .getSource(pointId)
                                ?.setData(
                                    getDotGeoJson(Object.values(vm.dots)[i])
                                );
                            setLayerProperty(
                                pointId,
                                { duration: 0 },
                                "circle-opacity-transition"
                            );
                            setLayerProperty(pointId, 0, "circle-opacity");
                        }

                        setLayerProperty("rotation-dot", 0, "circle-opacity");
                        const rotationDot = calcRotationDotCoordinates(vm.dots);
                        if (rotationDot) {
                            vm.map
                                .getSource("rotation-dot")
                                ?.setData(getDotGeoJson(rotationDot));
                        }
                        vm.map
                            .getSource("image")
                            ?.setCoordinates(Object.values(vm.dots));
                    });

                    vm.map.on("mouseup", (e) => {
                        let wasDragging =
                            mouseDownCoords &&
                            e.lngLat.toArray().join("") !==
                                mouseDownCoords.join("");

                        mouseDownCoords = null;
                        isDragging = false;
                        imageDraggingStartDots = null;
                        setLayerProperty("image", 1);

                        for (let i = 0; i < 4; i++) {
                            const pointId = `point-${i}`;

                            vm.map
                                .getSource(pointId)
                                ?.setData(
                                    getDotGeoJson(Object.values(vm.dots)[i])
                                );
                            setTimeout(() => {
                                setLayerProperty(pointId, 1, "circle-opacity");
                            }, 100);
                        }

                        const rotationDot = calcRotationDotCoordinates(vm.dots);
                        if (rotationDot) {
                            vm.map
                                .getSource("rotation-dot")
                                ?.setData(getDotGeoJson(rotationDot));
                        }
                        setTimeout(() => {
                            setLayerProperty("rotation-dot", 1, "circle-opacity");
                        }, 100);

                        if (wasDragging) {
                            return;
                        }

                        const isOnImage = isPointInsidePolygon(
                            e.lngLat.toArray(),
                            Object.values(vm.dots)
                        );
                        if (isOnImage) return;

                        if (!vm.image) {
                            return;
                        }

                        const imageWidth = containerSize.width * sizeMultiplier;
                        const imageHeight = imageWidth / vm.imageAspectRatio;

                        const center = e.point;
                        const canvasDots = {
                            topLeft: {
                                x: center.x - imageWidth / 2,
                                y: center.y - imageHeight / 2,
                            },
                            topRight: {
                                x: center.x + imageWidth / 2,
                                y: center.y - imageHeight / 2,
                            },
                            bottomRight: {
                                x: center.x + imageWidth / 2,
                                y: center.y + imageHeight / 2,
                            },
                            bottomLeft: {
                                x: center.x - imageWidth / 2,
                                y: center.y + imageHeight / 2,
                            },
                        };

                        vm.dots = {
                            topLeft: vm.map
                                .unproject(canvasDots.topLeft)
                                .toArray(),
                            topRight: vm.map
                                .unproject(canvasDots.topRight)
                                .toArray(),
                            bottomRight: vm.map
                                .unproject(canvasDots.bottomRight)
                                .toArray(),
                            bottomLeft: vm.map
                                .unproject(canvasDots.bottomLeft)
                                .toArray(),
                        };

                        drawImage();
                        drawScaleDots();
                        drawRotationDot();
                        updateModel();
                    });

                    vm.map.on("zoomstart", () => {
                        vm.startZoom = vm.map.getZoom()
                    });

                    vm.map.on("moveend", updateModel);
                    vm.map.on("zoomend", updateZoom);

                    if (isPlacedImageExists) {
                        drawImage();
                        drawScaleDots();
                        drawRotationDot();
                    }

                    vm.map.resize();
                    vm.map.setZoom(initValue.zoom);
                });

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

            function initImageWithPoints(initValue) {
                if (initValue.image) {
                    vm.image = initValue.image;
                }

                if (initValue.topLeftPoint) {
                    vm.dots.topLeft[0] = initValue.topLeftPoint.longitude;
                    vm.dots.topLeft[1] = initValue.topLeftPoint.latitude;

                    if (vm.showSetLayerByCoordinates) {
                        vm.topLeftInputLat = initValue.topLeftPoint.latitude;
                        vm.topLeftInputLng = initValue.topLeftPoint.longitude;
                    }
                }

                if (initValue.topRightPoint) {
                    vm.dots.topRight[0] = initValue.topRightPoint.longitude;
                    vm.dots.topRight[1] = initValue.topRightPoint.latitude;

                    if (vm.showSetLayerByCoordinates) {
                        vm.topRightInputLat = initValue.topRightPoint.latitude;
                        vm.topRightInputLng = initValue.topRightPoint.longitude;
                    }
                }

                if (initValue.bottomLeftPoint) {
                    vm.dots.bottomLeft[0] = initValue.bottomLeftPoint.longitude;
                    vm.dots.bottomLeft[1] = initValue.bottomLeftPoint.latitude;

                    if (vm.showSetLayerByCoordinates) {
                        vm.bottomLeftInputLat =
                            initValue.bottomLeftPoint.latitude;
                        vm.bottomLeftInputLng =
                            initValue.bottomLeftPoint.longitude;
                    }
                }

                if (initValue.bottomRightPoint) {
                    vm.dots.bottomRight[0] =
                        initValue.bottomRightPoint.longitude;
                    vm.dots.bottomRight[1] =
                        initValue.bottomRightPoint.latitude;

                    if (vm.showSetLayerByCoordinates) {
                        vm.bottomRightInputLat =
                            initValue.bottomRightPoint.latitude;
                        vm.bottomRightInputLng =
                            initValue.bottomRightPoint.longitude;
                    }
                }
            }

            function selectImage() {
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
                        removeImage();
                        processSelection(data.selection[0].image);
                        editorService.close();

                        const img = new Image();
                        img.onload = function () {
                            vm.imageAspectRatio = this.width / this.height;
                        };
                        img.src = vm.image;

                        updateModel();
                    },
                });
            }

            function processSelection(selection) {
                vm.image = selection;
            }

            function removeImage() {
                vm.image = "";
                clearPoints();
                updateModel();
            }

            function clearPoints(e, skipUpdate) {
                if (vm.dots.topLeft) {
                    vm.dots.topLeft = [];
                }

                if (vm.dots.topRight) {
                    vm.dots.topRight = [];
                }

                if (vm.dots.bottomLeft) {
                    vm.dots.bottomLeft = [];
                }

                if (vm.dots.bottomRight) {
                    vm.dots.bottomRight = [];
                }

                if (vm.map.getLayer("image")) {
                    vm.map.removeLayer("image");
                }

                if (vm.map.getSource("image")) {
                    vm.map.removeSource("image");
                }

                Object.values(vm.dots).map((dot, i) => {
                    const pointId = `point-${i}`;

                    if (vm.map.getLayer(pointId)) {
                        vm.map.removeLayer(pointId);
                    }
                    if (vm.map.getSource(pointId)) {
                        vm.map.removeSource(pointId);
                    }
                });

                if (!skipUpdate) {
                    updateModel();
                }
            }

            function updatePoints() {
                //TODO update points

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
                    $scope.model.value.topLeftPoint = {};
                    $scope.model.value.topRightPoint = {};
                    $scope.model.value.bottomLeftPoint = {};
                    $scope.model.value.bottomRightPoint = {};

                    $scope.model.value.image = vm.image ? vm.image : null;

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

                    updateDotsModel();
                }, 0);
            }

            function updateDotsModel() {
                if (
                    vm.dots.topLeft &&
                    vm.dots.topLeft[0] &&
                    vm.dots.topLeft[1]
                ) {
                    const point = {
                        lng: vm.dots.topLeft[0],
                        lat: vm.dots.topLeft[1],
                    };

                    if (!$scope.model.value.topLeftPoint) {
                        $scope.model.value.topLeftPoint = {};
                    }

                    $scope.model.value.topLeftPoint.latitude = point.lat;
                    $scope.model.value.topLeftPoint.longitude = point.lng;
                    vm.topLeftInputLat = point.lat;
                    vm.topLeftInputLng = point.lng;
                } else {
                    $scope.model.value.topLeftPoint = null;
                    vm.topLeftInputLat = null;
                    vm.topLeftInputLng = null;
                }

                if (
                    vm.dots.topRight &&
                    vm.dots.topRight[0] &&
                    vm.dots.topRight[1]
                ) {
                    const point = {
                        lng: vm.dots.topRight[0],
                        lat: vm.dots.topRight[1],
                    };

                    if (!$scope.model.value.topRightPoint) {
                        $scope.model.value.topRightPoint = {};
                    }

                    $scope.model.value.topRightPoint.latitude = point.lat;
                    $scope.model.value.topRightPoint.longitude = point.lng;
                    vm.topRightInputLat = point.lat;
                    vm.topRightInputLng = point.lng;
                } else {
                    $scope.model.value.topRightPoint = null;
                    vm.topRightInputLat = null;
                    vm.topRightInputLng = null;
                }

                if (
                    vm.dots.bottomLeft &&
                    vm.dots.bottomLeft[0] &&
                    vm.dots.bottomLeft[1]
                ) {
                    const point = {
                        lng: vm.dots.bottomLeft[0],
                        lat: vm.dots.bottomLeft[1],
                    };

                    if (!$scope.model.value.bottomLeftPoint) {
                        $scope.model.value.bottomLeftPoint = {};
                    }

                    $scope.model.value.bottomLeftPoint.latitude = point.lat;
                    $scope.model.value.bottomLeftPoint.longitude = point.lng;
                    vm.bottomLeftInputLat = point.lat;
                    vm.bottomLeftInputLng = point.lng;
                } else {
                    $scope.model.value.bottomLeftPoint = null;
                    vm.bottomLeftInputLat = null;
                    vm.bottomLeftInputLng = null;
                }

                if (
                    vm.dots.bottomRight &&
                    vm.dots.bottomRight[0] &&
                    vm.dots.bottomRight[1]
                ) {
                    const point = {
                        lng: vm.dots.bottomRight[0],
                        lat: vm.dots.bottomRight[1],
                    };

                    if (!$scope.model.value.bottomRightPoint) {
                        $scope.model.value.bottomRightPoint = {};
                    }

                    $scope.model.value.bottomRightPoint.latitude = point.lat;
                    $scope.model.value.bottomRightPoint.longitude = point.lng;
                    vm.bottomRightInputLat = point.lat;
                    vm.bottomRightInputLng = point.lng;
                } else {
                    $scope.model.value.bottomRightPoint = null;
                    vm.bottomRightInputLat = null;
                    vm.bottomRightInputLng = null;
                }
            }

            const getDotGeoJson = (coordinates) => {
                return {
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates,
                            },
                        },
                    ],
                };
            };

            const setLayerProperty = (layer, value, name) => {
                if (!vm.map.getLayer(layer)) return;
                try {
                    vm.map.setPaintProperty(
                        layer,
                        name || "raster-opacity",
                        value
                    );
                } catch (e) {
                    console.log(e);
                }
            };

            const isPointInsidePolygon = (point, polygonDots) => {
                // ray-casting algorithm based on
                // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

                var x = point[0],
                    y = point[1];

                var inside = false;
                for (
                    var i = 0, j = polygonDots.length - 1;
                    i < polygonDots.length;
                    j = i++
                ) {
                    var xi = polygonDots[i][0],
                        yi = polygonDots[i][1];
                    var xj = polygonDots[j][0],
                        yj = polygonDots[j][1];

                    var intersect =
                        yi > y != yj > y &&
                        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
                    if (intersect) inside = !inside;
                }

                return inside;
            };

            // calc angle ABC
            // expecting coordinates for each point
            const calcAngle = (A, B, C) => {
                const x1 = A[0] - B[0]; // Vector 1 - x
                const y1 = A[1] - B[1]; // Vector 1 - y

                const x2 = C[0] - B[0]; // Vector 2 - x
                const y2 = C[1] - B[1]; // Vector 2 - y

                let angle = Math.atan2(y1, x1) - Math.atan2(y2, x2);
                angle = (angle * 360) / (2 * Math.PI);

                // if (angle < 0) {
                //   angle += 360;
                // }

                return angle;
            };

            const calcRotationDotCoordinates = (rectangleDots) => {
                const rectangleDotsArray = Object.values(rectangleDots);

                if (rectangleDotsArray.find(d => d.length < 2)) {
                    return null;
                }

                const [ACoordinates, BCoordinates, CCoordinates, DCoordinates] =
                    rectangleDotsArray;

                const imageCenterCoordinates = turf.center(
                    turf.points(rectangleDotsArray)
                ).geometry.coordinates;

                if (BCoordinates[0] - ACoordinates[0] === 0) {
                    const distance = CCoordinates[1] - ACoordinates[1];
                    return [
                        imageCenterCoordinates[0] + (distance / 4) * 3,
                        imageCenterCoordinates[1],
                    ];
                } else if (BCoordinates[1] - ACoordinates[1] === 0) {
                    const distance = CCoordinates[0] - ACoordinates[0];
                    return [
                        imageCenterCoordinates[0],
                        imageCenterCoordinates[1] + (distance / 4) * 3,
                    ];
                }

                const slope =
                    (BCoordinates[1] - ACoordinates[1]) /
                    (BCoordinates[0] - ACoordinates[0]);

                const aMultiplier = slope;
                const bMultiplier = -1;
                const cMultiplier = slope * -ACoordinates[0] + ACoordinates[1];

                const temp =
                    (-2 *
                        (aMultiplier * imageCenterCoordinates[0] +
                            bMultiplier * imageCenterCoordinates[1] +
                            cMultiplier)) /
                    (aMultiplier * aMultiplier + bMultiplier * bMultiplier);
                return [
                    ((temp * aMultiplier) / 4) * 3 + imageCenterCoordinates[0],
                    ((temp * bMultiplier) / 4) * 3 + imageCenterCoordinates[1],
                ];
            };

            // straightDotsCoordinatesArray is an array of two dots coordinates on this straight
            const calcDotToStragightDistance = (
                dotCoordinates,
                straightDotsCoordinatesArray
            ) => {
                // was using this https://cutt.ly/59F0j6v
                // and this https://cutt.ly/n9F0gtK
                const [ACoordinates, BCoordinates] = straightDotsCoordinatesArray;

                if (BCoordinates[0] - ACoordinates[0] === 0) {
                    return Math.abs(dotCoordinates[0] - BCoordinates[0]);
                } else if (BCoordinates[1] - ACoordinates[1] === 0) {
                    return Math.abs(dotCoordinates[1] - BCoordinates[1]);
                }

                const slope =
                    (BCoordinates[1] - ACoordinates[1]) /
                    (BCoordinates[0] - ACoordinates[0]);

                const aMultiplier = slope;
                const bMultiplier = -1;
                const cMultiplier = slope * -ACoordinates[0] + ACoordinates[1];

                const distance =
                    Math.abs(
                        aMultiplier * dotCoordinates[0] +
                        bMultiplier * dotCoordinates[1] +
                        cMultiplier
                    ) / Math.sqrt(aMultiplier * aMultiplier + bMultiplier * bMultiplier);

                return distance;
            };

            const calcScaledCoordinates = (
                oldCoordinates,
                scalingDotIndex,
                newDotLngLat
            ) => {
                const oldCoordinatesArray = Object.values(oldCoordinates);
                const oldDotCoordinates = oldCoordinatesArray[scalingDotIndex];

                const oppositeDotIndex = (scalingDotIndex + 2) % 4;
                const oppositeDotCoordinates = oldCoordinatesArray[oppositeDotIndex];

                const segmentOne = [
                    oldCoordinatesArray[(scalingDotIndex + 1) % 4],
                    oldCoordinatesArray[(scalingDotIndex + 2) % 4],
                ];
                const segmentTwo = [
                    oldCoordinatesArray[(scalingDotIndex + 2) % 4],
                    oldCoordinatesArray[(scalingDotIndex + 3) % 4],
                ];

                const newDotCoordinates = newDotLngLat.toArray();

                const distanceOne = calcDotToStragightDistance(
                    newDotCoordinates,
                    segmentOne
                );
                const distanceTwo = calcDotToStragightDistance(
                    newDotCoordinates,
                    segmentTwo
                );

                let newDistance;
                if (distanceOne > distanceTwo) {
                    newDistance = distanceOne;
                } else {
                    newDistance = distanceTwo;
                }

                const oldDistance = calcDotToStragightDistance(
                    oldDotCoordinates,
                    segmentOne
                );
                if (!oldDistance) return oldCoordinates;
                const scaleFactor = newDistance / oldDistance;
                if (scaleFactor <= 0) {
                    return oldCoordinates;
                }

                const polygon = turf.polygon([
                    [...oldCoordinatesArray, oldCoordinatesArray[0]],
                ]);
                const scaledPolygon = turf.transformScale(polygon, scaleFactor, {
                    origin: oppositeDotCoordinates,
                });

                const newDotsCoordinatesArray =
                    scaledPolygon.geometry.coordinates[0].slice(0, 4);

                return {
                    topLeft: newDotsCoordinatesArray[0],
                    topRight: newDotsCoordinatesArray[1],
                    bottomRight: newDotsCoordinatesArray[2],
                    bottomLeft: newDotsCoordinatesArray[3],
                };
            };

            const calcRotatedCoordinates = (
                oldCoordinates,
                oldDotCoordinates,
                newDotLngLat
            ) => {
                const oldCoordinatesArray = Object.values(oldCoordinates);

                const imageCenterCoordinates = turf.center(
                    turf.points(oldCoordinatesArray)
                ).geometry.coordinates;

                const rotatingAngle = calcAngle(
                    oldDotCoordinates,
                    imageCenterCoordinates,
                    newDotLngLat.toArray()
                );

                const poly = turf.polygon([
                    [...oldCoordinatesArray, oldCoordinatesArray[0]],
                ]);
                const options = { pivot: imageCenterCoordinates };
                const rotatedPoly = turf.transformRotate(poly, rotatingAngle, options);

                const newDotsCoordinatesArray = rotatedPoly.geometry.coordinates[0];
                return {
                    topLeft: newDotsCoordinatesArray[0],
                    topRight: newDotsCoordinatesArray[1],
                    bottomRight: newDotsCoordinatesArray[2],
                    bottomLeft: newDotsCoordinatesArray[3],
                };
            };

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
