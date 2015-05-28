define([
    'chai',
    'meridian-config',
    'aura/aura',
    'mocha'
], function(chai, configuration, Aura) {
    var expect = chai.expect;

    //start your test here.
    //mocha needs to see describe globally. If you try putting it in a function, it wont excecute. (Unless my test wasn't good.)
    describe('View Channels', function () {
        var exitBeforeEach,
            meridian;

        //Read up on hooks: there might be a way of doing this outside the describe for a cleaner look.
        beforeEach(function (done) {
            exitBeforeEach = done;//Aura.then() function wont have access to done. I store it here and then call it.
            meridian = Aura({
                debug: true,
                appName: configuration.appName,
                sources: {default: 'components'},
                mediator: configuration.mediator,
                version: configuration.version,
                releaseDate: configuration.releaseDate,
                cmapiVersion: configuration.cmapiVersion
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
                .use('extensions/snapshot-extension/snapshot-extension')
                .use('extensions/map-configuration-extension/map-configuration-extension')
                .use('extensions/user-settings-extension/user-settings-extension')
                .use('extensions/support-configuration-extension/support-configuration-extension')
                .use('extensions/icon-extension/icon-extension')
                .use('extensions/exports/export-utils/export-utils')
                .use('extensions/cmapi-extension/cmapi-extension')  // added for cmapi
                .start({components: 'body'})
                .then(function () {
                    //start test
                    //must wait until aura starts before doing anything test related.
                    //If not, meridian variable will be undefined.
                    exitBeforeEach();
                });//end of then
        });//end of beforeEach

        describe('map.view.zoom.in', function () {
            // Capture the Zoom-in
            it('Base Test: Zoom In (Should Zoom In by 1)', function (done) {
                require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                    meridian.sandbox.external.postMessageToParent = function (params) {
                        var map,
                            beforeZoom_state,
                            afterZoom_state;

                        if (params.channel == 'map.status.ready') {
                            map = renderer.getMap();
                            map.events.register('zoomend', map, function () {
                                afterZoom_state = map.getZoom();
                                // EXPECT: We expect the Present (After) Zoom value to be one greater than Before we emitted Zoom In.
                                expect(afterZoom_state).to.equal(beforeZoom_state + 1);
                                done();
                            });
                            beforeZoom_state = map.getZoom();
                            // EXPECT: We expect the Initial Zoom value to be 4.
                            expect(beforeZoom_state).to.equal(4);
                            meridian.sandbox.external.receiveMessage({
                                data: {
                                    channel: 'map.view.zoom.in',
                                    message: {}
                                }
                            });  // manual publish to the channel
                        }
                    };
                    cmapiMain.initialize.call(meridian, meridian);
                    meridian.html = $('#fixtures').html;
                    renderer.initialize.call(meridian, meridian);
                });
            });//it
        }); // map.view.zoom
        describe('map.view.zoom.out', function () {
            it('Base Test: Zoom Out (Set zoom level manually, then zoom out by 1)', function (done) {
                this.timeout(5000);
                require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                    meridian.sandbox.external.postMessageToParent = function (params) {
                        var map,
                            beforeZoom_state,
                            afterZoom_state;

                        if (params.channel == 'map.status.ready') {
                            map = renderer.getMap();
                            map.setCenter([2, 2], 5);
                            map.events.register('zoomend', map, function () {
                                afterZoom_state = map.getZoom();
                                // EXPECT: We expect the Present (After) Zoom value to be one less than Before we emitted Zoom Out.
                                expect(afterZoom_state).to.equal(beforeZoom_state - 1);  // compare of the zoom level here
                                done();
                            });
                            beforeZoom_state = map.getZoom();
                            // EXPECT: We expect the Zoom State to Equal 5; the number manually set above in map.setCenter.
                            expect(beforeZoom_state).to.equal(5);
                            meridian.sandbox.external.receiveMessage({
                                data: {
                                    channel: 'map.view.zoom.out',
                                    message: {}
                                }
                            });  // manual publish to the channel
                        }
                    };
                    cmapiMain.initialize.call(meridian, meridian);
                    meridian.html = $('#fixtures').html;
                    renderer.initialize.call(meridian, meridian);
                });
            });//it

            it('Edge case: Set zoom level to zero, check zoom level after the channel emit', function (done) {
                this.timeout(5000);
                var passed = true,
                    map;
                require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                    meridian.sandbox.external.postMessageToParent = function (params) {
                        if (params.channel == 'map.status.ready') {
                            map = renderer.getMap();
                            map.setCenter([2, 2], 2);
                            map.events.register('zoomend', map, function () {
                                passed = false;
                            });
                            meridian.sandbox.external.receiveMessage({
                                data: {
                                    channel: 'map.view.zoom.out',
                                    message: {}
                                }
                            });
                            setTimeout(function () {
                                // EXPECT: We wait 500ms, then expect passed to not have failed us.
                                // If it failed, zoomend would have registered.
                                // In this case, 2 is the maximum Zoom Out value for our 700x700 setup.
                                // If after we set zoom to 2 via map.setCenter, we try to emit a Zoom Out, it should not register.
                                expect(passed).to.be.equal(true);
                                done();
                            }, 500);
                        }
                    };
                    cmapiMain.initialize.call(meridian, meridian);
                    meridian.html = $('#fixtures').html;
                    renderer.initialize.call(meridian, meridian);
                });
            });//it
        }); // map.view.zoom.out
        describe('map.view.zoom.max.extent', function () {
            // Capture the Zoom to Max Extent
            it('Base Test: Map Zoom to Max Extent', function (done) {
                this.timeout(5000);
                require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                    meridian.sandbox.external.postMessageToParent = function (params) {
                        var map,
                            beforeZoom_state,
                            afterZoom_state;

                        if (params.channel == 'map.status.ready') {
                            map = renderer.getMap();
                            map.setCenter(new OpenLayers.LonLat(2.860830, -6.059307), 5);
                            map.events.register('zoomend', map, function(){
                                afterZoom_state = map.getZoom();
                                // EXPECT: We expect that after the emit, our Zoom Level should be BELOW the beforeZoom_state.
                                // NOTE: The MaxExtent number can change depending on the map's size.
                                // In this Mocha test, with a map window of 700x700, we expect the MaxExtent level to be 2.
                                expect(afterZoom_state).to.equal(beforeZoom_state-3);
                                done();
                            });
                            beforeZoom_state = map.getZoom();
                            // EXPECT: We expect our before Zoom to Match our manually entered data via map.setCenter.
                            expect(beforeZoom_state).to.equal(5);
                            meridian.sandbox.external.receiveMessage({data:{channel:'map.view.zoom.max.extent', message: {} }});  // manual publish to the channel
                        }
                    };
                    cmapiMain.initialize.call(meridian, meridian);
                    meridian.html = $('#fixtures').html;
                    renderer.initialize.call(meridian, meridian);
                });
            });//it
        }); // map.view.zoom.max.extent
        describe('map.view.center.location', function () {
            it('Base Test: Map Zoom to Center Location (Check coordinates match expected results after channel emit)', function (done) {
                require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                    meridian.sandbox.external.postMessageToParent = function (params) {
                        var map,
                            payloadCoords;

                        if (params.channel == 'map.status.ready') {
                            map = renderer.getMap();
                            meridian.sandbox.external.receiveMessage({
                                data: {
                                    channel: 'map.view.center.location', message: {
                                        location: {
                                            lat: 30,
                                            lon: 30
                                        }
                                    }
                                }
                            });  // manual publish to the channel
                            payloadCoords = map.getCenter().transform(map.projection, map.projectionWGS84);
                            chai.expect(payloadCoords.lon).to.be.above(29.99999999).and.below(30.00000001);
                            chai.expect(payloadCoords.lat).to.be.above(29.99999999).and.below(30.00000001);
                            done();
                        }
                    };
                    cmapiMain.initialize.call(meridian, meridian);
                    meridian.html = $('#fixtures').html;
                    renderer.initialize.call(meridian, meridian);
                });
            });//it
        });//map.view.center.location
        describe('map.view.center.bounds', function () {
            // Capture the Center Bounds
            it('Base Test: Map Center to Bounds', function (done) {
                require(['components/apis/cmapi/main', 'components/rendering-engines/map-openlayers/main'], function (cmapiMain, renderer) {
                    meridian.sandbox.external.postMessageToParent = function (params) {
                        var map,
                            payload,
                            expectedBounds_values,
                            actualBounds_values;
                        if (params.channel == 'map.status.ready') {
                            map = renderer.getMap();
                            payload = {
                                bounds: {
                                    southWest: {
                                        lat: 34.5,
                                        lon: -124
                                    },
                                    northEast: {
                                        lat: 50.5,
                                        lon: -79
                                    }
                                }
                            };
                            expect(payload).to.exist; // payload exists
                            expect(payload).to.be.an('object'); // payload is an object
                            expectedBounds_values = {  // expected values of the bounds result after map.view.center.bounds emitted
                                bottom: 30.76711104806655,
                                left: -116.88085937499952,
                                right: -86.11914062499609,
                                top: 53.23679754234628
                            };
                            //map.setCenter(new OpenLayers.LonLat(38.860830, -77.059307), 5); // setCenter must go here to display the error in the mocha HTML error log
                            map.events.register('moveend', map, function () { // zoomend does not seem to work for this channel emit
                                actualBounds_values = map.getExtent().transform(map.projection, map.projectionWGS84); // gets the extent and converts back to lat/lon, this value will change if a different projection is used
                                expect(actualBounds_values).to.exist;           // actualBounds_values exists
                                expect(actualBounds_values).to.be.an('object'); // actualBounds_values is an object
                                expect(actualBounds_values.bottom).to.exist;    // not null or undefined
                                expect(actualBounds_values.left).to.exist;      // not null or undefined
                                expect(actualBounds_values.right).to.exist;    // not null or undefined
                                expect(actualBounds_values.top).to.exist;    // not null or undefined
                                expect(expectedBounds_values.bottom).to.equal(actualBounds_values.bottom);
                                expect(expectedBounds_values.left).to.equal(actualBounds_values.left);
                                expect(expectedBounds_values.right).to.equal(actualBounds_values.right);
                                expect(expectedBounds_values.top).to.equal(actualBounds_values.top);
                                done();
                            });
                            //map.setCenter(new OpenLayers.LonLat(38.860830, -77.059307), 5); // setCenter must go here to display the error in the mocha HTML error log
                            meridian.sandbox.external.receiveMessage({
                                data: {
                                    channel: 'map.view.center.bounds',
                                    message: payload
                                }
                            });  // manual publish to the channel
                        }
                    };
                    cmapiMain.initialize.call(meridian, meridian);
                    meridian.html = $('#fixtures').html;
                    renderer.initialize.call(meridian, meridian);
                });
            });//it
        }); // map.view.center.bounds

        describe('map.view.center.overlay - DEFUNCT', function () {
          //replace with seth's most current version later
        }); // map.view.center.overlay
    });//describe
});



