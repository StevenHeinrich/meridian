define([
    './../map-api-publisher',
    './base',
    './navigation',
    './layers',
    './features',
    './draw',
    './../map/clustering',
    './heatmap',
    './../libs/leaflet-src'
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
    // Setup context for storing the context of 'this' from the component's main.js 
    var context;

    // Set Full-Scope Variables
    var map,
        drawnItemsLayer;

    var exposed = {
        /**
         * Initialize Map Renderer
         * @param {object} thisContext - Aura's sandboxed 'this'
         */
        init: function(thisContext) {
            context = thisContext;

            mapBase.init(context);
            // mapClustering.init(context);
            mapDraw.init(context);
            // mapFeatures.init(context);
            // mapHeatmap.init(context);
            mapLayers.init(context);
            mapNavigation.init(context);

            exposed.createMap();
        },
        /**
         * Create a Leaflet Map
         * @param {object} params - JSON parameters
         */
        createMap: function(params) {

            map = mapBase.createMap(params);

            mapLayers.loadBasemaps({
                "map": map
            });

            mapLayers.createViewLayers({
                "map": map
            });

            mapNavigation.zoomToExtent({
                "map": map,
                "minLon": context.sandbox.mapConfiguration.initialMinLon,
                "minLat": context.sandbox.mapConfiguration.initialMinLat,
                "maxLon": context.sandbox.mapConfiguration.initialMaxLon,
                "maxLat": context.sandbox.mapConfiguration.initialMaxLat
            });

            exposed.setBasemap({
                "map": map,
                "basemap": context.sandbox.mapConfiguration.defaultBaseMap
            });

            drawnItemsLayer = mapLayers.createDrawingLayer({
                "map": map
            });
            
            context.sandbox.stateManager.map.visualMode = context.sandbox.mapConfiguration.defaultVisualMode;
            
            context.sandbox.stateManager.map.status.setReady(true);

            mapDraw.setDrawingActions({
                "map": map,
                "drawnItemsLayer": drawnItemsLayer
            });

            //the following is all test code used for the initial demo. Slowly removing this...
            // var someIcon = L.icon({
            //     iconUrl: context.sandbox.mapConfiguration.markerIcons.default.icon,
            //     iconSize: [context.sandbox.mapConfiguration.markerIcons.default.width, context.sandbox.mapConfiguration.markerIcons.default.height],
            //     iconAnchor: [12,24],// offset from the top left corner.half the size of the width and then the entire value of the height to use the correct pin position.
            //     popupAnchor: [0,-12]// make pop up originate elsewhere instead of the actual point.
            // });

            // // var myPopup = L.popup.extend({
            // //     initialize: function(){}
            // // });
            
            
            // var buttonStr = "<div class='exportFeature'><button type='submit' class='btn btn-primary'>Delete</button></div>";
            
           
            //var point1 = L.marker([5,5], {icon: someIcon}).bindPopup("<div>Lat: " + 5 + "</div><div>Lon: "+5+"</div>");
            // var point2 = L.marker([6,6], {icon: someIcon}).bindPopup("<div>Lat: " + 5 + "</div><div>Lon: "+5+"</div>");
            // var point3 = L.marker([6,7], {icon: someIcon}).bindPopup("<div>Lat: " + 5 + "</div><div>Lon: "+5+"</div>");
            // var point4 = L.marker([7,7], {icon: someIcon}).bindPopup("<div>Lat: " + 5 + "</div><div>Lon: "+5+"</div>");
            // var square = L.rectangle([[5.5,5.5],[7.5,7.5]], context.sandbox.mapConfiguration.shapeStyles.rectangle.shapeOptions);
            // var query1 = L.featureGroup([point1]);
            // var query2 = new L.MarkerClusterGroup({
            //     maxClusterRadius: context.sandbox.mapConfiguration.clustering.thresholds.clustering.distance,
            //     iconCreateFunction: function(cluster){
            //         var childCount = cluster.getChildCount();
            //         //console.debug('a: ', cluster.__parent);

            //         var c = ' marker-cluster-';
            //         if (childCount < 10) {
            //             return new L.DivIcon({ html: '<div><span>' 
            //                 + childCount + '</span></div>',
            //                 className: 'marker-cluster' + ' marker-cluster-small',
            //                 iconSize: new L.Point(40, 40) });
            //         } else if (childCount < 100) {
            //            return new L.DivIcon({ html: '<div><span>'+ childCount + '</span></div>',
            //             className: 'marker-cluster' + c + 'medium',
            //             iconSize: new L.Point(40, 40) });
            //         } else {
            //             return new L.DivIcon({ html: '<div><span>'+ childCount + '</span></div>',
            //                 className: 'marker-cluster' + ' marker-cluster-large',
            //                 iconSize: new L.Point(40, 40) });
            //         }
            //     }
            // });
            // query2.addLayers([point2,point3,point4,square]);
            //  query2.addLayer(new L.marker([7.5,7], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
            //   query2.addLayer(new L.marker([7.5,7], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
            //    query2.addLayer(new L.marker([7.5,7], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
            // for (var i = 0; i <= 10; i++) {
            //     query2.addLayer(new L.marker([7,7], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
            //     query2.addLayer(new L.marker([6,6], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([8,8], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([9,9], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([10,10], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));
                // query2.addLayer(new L.marker([11,11], {icon: someIcon}).bindPopup("<div>Lat: " + 7 + "</div><div>Lon: "+ 7 +"</div>"));

            //};

        
            
            // query1.addTo(map);
            // //query2.addTo(map);
            // map.addLayer(query2);

            // query2.on('click', function(obj){
            //    //console.debug(obj);
            //    obj.layer.openPopup();
               //query2.removeLayer(obj.layer._leaflet_id);//this works
               //console.debug(query2._leaflet_id);
               //map.removeLayer(query2._leaflet_id);
               //map.removeLayer(point1);
            // });

            // query1.on('click', function(marker){
            //    var a = context.$('.exportFeature');
            //    a.on('click', function(b){
            //     //console.debug('marker: ', marker);
                
            //     query1.removeLayer(marker.layer);
            //    });
            //     //console.debug('query: ', query1);
            // });

            //  context.$('.marker-cluster').css('background-color', 'black');



            // var geoJson = {
            //     "features": [
            //       { "type": "Feature",
            //         "geometry": {"type": "Point", "coordinates": [9, 9]},
            //         "properties": {"prop0": "value0"}
            //         },
            //       { "type": "Feature",
            //         "geometry": {
            //           "type": "Point",
            //           "coordinates": [9, 9]
            //           },
            //         "properties": {
            //           "prop0": "value0",
            //           "prop1": 0.0
            //           }
            //         },
            //       { "type": "Feature",
            //          "geometry": {
            //            "type": "Point",
            //            "coordinates":[9, 9]
            //          },
            //          "properties": {
            //            "prop0": "value0",
            //            "prop1": {"this": "that"}
            //             },
            //         "style": {
            //           "height": 24,
            //           "width": 24,
            //           "icon": "https://cdn1.iconfinder.com/data/icons/Map-Markers-Icons-Demo-PNG/256/Map-Marker-Marker-Outside-Chartreuse.png",
            //           "iconLarge": "https://cdn1.iconfinder.com/data/icons/Map-Markers-Icons-Demo-PNG/256/Map-Marker-Marker-Outside-Chartreuse.png"
            //             }
            //         },
            //         { "type": "Feature",
            //            "geometry": {
            //            "type": "Polygon",
            //            "coordinates": [
            //              [ [10.0, 10.0], [11.0, 10.0], [11.0, 11.0],
            //                [10.0, 10.0], [10.0, 10.0] ]
            //              ]
            //          },
            //          "properties": {
            //            "prop0": "value0",
            //            "prop1": {"this": "that"}
            //            }
            //          }
            //     ]
            // };


            // var geoLayer = L.geoJson(geoJson,{
            //     onEachFeature: function(feature, layer){
            //         //layer.bindPopup(feature.properties.prop0);
            //         //console.debug('static feature',feature);
            //         //console.debug('static layer', layer);
            //     }
            // });
            // query2.addLayer(geoLayer);
            // map.addLayer(query2);
            // console.info('clusterGroup: ', query2);
            // console.info('geoJson layer: ', geoLayer);

        },
        /**
         * Zoom In
         */
        zoomIn: function() {
            mapNavigation.zoomIn({
                "map": map
            });
        },
        /**
         * Zoom Out
         */
        zoomOut: function() {
            mapNavigation.zoomOut({
                "map": map
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
                "map": map,
                "minLon": params.minLon,
                "minLat": params.minLat,
                "maxLon": params.maxLon,
                "maxLat": params.maxLat
            });
        },
        /**
         * Zoom in to Layer
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         */
        zoomToLayer: function(params) {
            mapNavigation.zoomToLayer({
                "map": map,
                "layerId": params.layerId
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
                "map": map,
                "layerId": params.layerId,
                "featureIds": params.featureIds
            });
        },
        /**
         * Set the Basemap
         * @param {object} params - JSON parameters
         * @param {string} params.basemapLayer - name of basemap layer
         */
        setBasemap: function(params) {
            mapLayers.setBasemap({
                "map": map,
                "basemap": params.basemap
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
                "map": map,
                "lat": params.lat,
                "lon": params.lon
            });
        },
        /**
         * Start Drawing on Static Drawing Layer
         */
        startDrawing: function() {
            mapDraw.startDrawing({
                "map": map,
            });
        },
        /**
         * Clear Features on Static Drawing Layer
         */
        clearDrawing: function() {
            mapLayers.clearDrawing({
                "map": map,
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
           // console.debug('params in renderer: ', params);
            var newLayer,
                layerOptions = {
                    "layerId": params.layerId,
                };
            layerOptions.map = map;
            //mapClustering.addClusteringToLayerOptions(layerOptions);

            // If a symbolizers were provided, overwrite the default symbolizers from clustering
            if(params.symbolizers) {
                // layerOptions.styleMap = mapClustering.applyCustomSymbolizers({
                //     "symbolizers": params.symbolizers
                // });
            }
            // // If a styleMap was provided, overwrite the default style from clustering
            if(params.styleMap) {
                layerOptions.styleMap = params.styleMap;
            }
            if(params.selectable) {
                layerOptions.selectable = params.selectable;
            }
           // console.debug(params.layerId);
            //console.debug(params.layerId.indexOf("_aoi"));

            if(params.layerId.indexOf("_aoi") !== -1){
                //remove the _aoi at the end of the layerId
                var tempStr = params.layerId.split('_aoi');
                layerOptions.layerId = tempStr[0];
            }
            mapLayers.createVectorLayer(layerOptions);
            // mapLayers.addEventListenersToLayer({
            //     "map": map,
            //     "layer": newLayer,
            //     "eventListeners": params.events // Can pass in your own event listeners or take the default by not providing any
            // });
        },
        /**
         * Delete Layer
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         */
        deleteLayer: function(params) {
            mapLayers.deleteLayer({
                "map": map,
                "layerId": params.layerId
            });
        },
        /**
         * Set Layer Index (similar to z-index for layers)
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         * @param {integer} params.layerIndex - index of layer
         */
        setLayerIndex: function(params) {
            // mapLayers.setLayerIndex({
            //     "map": map,
            //     "layerId": params.layerId,
            //     "layerIndex": params.layerIndex
            // });
        },
        /**
         * Plot Features
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         * @param {integer} params.layerIndex - index of layer
         */
        plotFeatures: function(params) {
            if(params.layerId.indexOf("_aoi") === -1){
                mapLayers.plotFeatures({
                    "map": map,
                    "layerId": params.layerId,
                    "data": params.data
                });
            }
            else{
                //remove the _aoi at the end of the layerId
                var tempStr = params.layerId.split('_aoi');
                mapLayers.plotFeatures({
                    "map": map,
                    "layerId": tempStr[0],
                    "data": params.data
                });
            }
           
            // if(context.sandbox.stateManager.map.visualMode === 'heatmap') {
            //     mapHeatmap.update({
            //         "map": map
            //     });
            // }
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
                "map": map,
                "layerId": params.layerId,
                "featureIds": params.featureIds,
                "exclusive": params.exclusive
            });
            if(context.sandbox.stateManager.map.visualMode === 'heatmap') {
                mapHeatmap.update({
                    "map": map
                });
            }
            publisher.updateEventCounter(); // TODO: Hack for updating event counter
        },
        /**
         * Show Features
         * @param {object} params - JSON parameters
         * @param {array} params.featureIds - ids of features to be shown
         * @param {string} params.layerId - layer id
         */
        showFeatures: function(params) {
            mapFeatures.showFeatures({
                "map": map,
                "layerId": params.layerId,
                "featureIds": params.featureIds,
                "exclusive": params.exclusive
            });
            if(context.sandbox.stateManager.map.visualMode === 'heatmap') {
                mapHeatmap.update({
                    "map": map
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
                "map": map,
                "layerId": params.layerId,
                "featureObjects": params.featureObjects // [{"featureId": 123, "style":{stylishstuff}}]
            });
        },
        /**
         * Hide Layer
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         */
        hideLayer: function(params) {
            mapLayers.hideLayer({
                "map": map,
                "layerId": params.layerId
            });
        },
        /**
         * Show Layer
         * @param {object} params - JSON parameters
         * @param {string} params.layerId - id of layer
         */
        showLayer: function(params) {
            mapLayers.showLayer({
                "map": map,
                "layerId": params.layerId
            });
        },
        /**
         * Change Visual Mode
         * @param {object} params - JSON parameters
         * @param {string} params.mode - name of visual mode (cluster/feature/heatmap)
         */
        changeVisualMode: function(params) {
            mapBase.setVisualMode({
                "map": map,
                "mode": params.mode
            });
            mapLayers.visualModeChanged({
                "map": map,
                "mode": params.mode
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
                "map": map,
                "layerId": params.layerId,
                "featureId": params.featureId
            });
        },
        /**
         * Clear All Layers
         */
        clear: function() {
            mapBase.resetSelector({
                "map": map
            });
            mapLayers.clear({
                "map": map
            });
            mapLayers.createStaticLayers({
                "map": map
            });
        }
    };
    
    return exposed;
});