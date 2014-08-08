define([
], function () {
    var context,
        $progressNotificationSpinner,
        progressQueue = [];

    var exposed = {
        init: function(thisContext) {
            context = thisContext;
            $progressNotificationSpinner = context.$('.spinner');
            console.debug($progressNotificationSpinner);
        },
        addToQueue: function(params) {
            progressQueue.push(params.progressId);
            if(progressQueue.length) {
                $progressNotificationSpinner.addClass('active');
            }
        },
        removeFromQueue: function(params) {
            context.sandbox.utils.each(progressQueue, function(key, value) {
                if(value === params.progressId) {
                    progressQueue.splice(key, 1);
                    return false;
                }
            });
            if(!progressQueue.length) {
                $progressNotificationSpinner.removeClass('active');
            }
        }
    };

    return exposed;
});