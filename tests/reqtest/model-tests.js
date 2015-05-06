define([
    'chai',
    'meridian-config',
    'aura/aura',
    'mocha'
], function(chai, configuration, Aura) {

//This doesnt work on the command line by doing $ mocha <thisFile>
//Unless there is a way of including the require.js file and the config file in the command
//prompt, I only see this working in the browser.

    var assert = chai.assert,
        expect = chai.expect,
        should = chai.should(); // Note that should has to be executed
    function iThrowError() {
        throw new Error("Error thrown");
    }

//start your test here.
//mocha needs to see describe globally. If you try putting it in a function, it wont excecute. (Unless my test wasn't good.)
    describe('CMAPI Unit Test Channels', function () {
        var upload, cmapiMain, renderer, exitBeforeEach, meridian;

        //Read up on hooks: there might be a way of doing this outside the describe for a cleaner look.
        beforeEach(function (done) {
            exitBeforeEach = done;//Aura.then() function wont have access to done. I store it here and then call it.
            meridian = Aura({
                appName: 'Meridian',
                mediator: {maxListeners: 50},
                version: '1.0.0',
                releaseDate: '02/27/2015',
                cmapiVersion: '1.2.0',
                debug: true,
                sources: {default: 'components'}
            });
            //these extensions have .hbs files being loaded. Unless we host the test/index.html
            //it will throw the following error: Cross origin requests are only supported for protocol schemes.
            meridian.use('extensions/system-configuration-extension/system-configuration-extension')
                .use('extensions/utils-extension/utils-extension')
                .use('extensions/ajax-handler-extension/ajax-handler-extension')
                .use('extensions/session-extension/session-extension')
                .use('test/extensions/test-external-pubsub-extension/test-external-pubsub-extension') // added new
                .use('extensions/state-manager-extension/state-manager-extension')
                .use('extensions/data-storage-extension/data-storage-extension')
                // .use('extensions/splash-screen-extension/splash-screen-extension')
                .use('extensions/snapshot-extension/snapshot-extension')
                .use('extensions/map-configuration-extension/map-configuration-extension')
                .use('extensions/user-settings-extension/user-settings-extension')
                .use('extensions/support-configuration-extension/support-configuration-extension')
                .use('extensions/icon-extension/icon-extension')
                // .use('extensions/locator-extension/locator-query-extension')
                .use('extensions/exports/export-utils/export-utils')
                // .use('extensions/exports/geojson-extension/geojson-extension')
                // .use('extensions/exports/csv-extension/csv-extension')
                // .use('extensions/exports/kml-extension/kml-extension')
                // .use('extensions/exports/googlemaps-extension/googlemaps-extension')
                // .use('extensions/data-services/mock-extension/mock-extension')
                // .use('extensions/data-services/fake-extension/fake-extension')
                .use('extensions/cmapi-extension/cmapi-extension')  // added for cmapi
                // .use('extensions/upload-data-extension/upload-data-extension')
                .start({components: 'body'})
                .then(function () {
                    console.log('in then', meridian);
                    //start test
                    //must wait until aura starts before doing anything test related.
                    //If not, meridian variable will be undefined.
                    exitBeforeEach();

                });//end of then

        });//end of beforeEach

        //it("Message should match.", function() {
        //	require(['uploadComponent/upload-data-publisher'], function(upload){
        //		upload.init(meridian);
        //     console.log(meridian);
        //		console.log('upload component: ', upload);
        //		var actual;
        //
        //	var expected = {
        //		messageType: 'warning',
        //          messageTitle: 'Data Upload',
        //          messageText: 'File type not supported for upload'
        //	};
        //	meridian.sandbox.on('message.publish',function(params){
        //		actual = params;
        //	});
        //
        //		upload.publishMessage(expected);
        //		console.debug('actual: ', actual);
        //		console.debug('expected: ', expected);
        //		chai.assert.deepEqual(actual,expected);
        //	});
        //});//it
        // Capture the Map-click
        //it("Map Click", function () {
        //    require(['components/apis/cmapi/main'], function (cmapiMain) {
        //        console.log('in it', meridian);
        //        meridian.sandbox.external.postMessageToParent = function () {
        //            console.log('this is the map-click listener');
        //        };
        //meridian.sandbox.on('map.click', function(params) { console.log('zoomListen')} );
        //
        //        cmapiMain.initialize.call(meridian, meridian);
        //
        //        meridian.sandbox.emit('map.click', {
        //            lat: 11.910353555773261,
        //            lon: -8.020019531249982,
        //            button: "left",
        //            type: "single"
        //        }); // the lat/long is here //
        //
        //        //chai.assert.equal(actual, expected);
        //        //chai.assert.ok(false, 'this will fail');
        //
        //    });
        //});//it
        // Capture the Basemap change
        it("Change the Basemap Unit Test", function (done) {
            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {
                        // map goes first
                        var map = renderer.getMap(),
                            payload = {
                                "basemap": "imagery"
                            },
                            initialBasemap = {
                                "basemap": "landscape"
                            },
                            expectedBasemap = {  // expected value result after map.basemap.change emitted
                                "basemap": "imagery"
                            },
                            actualBasemap, mapUrl;
                        //test goes here
                        expect(payload).to.exist; // payload exists
                        expect(payload).to.be.an('object'); // payload is an object
                        meridian.sandbox.on('map.basemap.change', function(params) {
                            expectedBasemap;
                            actualBasemap = params;
                            expect(actualBasemap).to.exist; // payload is neither null or undefined
                            expect(actualBasemap).to.be.an('object'); // payload is an object
                            expect(initialBasemap).to.not.equal(actualBasemap);
                            console.debug('The actual basemap is not equal to the initial basemap -- a basemap change occured');
                            expect(actualBasemap).to.deep.equal(expectedBasemap);
                            console.debug('The actual basemap is equal to the expected basemap');
                            mapUrl = map["baseLayer"]["url"].indexOf("USGSImageryOnly");
                            expect(mapUrl).to.not.equal(-1);  // indexOf is -1 when the value does not occur in the string (false)
                            console.debug("The basemap is using a tilecache for imagery -- successful");  // This checks a specific property value that contains a substring as a URL when the basemap change is successful
                            done();
                        });
                        meridian.sandbox.external.receiveMessage({data:{channel:'map.basemap.change', message: payload }});  // manual publish to the channel
                    }
                };
                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
            });
        });//it

        // Capture the Create Layer
        it("Create a Layer (with overlayId) Unit Test", function (done) {
            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {
                        // map goes first
                        var map = renderer.getMap(),
                            payload = {
                                name: "Test Name 1",  // can't check name, because it isn't saved in OL
                                overlayId: "testOverlayId1",
                                coords: {
                                    minLat: "7.602108",
                                    minLon: "-13.908691",
                                    maxLat: "11.587669",
                                    maxLon: "-8.283691"
                                }
                            },
                            beforeLayerCount = map.layers.length, // layer count prior to the channel emit
                            afterLayerCount,
                            actualLayer;
                        //test goes here
                        map.events.register("addlayer", map, function(){
                            afterLayerCount = map.layers.length; // layer count prior to the channel emit
                            expect(afterLayerCount).to.be.above(beforeLayerCount); // confirmation that a layer was created
                            map.layers[map.layers.length-1];  //  last layer added
                            actualLayer = map.layers[map.layers.length-1];
                            expect(actualLayer).to.exist;
                            expect(actualLayer.layerId).to.equal(payload.overlayId);  // actual layerId should equal the payload overlayId
                            done();
                        });
                        meridian.sandbox.external.receiveMessage({data:{channel:'map.overlay.create', message: payload }});  // manual publish to the channel
                    }
                };
                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
            });
        });//it

        it("Create a Layer (without overlayId) Unit Test", function (done) {
            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {
                        // map goes first
                        var map = renderer.getMap(),
                            payload = {
                                name: "Test Name 1",  // can't check name, because it isn't saved in OL
                                overlayId: "",
                                coords: {
                                    minLat: "7.602108",
                                    minLon: "-13.908691",
                                    maxLat: "11.587669",
                                    maxLon: "-8.283691"
                                }
                            },
                            beforeLayerCount = map.layers.length, // layer count prior to the channel emit
                            afterLayerCount,
                            actualLayer;
                        //test goes here
                        map.events.register("addlayer", map, function(){
                            afterLayerCount = map.layers.length; // layer count prior to the channel emit
                            expect(afterLayerCount).to.be.above(beforeLayerCount); // confirmation that a layer was created
                            map.layers[map.layers.length-1];  //  last layer added
                            actualLayer = map.layers[map.layers.length-1];
                            expect(actualLayer.layerId).to.equal('cmapi');  // cmapi is the defaultLayerId assigned by cmapi when value is empty
                            done();
                        });
                        meridian.sandbox.external.receiveMessage({data:{channel:'map.overlay.create', message: payload }});  // manual publish to the channel
                    }
                };
                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
            });
        });//it

        //Capture Remove Layer
        it("Remove a Layer Unit Test", function (done) {
            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {
                        // map goes first
                        var map = renderer.getMap(),
                            payload = {
                                overlayId: "testOverlayId1"
                            },
                            beforeLayerCreateCount = map.layers.length, // layer count prior to the channel emit
                            afterLayerCreateCount,
                            afterLayerRemoveCount;
                        //test goes here
                        function layerCheck(layerExists, params) {
                            var searchTerm = "testOverlayId1",
                                index = -1,
                                mapLayers = params;
                            for(var i= 0, len = mapLayers.length; i < len; i++) {
                                if(mapLayers[i].layerId === searchTerm) {
                                    index = i;
                                    break;
                                }
                            }
                            if (layerExists) {
                                expect(index).to.not.equal(-1);
                                console.debug('Layer exists, create layer successful');
                            } else {
                                expect(index).to.equal(-1); // confirm that no layers contain layerId of testOverlayId1
                                console.debug('Layer does not exist, remove layer successful');
                            }
                        }
                        meridian.sandbox.on('map.layer.create', function(params) {
                            afterLayerCreateCount = map.layers.length;
                            expect(afterLayerCreateCount).to.be.above(beforeLayerCreateCount);  // after should be greater than before, confirms layer was created
                            expect(map.layers[map.layers.length-1]["layerId"]).to.equal(payload.overlayId); // confirms that Id is the overlayId value from the payload
                            layerCheck(true, map.layers);
                        });
                        meridian.sandbox.on('map.layer.delete', function(params) {
                            afterLayerRemoveCount = map.layers.length;
                            expect(afterLayerCreateCount).to.be.above(afterLayerRemoveCount);  // confirms the layer with overlayId value from payload was removed
                            layerCheck(false, map.layers);
                        });
                        meridian.sandbox.external.receiveMessage({data:{channel:'map.overlay.create', message: payload }}); // manual publish to the channel
                        meridian.sandbox.external.receiveMessage({data:{channel:'map.overlay.remove', message: payload }}); // manual publish to the channel
                    }
                };
                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
                done();
            });
        });//it

        // Capture Hide Layer
        it("Hide Layer Unit Test", function (done) {
            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {
                        // map goes first
                        var map = renderer.getMap(),
                            payload = {
                                overlayId: "testOverlayId1"
                            },
                            beforeLayerCreateCount = map.layers.length, // layer count prior to the channel emit
                            afterLayerCreateCount,
                            targetLayer;
                        //test goes here
                        meridian.sandbox.on('map.layer.create', function(params) {
                            afterLayerCreateCount = map.layers.length;
                            expect(afterLayerCreateCount).to.be.above(beforeLayerCreateCount);  // after should be greater than before, confirms layer was created
                            targetLayer = map.layers[map.layers.length-1];
                            expect(targetLayer.layerId).to.equal(payload.overlayId); // confirms that Id is the overlayId value from the payload
                            expect(targetLayer.getVisibility()).to.be.true; // confirms that the layer testOverlayId1 is visible
                            console.debug("The visibility of this layer is currently set to " + targetLayer.getVisibility());
                            meridian.sandbox.external.receiveMessage({data:{channel:'map.overlay.hide', message: payload }});
                            expect(targetLayer.getVisibility()).to.be.false; // confirms that the layer testOverlayId1 is not visible
                            console.debug("The visibility of this layer is currently set to " + targetLayer.getVisibility());
                            done();
                        });
                        meridian.sandbox.external.receiveMessage({data:{channel:'map.overlay.create', message: payload }}); // manual publish to the channel
                    }
                };
                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
            });
        });//it

        // Capture Show Layer
        it("Show Layer Unit Test", function (done) {
            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                console.debug(meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {
                        // map goes first
                        var map = renderer.getMap(),
                            payload = {
                                overlayId: "testOverlayId1"
                            },
                            beforeLayerCreateCount = map.layers.length, // layer count prior to the channel emit
                            afterLayerCreateCount,
                            targetLayer;
                        //test goes here
                        meridian.sandbox.on('map.layer.create', function(params) {
                            afterLayerCreateCount = map.layers.length;
                            expect(afterLayerCreateCount).to.be.above(beforeLayerCreateCount);  // after should be greater than before, confirms layer was created
                            targetLayer = map.layers[map.layers.length-1];
                            expect(targetLayer.layerId).to.equal(payload.overlayId); // confirms that Id is the overlayId value from the payload
                            expect(targetLayer.getVisibility()).to.be.true; // confirms that the layer testOverlayId1 is visible
                            console.debug("The visibility of this layer is currently set to " + targetLayer.getVisibility());
                            meridian.sandbox.external.receiveMessage({data:{channel:'map.overlay.hide', message: payload }});
                            expect(targetLayer.getVisibility()).to.be.false; // confirms that the layer testOverlayId1 is not visible
                            console.debug("The visibility of this layer is currently set to " + targetLayer.getVisibility());
                            meridian.sandbox.external.receiveMessage({data:{channel:'map.overlay.show', message: payload }});

                        });
                        meridian.sandbox.on('map.layer.show', function(params) {
                            console.log('its visible');
                            //done();
                        });
                        meridian.sandbox.external.receiveMessage({data:{channel:'map.overlay.create', message: payload }}); // manual publish to the channel
                    }
                };
                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
                done();
            });
        });//it

        // Capture the Zoom-in
        it("Map Zoom-In Unit Test", function (done) {
            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {
                        // map goes first
                        var map = renderer.getMap();
                        var afterZoom_state;
                        //test goes here
                        map.events.register("zoomend", map, function(){
                            afterZoom_state = map.getZoom();
                            expect(beforeZoom_state).to.exist;  // payload is neither null nor undefined
                            expect(afterZoom_state).to.exist;  // payload is neither null nor undefined
                            console.debug('This is the zoom level after the emit has been published ' + afterZoom_state);
                            expect(beforeZoom_state).to.not.equal(afterZoom_state);  // compare of the zoom level here
                            console.debug('The initial zoom level ' + beforeZoom_state + ' is less than the post-zoom-in zoom level ' + afterZoom_state + ', therefore, it correctly zoomed in');
                            expect(beforeZoom_state).to.be.below(afterZoom_state);
                            done();
                        });
                        var beforeZoom_state = map.getZoom();
                        console.debug('This is the initial map zoom level '+  beforeZoom_state);
                        meridian.sandbox.external.receiveMessage({data:{channel:'map.view.zoom.in', message: {} }});  // manual publish to the channel
                    }
                };
                //meridian.sandbox.on('map.zoom.in', function(params) { console.log('zoomListen')} );

                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
            });
        });//it
        // Capture the Zoom-out
        // ZOOMOUT START HERE

        //ZOOMOUT END HERE
        // Capture the Zoom to Max Extent
        it("Map Zoom to Max Extent Unit Test", function (done) {
            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {
                        // map goes first
                        var map = renderer.getMap();
                        var afterZoom_state,
                            afterCenter_pos;
                        //test goes here
                        // map.setCenter moved before the event register because it was logging a message in the console
                        map.setCenter(new OpenLayers.LonLat(38.860830, -77.059307), 5);
                        map.events.register("zoomend", map, function(){
                            afterZoom_state = map.getZoom();
                            afterCenter_pos = map.getCenter();
                            expect(beforeZoom_state).to.exist;  // payload is neither null nor undefined
                            expect(afterZoom_state).to.exist;  // payload is neither null nor undefined
                            console.debug('This is the zoom level after the emit has been published ' + afterZoom_state);
                            expect(beforeZoom_state).to.not.equal(afterZoom_state);  // compare of the zoom level
                            console.debug('This is the center position after the emit has been published ' + afterCenter_pos);
                            expect(beforeCenter_pos).to.not.equal(afterCenter_pos); // compare of the center position
                            console.debug('The initial zoom level ' + beforeZoom_state + ' is greater than the post-zoom-to-max-extent zoom level ' + afterZoom_state + ', therefore, it correctly zoomed out');
                            expect(beforeZoom_state).to.be.above(afterZoom_state);
                            done();
                        });
                        //map.setCenter(new OpenLayers.LonLat(38.860830, -77.059307), 5); // setCenter must go here to display
                        var beforeZoom_state = map.getZoom();
                        var beforeCenter_pos = map.getCenter();
                        console.debug('This is the initial map zoom level '+  beforeZoom_state);
                        console.debug('This is the initial center position '+  beforeCenter_pos);
                        meridian.sandbox.external.receiveMessage({data:{channel:'map.view.zoom.max.extent', message: {} }});  // manual publish to the channel
                    }
                };
                //meridian.sandbox.on('map.zoom.in', function(params) { console.log('zoomListen')} );
                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
            });
        });//it
        // Capture the Center Bounds
        it("Map Center to Bounds Unit Test", function (done) {
            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {
                        // map goes first
                        var map = renderer.getMap();
                        var payload = {
                            "bounds": {
                                "southWest": {
                                    "lat": 34.5,
                                    "lon": -124
                                },
                                "northEast": {
                                    "lat": 50.5,
                                    "lon": -79
                                }
                            }
                        }
                        expect(payload).to.exist; // payload exists
                        expect(payload).to.be.an('object'); // payload is an object
                        var expectedBounds_values = {  // expected values of the bounds result after map.view.center.bounds emitted
                            bottom: 42.50188756945924,
                            left: -102.20312499999488,
                            right: -100.79687499999713,
                            top: 43.53004857001649
                        }
                        //test goes here
                        //map.setCenter(new OpenLayers.LonLat(38.860830, -77.059307), 5); // setCenter must go here to display the error in the mocha HTML error log
                        map.events.register("moveend", map, function(){ // zoomend does not seem to work for this channel emit
                            var actualBounds_values = map.getExtent().transform(map.projection, map.projectionWGS84); // gets the extent and converts back to lat/lon, this value will change if a different projection is used
                            //var actualBounds_values = {  // expected values of the bounds result after map.view.center.bounds emitted
                            //    bottom: null,
                            //    left: -102.20312499999488,
                            //    right: -100.79687499999713,
                            //    top: 43.53004857001649
                            //}
                            expect(actualBounds_values).to.exist;           // actualBounds_values exists
                            console.debug('The actualBounds_values is not null or undefined');
                            expect(actualBounds_values).to.be.an('object'); // actualBounds_values is an object
                            console.debug('The actualBounds_values is an object');
                            expect(actualBounds_values.bottom).to.exist;    // not null or undefined
                            console.debug('The actual bounds object, bottom property exists: '+  actualBounds_values.bottom);
                            expect(actualBounds_values.left).to.exist;      // not null or undefined
                            console.debug('The actual bounds object, left property exists: '+  actualBounds_values.left);
                            expect(actualBounds_values.right).to.exist;    // not null or undefined
                            console.debug('The actual bounds object, right property exists: '+  actualBounds_values.right);
                            expect(actualBounds_values.top).to.exist;    // not null or undefined
                            console.debug('The actual bounds object, top property exists: '+  actualBounds_values.top);
                            expect(expectedBounds_values.bottom).to.equal(actualBounds_values.bottom);
                            console.debug('The actual bounds bottom property is equal to the expected bounds bottom property');
                            expect(expectedBounds_values.left).to.equal(actualBounds_values.left);
                            console.debug('The actual bounds left property is equal to the expected bounds left property');
                            expect(expectedBounds_values.right).to.equal(actualBounds_values.right);
                            console.debug('The actual bounds right property is equal to the expected bounds right property');
                            expect(expectedBounds_values.top).to.equal(actualBounds_values.top);
                            console.debug('The actual bounds top property is equal to the expected bounds top property');
                            done();
                        });
                        //map.setCenter(new OpenLayers.LonLat(38.860830, -77.059307), 5); // setCenter must go here to display the error in the mocha HTML error log
                        meridian.sandbox.external.receiveMessage({data:{channel:'map.view.center.bounds', message: payload }});  // manual publish to the channel
                    }
                };
                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
            });

        });//it

        it("Zoom Out: Should Set Map Zoom to 5, then Zoom Out to a level of 4.", function () {

            chai.should();
            var initialZoom = 0;
            var finalZoom;


            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {

                        var map = renderer.getMap();


                        map.setCenter([5, 5], 5);

                        var startingZoom = map.getZoom();

                        map.events.register("zoomend", map, function () {

                            console.debug('This is the zoom level after the emit has been published ' + map.getZoom());

                            // HERE IS THE ZOOM OUT TEST:
                            // THE -STARTING- ZOOM VALUE minus 1,
                            // SHOULD EQUAL THE -PRESENT- VALUE.

                            //console.log("Get Zoom: " + map.getZoom());

                            (startingZoom - 1).should.equal(map.getZoom());
                            meridian = null;

                        });


                        meridian.sandbox.external.receiveMessage({
                            data: {
                                channel: 'map.view.zoom.out',
                                message: {}
                            }
                        });
                        // manual publish to the channel
                        //console.log("MINUS ONE " + map.getZoom());
                        // compare of the zoom level here
                        //var actual
                    }
                };

                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
            });
        });//it

        it("Payload of Lat 30 / Lon 30 should convert and match post-conversion.", function () {

            chai.should();

            require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                console.log('in it', meridian);
                meridian.sandbox.external.postMessageToParent = function (params) {
                    if (params.channel == 'map.status.ready') {
                        var map = renderer.getMap();
                        meridian.sandbox.external.receiveMessage({
                            data: {
                                channel: 'map.view.center.location', message: {
                                    "location": {
                                        "lat": 30,
                                        "lon": 30
                                    }
                                }
                            }
                        });  // manual publish to the channel

                        var payloadCoords = map.getCenter().transform(map.projection, map.projectionWGS84);
                        console.debug("Post-Emited Raw Coordinates: " + map.getCenter());
                        console.debug("Converted Longitude: " + payloadCoords.lon);
                        console.debug("Converted Latitude: " + payloadCoords.lat);
                        chai.expect(payloadCoords.lon).to.be.above(29.99999999).and.below(30.00000001);
                        chai.expect(payloadCoords.lat).to.be.above(29.99999999).and.below(30.00000001);
                    }
                };

                cmapiMain.initialize.call(meridian, meridian);
                var $fixtures = $('#fixtures');
                meridian.html = $fixtures.html;
                renderer.initialize.call(meridian, meridian);
            });
        });//it
        
    });//describe
});
