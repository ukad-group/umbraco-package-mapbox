angular
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
            vm.selectImage = () => {};
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

            vm.rotationDot = [];

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
            vm.roundZoomToNatural =
                $scope.model.config.roundZoomToNatural != null
                    ? Object.toBoolean($scope.model.config.roundZoomToNatural)
                    : false;
            vm.showOpacityEnabled =
                $scope.model.config.showOpacity != null
                    ? Object.toBoolean($scope.model.config.showOpacity)
                    : false;
            vm.showOpacity = false;

            vm.halfDiagonal;
            vm.centerCoordsPx = [];
            vm.normalizedVectors = [];
            vm.normalizedRotationDotVector = [];

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
                    opacity: 100
                };

                const initValue = $scope.model.value || defaultValue;

                vm.inputOpacity = vm.showOpacityEnabled
                    ? initValue.opacity
                    : 100;
                vm.rotationDot = initValue.rotationDot;
                vm.halfDiagonal = initValue.halfDiagonal;
                vm.centerCoordsPx = initValue.centerCoordsPx;
                vm.normalizedVectors = initValue.normalizedVectors;
                vm.normalizedRotationDotVector = initValue.normalizedRotationDotVector;

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

                if (vm.scrollWheelZoom === false) {
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
                });

                vm.map.on("load", async () => {
                    vm.selectImage = selectImage;

                    const canvas = vm.map.getCanvasContainer();

                    const sizeMultiplier = 0.15;
                    const mapContainer = document.getElementById(vm.mapId);
                    let containerSize = {
                        width: mapContainer.offsetWidth,
                        height: mapContainer.height,
                    };
                    let mouseDownCoords;
                    let isDragging = false;
                    let imageDraggingStartDots;
                    let isDraggingDot = false;
                    

                    const defineDots = () => {
                        const [ x0, y0 ] = vm.centerCoordsPx;
                        const dotsPx = vm.normalizedVectors.map(vector => {
                            const [x, y] = vector;

                            return [
                                x * vm.halfDiagonal + x0,
                                y * vm.halfDiagonal + y0
                              ]
                        });
                        const rotationDotPx = [
                            vm.normalizedRotationDotVector[0] * vm.halfDiagonal + x0,
                            vm.normalizedRotationDotVector[1] * vm.halfDiagonal + y0
                        ];

                        vm.dots = {
                            topLeft: vm.map.unproject(dotsPx[0]).toArray(),
                            topRight: vm.map.unproject(dotsPx[1]).toArray(),
                            bottomRight: vm.map.unproject(dotsPx[2]).toArray(),
                            bottomLeft: vm.map.unproject(dotsPx[3]).toArray(),
                        };
                        vm.rotationDot = vm.map.unproject(rotationDotPx).toArray();
                    };

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
                                "raster-opacity": vm.inputOpacity / 100
                            },
                        });
                        vm.setOpacity = () => {
                            setLayerProperty("image", vm.inputOpacity / 100);
                        };
                    };

                    const drawScaleDots = () => {
                        Object.values(vm.dots).map((dot, dotIndex) => {
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
                                if (dotIndex === 0 || dotIndex === 2) {
                                    canvas.style.cursor = "nwse-resize";
                                } else {
                                    canvas.style.cursor = "nesw-resize";
                                }
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
                                vm.map.scrollZoom.disable();

                                canvas.style.cursor = "grab";
                                setLayerProperty("image", 0.5);
                                Object.values(vm.dots).map((dot, i) => {
                                    const pointId = `point-${i}`;
                
                                    if (vm.map.getLayer(pointId)) {
                                        setLayerProperty(pointId, 0, "circle-opacity");
                                    }
                                    if (vm.map.getSource(pointId)) {
                                        setLayerProperty(pointId, 0, "circle-opacity");
                                    }
                                });

                                if (vm.map.getSource('rotation-dot')) {
                                    setLayerProperty('rotation-dot', 0, "circle-opacity");
                                }

                                const onDragPoint = (e) => {
                                    isDraggingDot = true;
                                    calcScaledCoordsPx(vm.dots, dotIndex, e.lngLat)
                                    defineDots();
                                    vm.map
                                        .getSource("image")
                                        ?.setCoordinates(
                                            Object.values(vm.dots)
                                        );

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

                                    if (vm.rotationDot) {
                                        vm.map
                                            .getSource("rotation-dot")
                                            ?.setData(getDotGeoJson(vm.rotationDot));
                                    }
                                };

                                vm.map.on("mousemove", onDragPoint);
                                vm.map.once("mouseup", (e) => {
                                    isDraggingDot = false;
                                    Object.values(vm.dots).map((dot, dotIndex) => {
                                        const pointId = `point-${dotIndex}`;

                                        setLayerProperty(pointId, 1, "circle-opacity");
                                    });

                                    setLayerProperty('rotation-dot', 1, "circle-opacity");
                                    setLayerProperty("image", vm.inputOpacity / 100);
                                    vm.map.off("mousemove", onDragPoint);
                                    vm.map.scrollZoom.enable();
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

                        if (vm.rotationDot) {
                            vm.map.addSource("rotation-dot", {
                                type: "geojson",
                                data: getDotGeoJson(vm.rotationDot),
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
                            vm.map.scrollZoom.disable();

                            canvas.style.cursor = "grab";
                            setLayerProperty("image", 0.5);
                            Object.values(vm.dots).map((dot, i) => {
                                const pointId = `point-${i}`;
            
                                if (vm.map.getLayer(pointId)) {
                                    setLayerProperty(pointId, 0, "circle-opacity");
                                }
                                if (vm.map.getSource(pointId)) {
                                    setLayerProperty(pointId, 0, "circle-opacity");
                                }
                            });

                            if (vm.map.getSource('rotation-dot')) {
                                setLayerProperty('rotation-dot', 0, "circle-opacity");
                            }

                            const onDragPoint = (e) => {
                                isDraggingDot = true;
                                calcRotatedCoordsPx(vm.dots, vm.rotationDot, e.lngLat);
                                defineDots();
                                vm.map
                                    .getSource("image")
                                    ?.setCoordinates(
                                        Object.values(vm.dots)
                                    );

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

                                if (vm.rotationDot) {
                                    vm.map
                                        .getSource("rotation-dot")
                                        ?.setData(getDotGeoJson(vm.rotationDot));
                                }
                            };

                            vm.map.on("mousemove", onDragPoint);
                            vm.map.once("mouseup", (e) => {
                                isDraggingDot = false;
                                Object.values(vm.dots).map((dot, dotIndex) => {
                                    const pointId = `point-${dotIndex}`;

                                    setLayerProperty(pointId, 1, "circle-opacity");
                                });

                                if (vm.rotationDot) {
                                    vm.map
                                        .getSource("rotation-dot")
                                        ?.setData(getDotGeoJson(vm.rotationDot));
                                }

                                setLayerProperty('rotation-dot', 1, "circle-opacity");
                                setLayerProperty("image", vm.inputOpacity / 100);
                                vm.map.off("mousemove", onDragPoint);
                                vm.map.scrollZoom.enable();
                            });
                        });
                    };

                    vm.map.on("mousedown", (e) => {
                        const isOnImage = isPointInsidePolygon(
                            e.lngLat.toArray(),
                            Object.values(vm.dots)
                        );
  

                        mouseDownCoords = e.lngLat.toArray();
                        imageDraggingStartDots = vm.dots;

                        Object.values(vm.dots).map((dot, i) => {
                            const pointId = `point-${i}`;
        
                            if (vm.map.getLayer(pointId)) {
                                setLayerProperty(pointId, 0, "circle-opacity");
                            }
                            if (vm.map.getSource(pointId)) {
                                setLayerProperty(pointId, 0, "circle-opacity");
                            }
                        });

                        if (vm.map.getSource('rotation-dot')) {
                            setLayerProperty('rotation-dot', 0, "circle-opacity");
                        }

                        if (isOnImage) {
                            vm.map.dragPan.disable();
                        };

                        const onMoveImage = (e) => {
                            if (isDraggingDot || !imageDraggingStartDots) return;
      
                            isDragging =
                                mouseDownCoords &&
                                e.lngLat.toArray().join("") !==
                                mouseDownCoords.join("");
      
                            if (!isDragging) return;
      
                            setLayerProperty("image", 0.5);

                            calcMovedCoordsPx(imageDraggingStartDots, mouseDownCoords, e.lngLat.toArray());
                            defineDots();
      
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

                            vm.map
                                .getSource("image")
                                ?.setCoordinates(Object.values(vm.dots));

                            if (vm.rotationDot) {
                                vm.map
                                    .getSource("rotation-dot")
                                    ?.setData(getDotGeoJson(vm.rotationDot));
                            }
                        };

                        vm.map.on("mousemove", onMoveImage);
                        vm.map.once("mouseup", () => {
                            vm.map.dragPan.enable();
                            setLayerProperty("image", vm.inputOpacity / 100);

                            Object.values(vm.dots).map((dot, dotIndex) => {
                                const pointId = `point-${dotIndex}`;

                                setLayerProperty(pointId, 1, "circle-opacity");
                            });

                            setLayerProperty('rotation-dot', 1, "circle-opacity");

                            updateModel();
                            vm.map.off("mousemove", onMoveImage);
                        });
                    });

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
                            submit: async function (data) {
                                removeImage();
                                processSelection(data.selection[0].image);
                                editorService.close();

                                const loadImage = () => {
                                    return new Promise((resolve, reject) => {
                                        const img = new Image();

                                        img.onload = () => resolve(img);
                                        img.onerror = reject;
                                        img.src = vm.image;
                                    });
                                };

                                const image = await loadImage();

                                vm.imageAspectRatio = image.width / image.height;

                                if (!vm.image) {
                                    return;
                                }
        
                                const imageWidth = containerSize.width * sizeMultiplier;
                                const imageHeight = imageWidth / vm.imageAspectRatio;

                                const dotsVectors = [
                                    [
                                        - imageWidth / 2,
                                        - imageHeight / 2,
                                    ],
                                    [
                                        imageWidth / 2,
                                        - imageHeight / 2,
                                    ],
                                    [
                                        imageWidth / 2,
                                        imageHeight / 2,
                                    ],
                                    [
                                        - imageWidth / 2,
                                        imageHeight / 2,
                                    ],
                                ];

                                const normalizeVector = (vector) => {
                                    const [ x, y ] = vector;
                                    const length = Math.sqrt(x * x + y * y);

                                    return [x / length, y / length];
                                };

                                vm.halfDiagonal = Math.sqrt(imageWidth * imageWidth + imageHeight * imageHeight) / 2;
                                vm.normalizedVectors = dotsVectors.map(vector => normalizeVector(vector));
                                vm.normalizedRotationDotVector = [0, -1];
                                vm.centerCoordsPx = [
                                    mapContainer.offsetWidth / 2,
                                    mapContainer.offsetHeight / 2,
                                ];

                                vm.showOpacity = vm.showOpacityEnabled;

                                defineDots();
                                drawImage();
                                drawScaleDots();
                                drawRotationDot();
                                updateModel();
                            },
                        });
                    }
                    
                    vm.map.on("zoomstart", () => {
                        vm.startZoom = vm.map.getZoom();
                    });

                    vm.map.on("moveend", updateModel);
                    vm.map.on("zoomend", updateZoom);

                    if (isPlacedImageExists) {
                        vm.showOpacity = vm.showOpacityEnabled;

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

            function processSelection(selection) {
                vm.image = selection;
            }

            function removeImage() {
                vm.showOpacity = false;
                vm.inputOpacity = 100;
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

                if (vm.map.getLayer("rotation-dot")) {
                    vm.map.removeLayer("rotation-dot");
                }

                if (vm.map.getSource("rotation-dot")) {
                    vm.map.removeSource("rotation-dot");
                }

                if (!skipUpdate) {
                    updateModel();
                }
            }

            function updatePoints() {
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
                    $scope.model.value.rotationDot = vm.rotationDot;
                    $scope.model.value.image = vm.image ? vm.image : null;
                    $scope.model.value.opacity = vm.inputOpacity;
                    $scope.model.value.halfDiagonal = vm.halfDiagonal;
                    $scope.model.value.centerCoordsPx = vm.centerCoordsPx;
                    $scope.model.value.normalizedVectors = vm.normalizedVectors;
                    $scope.model.value.normalizedRotationDotVector = vm.normalizedRotationDotVector;

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

            const calcAngle = (A, B, C) => {
                const x1 = A[0] - B[0]; // Vector 1 - x
                const y1 = A[1] - B[1]; // Vector 1 - y

                const x2 = C[0] - B[0]; // Vector 2 - x
                const y2 = C[1] - B[1]; // Vector 2 - y

                return Math.atan2(y2, x2) - Math.atan2(y1, x1);
            };

            // straightDotsCoordinatesArray is an array of two dots coordinates on this straight
            const calcDotToStraightDistance = (
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

            const getDistanceBetweenTwoDots = (A, B) => {
                const [x1, y1] = A;
                const [x2, y2] = B;

                return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            };

            const calcScaledCoordsPx = (
                oldCoordinates,
                scalingDotIndex,
                cursorLngLat
            ) => {
                // array of coords in lnglat
                const oldCoordinatesArray = Object.values(oldCoordinates);

                // convert array of coords and newdo in pixels
                const oldCoordsArrayPx = oldCoordinatesArray.map(
                    coords => Object.values(vm.map.project(coords))
                );
                const cursorPx = Object.values(vm.map.project(cursorLngLat.toArray()));

                const oppositeDotIndex = (scalingDotIndex + 2) % 4;
                const oppositeDotCoordinates = oldCoordsArrayPx[oppositeDotIndex];

                // Get the current size of the image in pixels
                const currentWidth = getDistanceBetweenTwoDots(
                    oldCoordsArrayPx[(scalingDotIndex + 1) % 4],
                    oppositeDotCoordinates,
                );
                const currentHeight = getDistanceBetweenTwoDots(
                    oppositeDotCoordinates,
                    oldCoordsArrayPx[(scalingDotIndex + 3) % 4],
                );

                // data for calculating new sizes
                const segmentOne = [
                    oppositeDotCoordinates,
                    oldCoordsArrayPx[(scalingDotIndex + 3) % 4],
                ];
                const segmentTwo = [
                    oldCoordsArrayPx[(scalingDotIndex + 1) % 4],
                    oppositeDotCoordinates,
                ];

                let newWidth = calcDotToStraightDistance(cursorPx, segmentOne);
                let newHeight = calcDotToStraightDistance(cursorPx, segmentTwo);

                const aspectRatio = currentWidth / currentHeight;
                const newAspectRatio = newWidth / newHeight;

                if (newAspectRatio > aspectRatio) {
                    newWidth = newHeight * aspectRatio;
                } else {
                    newHeight = newWidth / aspectRatio;
                }

                const newDiagonal = Math.sqrt(newWidth * newWidth + newHeight * newHeight);
                const newDot = [
                    vm.normalizedVectors[scalingDotIndex][0] * newDiagonal + oppositeDotCoordinates[0],
                    vm.normalizedVectors[scalingDotIndex][1] * newDiagonal + oppositeDotCoordinates[1],
                ];

                vm.centerCoordsPx = [
                    (oppositeDotCoordinates[0] + newDot[0]) / 2,
                    (oppositeDotCoordinates[1] + newDot[1]) / 2,
                ];
                vm.halfDiagonal = newDiagonal / 2;
            };

            const calcMovedCoordsPx = (
                oldCoordinates,
                initialCursorCoords,
                newCursorCoords
            ) => {
                const oldCoordinatesArray = Object.values(oldCoordinates);
                const oldCoordsArrayPx = oldCoordinatesArray.map(
                    coords => Object.values(vm.map.project(coords))
                );
                const initialCursorPx = Object.values(vm.map.project(initialCursorCoords));
                const newCursorPx = Object.values(vm.map.project(newCursorCoords));
                const delta = initialCursorPx.map(
                    (value, i) => newCursorPx[i] - value
                );
                const oldCenterPx = [
                    (oldCoordsArrayPx[0][0] + oldCoordsArrayPx[2][0]) / 2,
                    (oldCoordsArrayPx[0][1] + oldCoordsArrayPx[2][1]) / 2,
                ];
                const width = getDistanceBetweenTwoDots(
                    oldCoordsArrayPx[0],
                    oldCoordsArrayPx[1],
                );
                const height = getDistanceBetweenTwoDots(
                    oldCoordsArrayPx[0],
                    oldCoordsArrayPx[3],
                );
                const newDiagonal = Math.sqrt(width * width + height * height);

                vm.centerCoordsPx = oldCenterPx.map(
                    (value, i) => value + delta[i]
                );
                vm.halfDiagonal = newDiagonal / 2;
            };

            const calcRotatedCoordsPx = (
                oldCoordinates,
                oldDotCoordinates,
                cursorLngLat
            ) => {
                const oldCoordinatesArray = Object.values(oldCoordinates);
                const oldCoordsArrayPx = oldCoordinatesArray.map(
                    coords => Object.values(vm.map.project(coords))
                );
                const cursorPx = Object.values(vm.map.project(cursorLngLat.toArray()));
                const oldDotPx = Object.values(vm.map.project(oldDotCoordinates));
                const centerDotPx = [
                    (oldCoordsArrayPx[0][0] + oldCoordsArrayPx[2][0]) / 2,
                    (oldCoordsArrayPx[0][1] + oldCoordsArrayPx[2][1]) / 2
                ];
                
                const width = getDistanceBetweenTwoDots(
                    oldCoordsArrayPx[0],
                    oldCoordsArrayPx[1],
                );
                const height = getDistanceBetweenTwoDots(
                    oldCoordsArrayPx[0],
                    oldCoordsArrayPx[3],
                );
                const newDiagonal = Math.sqrt(width * width + height * height);
                const rotationAngle = calcAngle(
                    oldDotPx,
                    centerDotPx,
                    cursorPx
                );

                const rotateVector = (vector, angle) => {
                    const [x, y] = vector;

                    return [
                        x * Math.cos(angle) - y * Math.sin(angle),
                        x * Math.sin(angle) + y * Math.cos(angle),
                    ];
                };

                vm.halfDiagonal = newDiagonal / 2;
                vm.normalizedVectors = vm.normalizedVectors.map(
                    vector => rotateVector(vector, rotationAngle)
                );
                vm.normalizedRotationDotVector = rotateVector(vm.normalizedRotationDotVector, rotationAngle);
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
