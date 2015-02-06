define([
    './../map-api-publisher',
    './base',
    './navigation',
    './layers',
    './features',
    './draw',
    './clustering',
    './heatmap',
    './../libs/v3.0.0/build/ol-debug' //TODO make this 'ol' to minimize when ready
], function(
    publisher,
    mapBase,
    mapNavigation,
    mapLayers,
    mapFeatures,
    mapDraw,
    mapClustering,
    mapHeatmap
){
    var context,
        map;

    var exposed = {
        /**
         * Initialize Map Renderer
         * @param {object} thisContext - Aura's sandboxed 'this'
         */
        init: function(thisContext) {
            context = thisContext;
            addFunctionsToOL();

            mapBase.init(context);
            mapClustering.init(context);
            mapDraw.init(context);
            mapFeatures.init(context);
            mapHeatmap.init(context);
            mapLayers.init(context);
            mapNavigation.init(context);

            exposed.createMap();
        },
        /**
         * Create an ol Map
         * @param {object} params - JSON parameters
         * @param {string} params.el - name of map (optional)
         */
        createMap: function(params) {
            map = mapBase.createMap(params);

            mapLayers.loadBasemaps({
                map: map
            });

//            mapNavigation.zoomToExtent({
//                map: map,
//                minLon: context.sandbox.mapConfiguration.initialMinLon,
//                minLat: context.sandbox.mapConfiguration.initialMinLat,
//                maxLon: context.sandbox.mapConfiguration.initialMaxLon,
//                maxLat: context.sandbox.mapConfiguration.initialMaxLat
//            });

            exposed.setBasemap({
                map: map,
                basemap: context.sandbox.mapConfiguration.defaultBaseMap
            });

            mapLayers.createStaticLayers({
                map: map
            });
            
//            context.sandbox.stateManager.map.visualMode = context.sandbox.mapConfiguration.defaultVisualMode;
            
            context.sandbox.stateManager.triggerMapStatusReady();
        },
        /**
         * Zoom In
         */
        zoomIn: function() {
            mapNavigation.zoomIn({
                map: map
            });
        },
        /**
         * Zoom Out
         */
        zoomOut: function() {
            mapNavigation.zoomOut({
                map: map
            });
        },
        /**
         * Zoom to Extent
         * @param {object} params - JSON parameters
         * @param {float} params.minLon - minimum longitude
         * @param {float} params.minLat - minimum latitude
         * @param {float} params.maxLon - maximum longitude
         * @param {float} params.maxLat - maximum latitude
         */
        zoomToExtent: function(params) {
            mapNavigation.zoomToExtent({
                map: map,
                minLon: params.minLon,
                minLat: params.minLat,
                maxLon: params.maxLon,
                maxLat: params.maxLat
            });
        },
        /**
         * Zoom in to Layer
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         */
        zoomToLayer: function(params) {
            mapNavigation.zoomToLayer({
                map: map,
                layerId: params.layerId
            });
        },
        /**
         * Zoom in to Features
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         * @param {array} params.featureIds - array of featureIds
         */
        zoomToFeatures: function(params) {
            mapNavigation.zoomToFeatures({
                map: map,
                layerId: params.layerId,
                featureIds: params.featureIds
            });
        },
        /**
         * Set the Basemap
         * @param {object} params - JSON parameters
         * @param {string} params.basemapLayer - name of basemap layer
         */
        setBasemap: function(params) {
            mapLayers.setBasemap({
                map: map,
                basemap: params.basemap
            });
        },
        /**
         * Set Map Center Position
         * @param {object} params - JSON parameters
         * @param {float} params.lat - latitude
         * @param {float} params.lon - longitude
         */
        setCenter: function(params) {
            mapNavigation.setCenter({
                map: map,
                lat: params.lat,
                lon: params.lon
            });
        },
        /**
         * Start Drawing on Static Drawing Layer
         */
        startDrawing: function() {
            mapDraw.startDrawing({
                map: map,
                layerId: 'static_draw'
            });
        },
        /**
         * Clear Features on Static Drawing Layer
         */
        clearDrawing: function() {
            mapDraw.clearDrawing({
                map: map,
                layerId: 'static_draw'
            });
        },
        /**
         * Create Layer
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         * @param {object} params.styleMap - style map properties (optional)
         * @param {boolean} params.selectable - add layer to select control (optional)
         * @param {object} params.events - custom event listeners (optional)
         */
        createLayer: function(params) { // TODO: look into this more, it is currently always creating a Vector Layer. Channels may need to be more specific.
            var newLayer,
                layerOptions = {
                    layerId: params.layerId,
                    layerType: params.layerType,
                    canCluster: params.canCluster
                };
            layerOptions.map = map;
//            mapClustering.addClusteringToLayerOptions(layerOptions);

            // If a symbolizers were provided, overwrite the default symbolizers from clustering
//            if(params.symbolizers) {
//                layerOptions.styleMap = mapClustering.applyCustomSymbolizers({
//                    symbolizers: params.symbolizers
//                });
//            }
            // If a styleMap was provided, overwrite the default style from clustering
            if(params.styleMap) {
                layerOptions.styleMap = params.styleMap;
            }
//            if(params.selectable) {
//                layerOptions.selectable = params.selectable;
//            }
            newLayer = mapLayers.createVectorLayer(layerOptions);
//            mapLayers.addEventListenersToLayer({
//                map: map,
//                layer: newLayer,
//                eventListeners: params.events // Can pass in your own event listeners or take the default by not providing any
//            });
        },
        /**
         * Delete Layer
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         */
        deleteLayer: function(params) {
            mapLayers.deleteLayer({
                map: map,
                layerId: params.layerId
            });
        },
        /**
         * Set Layer Index (similar to z-index for layers)
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         * @param {integer} params.layerIndex - index of layer
         */
        setLayerIndex: function(params) {
            mapLayers.setLayerIndex({
                map: map,
                layerId: params.layerId,
                layerIndex: params.layerIndex
            });
        },
        /**
         * Plot Features
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         * @param {integer} params.layerIndex - index of layer
         */
        plotFeatures: function(params) {
            mapFeatures.plotFeatures({
                map: map,
                layerId: params.layerId,
                data: params.data
            });
            if(context.sandbox.stateManager.map.visualMode === 'heatmap') {
                mapHeatmap.update({
                    map: map
                });
            }
        },
        /**
         * Hide Features
         * @param {object} params - JSON parameters
         * @param {array} params.featureIds - ids of features to be hidden
         * @param {string} params.layerId - layer id
         * @param {boolean} params.exclusive - only these features are hidden
         */
        hideFeatures: function(params) {
            mapFeatures.hideFeatures({
                map: map,
                layerId: params.layerId,
                featureIds: params.featureIds,
                exclusive: params.exclusive
            });
            if(context.sandbox.stateManager.map.visualMode === 'heatmap') {
                mapHeatmap.update({
                    map: map
                });
            }
            publisher.updateEventCounter(); // TODO: Hack for updating event counter
        },
        /**
         * Show Features
         * @param {object} params - JSON parameters
         * @param {array} params.featureIds - ids of features to be shown
         * @param {string} params.layerId - layer id
//         */
        showFeatures: function(params) {
            mapFeatures.showFeatures({
                map: map,
                layerId: params.layerId,
                featureIds: params.featureIds,
                exclusive: params.exclusive
            });
            if(context.sandbox.stateManager.map.visualMode === 'heatmap') {
                mapHeatmap.update({
                    map: map
                });
            }
            publisher.updateEventCounter(); // TODO: Hack for updating event counter
        },
        /**
         * Update Features
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - layer id
         * @param {array} params.featureObjects - // Currently represents features to be updated
         */
        updateFeatures: function(params) {
            mapFeatures.updateFeatures({
                map: map,
                layerId: params.layerId,
                featureObjects: params.featureObjects // [{featureId: 123, style:{stylishstuff}}]
            });
        },
        /**
         * Hide Layer
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         */
        hideLayer: function(params) {
            mapLayers.hideLayer({
                map: map,
                layerId: params.layerId
            });
        },
        /**
         * Show Layer
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         */
        showLayer: function(params) {
            mapLayers.showLayer({
                map: map,
                layerId: params.layerId
            });
        },
        /**
         * Change Visual Mode
         * @param {object} params - JSON parameters
         * @param {string} params.mode - name of visual mode (cluster/feature/heatmap)
         */
        changeVisualMode: function(params) {
            mapBase.setVisualMode({
                map: map,
                mode: params.mode
            });
            mapLayers.visualModeChanged({
                map: map,
                mode: params.mode
            });
        },
        /**
         * Identify Specific Feature
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         * @param {string} params.featureId - id of feature
         */
        identifyRecord: function(params) {
            mapLayers.identifyFeature({
                map: map,
                layerId: params.layerId,
                featureId: params.featureId
            });
        },
        /**
         * Clear All Layers
         */
        clear: function() {
            mapBase.resetSelector({
                map: map
            });
            mapLayers.clear({
                map: map
            });
            mapLayers.createStaticLayers({
                map: map
            });
        }
    };

    function addFunctionsToOL(){
        ol.ENABLE_NAMED_COLORS = true; //Allows use of things like 'grey' to be used

        //Add a get function for layers by ID. This was included in OL2, but not in OL3
        if (ol.Map.prototype.getLayer === undefined) {
            ol.Map.prototype.getLayer = function (id) {
                var layer;
                this.getLayers().forEach(function (lyr) {
                    if (id == lyr.get('layerId')) {
                        layer = lyr;
                    }
                });
                return layer;
            }
        }
        if (ol.Map.prototype.getProjection === undefined) {
            ol.Map.prototype.getProjection = function (id) {
                return this.getView().getProjection();
            }
        }

        if (ol.layer.Layer.prototype.addFeatures === undefined) {
            ol.layer.Layer.prototype.addFeatures = function (features) {
                var source = this.getSource();

                //Sometimes, the source has a source itself. Go all the way down.
                while(source.source_){
                    source = source.source_;
                }
                source.addFeatures(features);
            }
        }

        if (ol.layer.Layer.prototype.getFeatures === undefined) {
            ol.layer.Layer.prototype.getFeatures = function (features) {
                var source = this.getSource();

                //Sometimes, the source has a source itself. Go all the way down.
                while(source.source_){
                    source = source.source_;
                }
                return source.getFeatures();
            }
        }

        if (ol.layer.Layer.prototype.clear === undefined) {
            ol.layer.Layer.prototype.clear = function () {
                this.getSource().clear();
            }
        }
    }

    return exposed;
});