define([
    'text!./basemap-gallery.css', 
    'text!./basemap-gallery.hbs',
    './basemap-gallery',
    './basemap-gallery-mediator',
    'handlebars'
], function(
    basemapGalleryCSS, 
    basemapGalleryHBS, 
    basemapGallery, 
    basemapGalleryMediator
) {

    return {
        initialize: function() {
            this.sandbox.utils.addCSS(basemapGalleryCSS, 'basemap-gallery-component-style');

            var thisContext = this,
                defaultBasemap,
                basemapGalleryTemplate = Handlebars.compile(basemapGalleryHBS);

            this.sandbox.utils.each(this.sandbox.mapConfiguration.basemaps, function(key, value) {
                if(value.basemap === thisContext.sandbox.mapConfiguration.defaultBaseMap) {
                    defaultBasemap = value;
                }
            });

            var html = basemapGalleryTemplate({
                "basemaps": this.sandbox.mapConfiguration.basemaps, 
                "defaultBasemap": defaultBasemap
            });
            this.html(html);
            
            basemapGalleryMediator.init(this);
            basemapGallery.init(this, basemapGalleryMediator);
            
            
        }
    };
                
});
