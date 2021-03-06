define([
    'bootstrap'
], function () {
    var context,
        mediator,
        $supportButton;

    var exposed = {
        init: function(thisContext, thisMediator) {
            context = thisContext;
            mediator = thisMediator;
            $supportButton = context.$('#basemapGalleryToggleButton');

            //Activate bootstrap tooltip. 
            //Specify container to make the tooltip appear in one line. (Buttons are small and long text is stacked.)
            $supportButton.tooltip({
                container: 'body',
                delay: {
                    show: 500
                }
            });

            $supportButton.on('click', function(event) {
                event.preventDefault();
                if($supportButton.hasClass('active')) {
                    mediator.closeBasemapGallery();
                } else {
                    mediator.openBasemapGallery();
                }
            });
        },
        setActive: function() {
            $supportButton.addClass('active');
        },
        removeActive: function() {
            $supportButton.removeClass('active');
        },
        clear: function() {
        }
    };

    return exposed;
});