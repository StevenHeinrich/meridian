/**
 * Express app is set up in the top level folder and passed down. This file is for
 * defining all of the required routes
 *
 * @param app
 */

var context = {};

var use = function(path){
    require('./' + path + '/main').init(context);
};

exports.init = function(app){

    context.app = app;
    context.sandbox = {};

    // Profile - uncomment to use a local instance of elastic search
//    require('./extensions/utils/Config').setProfile("local-test");

    // Extensions
    use('extensions/config');
    use('extensions/cors');
    use('extensions/authorization');
    use('extensions/elastic');
    use('extensions/gazetteer');
    use('extensions/kmltogeojson');
    use('extensions/transformation');
    use('extensions/xml-parser');
    use('extensions/display-names');

    // Components
    use('components/mock');
    use('components/fake');
    use('components/file-upload');
    use('components/file-download');

};
