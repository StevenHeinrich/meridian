define([
    './playback'
], function (playback) {
    var context;

    var exposed = {
        init: function(thisContext){
            context = thisContext;
            context.sandbox.on('timeline.playback.start', playback.startPlayback);
            context.sandbox.on('timeline.playback.stop', playback.stopPlayback);
        },
        startPlayback: function(params){
            context.sandbox.emit('timeline.playback.start', params);
        },
        stopPlayback: function(params){
            context.sandbox.emit('timeline.playback.stop', params);
        },
        publishMessage: function(params) {
            context.sandbox.emit('message.publish', params); 
        }
    };

    return exposed;
});