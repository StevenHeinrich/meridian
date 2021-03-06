define([
    './../libs/openlayers-2.13.1/OpenLayers'
], function() {
    // Setup context for storing the context of 'this' from the component's main.js 
    var context;

    // Set Full-Scope Variables
    var drawControl;

    var exposed = {
        /**
         * Initialize Draw.js
         * @param  {object} thisContext Aura's sandboxed 'this'
         */
        init: function(thisContext) {
            context = thisContext;
        },
        /**
         * Activate Drawing
         * @param  {object} params Parameters JSON
         * @param {object} params.map the map object
         * @param {string} params.layerId the layerId
         * @param {integer} params.sides the number of sides on the polygon
         * @param {boolean} params.irregular true if sides can be of differing length
         */
        startDrawing: function(params) {
            // TODO: add switch for points and lines, along with the polygon support
            var polygonSides,
                polygonIrregular,
                drawLayer = params.map.getLayersBy('layerId', params.layerId)[0];

            if(!drawControl) {
                polygonSides = params.sides || 4;
                polygonIrregular = params.irregular || true;

                drawControl = new OpenLayers.Control.DrawFeature(
                    drawLayer,
                    OpenLayers.Handler.RegularPolygon, {
                        "handlerOptions": {
                            "sides": polygonSides,
                            "irregular": polygonIrregular
                        }
                    }
                );

                drawControl.id = 'drawControl';
                params.map.addControls([drawControl]);
            }
            
            drawControl.activate();

            context.$('#map').css('cursor', 'crosshair');
        },
        /**
         * Deactivate Drawing
         * @param  {object} params Parameters JSON
         * @param {object} params.map the map object
         * @param {string} params.layerId the layerId
         */
        clearDrawing: function(params) {
            var drawLayer;

            if(drawControl) {
                drawLayer = params.map.getLayersBy('layerId', params.layerId)[0];
                drawLayer.removeAllFeatures();
                drawControl.deactivate();
                drawControl = null;
            }

            context.$('#map').css('cursor', 'default');
        }
    };
    return exposed;
});