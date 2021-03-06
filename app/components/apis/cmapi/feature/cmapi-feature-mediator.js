define([
], function () {
	var context,
        parent;

	return {
        init: function(thisContext, thisParent) {
            context = thisContext;
            parent = thisParent;

            //context.sandbox.on('map.features.plot', olMapRenderer.plotFeatures);
        },
        plotFeatures: function(message) {
          context.sandbox.emit('map.features.plot', message);
        },
        plotFinish: function(params) {
            context.sandbox.emit('data.finished', params);
        },
        plotError: function(params) {
            context.sandbox.emit('data.error', params);
        },
        createLayer: function(args) {
            context.sandbox.emit('map.layer.create', args);
        },
        hideFeatures: function(args) {
            context.sandbox.emit('map.features.hide', args);
        },
        showFeatures: function(args) {
            context.sandbox.emit('map.features.show', args);
        },
        zoomToFeatures: function(args){
            context.sandbox.emit('map.zoom.toLayer', args);
        }
    };

});