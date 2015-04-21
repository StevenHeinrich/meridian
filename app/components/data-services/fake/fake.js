define([
], function() {

    var context,
        mediator,
        DATASOURCE_NAME = 'fake',
        RESTORE_PAGE_SIZE = 500;

    var exposed = {

        init: function(thisContext, thisMediator) {
            context = thisContext;
            mediator = thisMediator;
        },
        executeQuery: function(params) {
            if(params.dataSourceId === DATASOURCE_NAME) {
                // Set a query ID to pass to the server
                params.queryId = context.sandbox.utils.UUID();

                // Create the snapshot prior to executing query, so user knows something happened
                if(!context.sandbox.dataStorage.datasets[params.queryId]) {
                    createLayer(params);
                }

                initiateQuery(params.name);
                queryData(params);
            }
        },
        stopQuery: function(params) {
            var layerState,
                dataTransferState,
                dataset = context.sandbox.dataStorage.datasets[params.layerId];

            //If the query is not related to this datasource, ignore
            if(dataset && dataset.dataService !== DATASOURCE_NAME){
                return;
            }

            context.sandbox.ajax.stopQuery({
                layerId: params.layerId
            });

            // Handle notifcations and state
            layerState = context.sandbox.stateManager.getLayerStateById({layerId: params.layerId});
            if(layerState) {
                // Check state manager for status of layer, if already stopped or finished don't publish message or change state
                dataTransferState = layerState.dataTransferState;

                if(dataTransferState !== 'stopped' && dataTransferState !== 'finished') {
                    mediator.publishMessage({
                        messageType: 'warning',
                        messageTitle: 'Data Service',
                        messageText: 'Query data transfer was stopped.'
                    });

                    mediator.removeFromProgressQueue();

                    context.sandbox.stateManager.setLayerStateById({
                        layerId: params.layerId,
                        state: {
                            dataTransferState: 'stopped'
                        }
                    });
                }
            }

        },
        clear: function() {
            var queryId;

            for(queryId in context.sandbox.dataStorage.datasets){
                if(context.sandbox.dataStorage.datasets[queryId].dataService === DATASOURCE_NAME){
                    delete context.sandbox.dataStorage.datasets[queryId];
                }
            }

            context.sandbox.ajax.clear();
        },
        deleteDataset: function(params) {
            // delete context.sandbox.dataStorage.datasets[params.layerId]; // TODO: like the clear above, use a method on dataStorage to delete layer instead of calling a delete directly
        },
        restoreDataset: function(params) {
            var queryName,
                minLat,
                maxLat,
                minLon,
                maxLon,
                getPage;

            //If the query is not related to this datasource, ignore
            if(params.dataSource === DATASOURCE_NAME) {

                queryName = params.queryName;

                if(!context.sandbox.dataStorage.datasets[params.queryId]) {

                    minLat = params.queryBbox ? params.queryBbox.bottom : null;
                    maxLat = params.queryBbox ? params.queryBbox.top : null;
                    minLon = params.queryBbox ? params.queryBbox.left : null;
                    maxLon = params.queryBbox ? params.queryBbox.right : null;

                    createLayer({queryId: params.queryId, name: queryName,
                        minLat: minLat, minLon: minLon, maxLat: maxLat, maxLon: maxLon});
                    initiateQuery(queryName);

                    getPage = function(params, start, pageSize){
                        var newAJAX = context.sandbox.dataStorage.getResultsByQueryAndSessionId(params.queryId, params.sessionId, start, pageSize, function(err, results){
                            if(err) {
                                //If the error was because we aborted, ignore
                                if(err.statusText === 'abort') {
                                    return;
                                }
                                
                                handleError({queryId: params.queryId});
                            } else if (!results || results.length === 0) {
                                completeQuery(queryName, params.queryId);
                            } else {
                                processDataPage(results, {queryId: params.queryId, name: queryName});
                                getPage(params, start + RESTORE_PAGE_SIZE, RESTORE_PAGE_SIZE);
                            }
                        });

                        context.sandbox.ajax.addActiveAJAX({
                            newAJAX: newAJAX,
                            layerId: params.queryId
                        });
                    };

                    getPage(params, 0, RESTORE_PAGE_SIZE);

                } else {
                    // TODO: What do we do if the data set is already on the map?
                    mediator.publishMessage({
                        messageType: 'warning',
                        messageTitle: 'Data Service',
                        messageText: 'Dataset already loaded.'
                    });
                }
            }
        }
    };

    function createLayer(params) {
        context.sandbox.dataStorage.datasets[params.queryId] = new Backbone.Collection();
        context.sandbox.dataStorage.datasets[params.queryId].dataService = DATASOURCE_NAME;
        context.sandbox.dataStorage.datasets[params.queryId].layerName = params.name || paramns.queryId;


        mediator.createLayer({
            layerId: params.queryId,
            name: params.name,
            selectable: true,
            coords: {
                minLat: params.minLat,
                minLon: params.minLon,
                maxLat: params.maxLat,
                maxLon: params.maxLon
            }
        });
    }

    function initiateQuery(queryName) {
        mediator.publishMessage({
            messageType: 'success',
            messageTitle: 'Data Service',
            messageText: queryName + ' query initiated'
        });
        mediator.addToProgressQueue();
    }

    function completeQuery(name, queryId) {
        mediator.publishMessage({
            messageType: 'success',
            messageTitle: 'Data Service',
            messageText: name + ' query complete'
        });

        context.sandbox.stateManager.setLayerStateById({
            layerId: queryId,
            state: {
                dataTransferState: 'finished'
            }
        });

        mediator.publishFinish({
            layerId: queryId
        });

        mediator.removeFromProgressQueue();
    }

    function processDataPage(data, params) {
        var layerId,
            newData = [],
            keys = context.sandbox.dataServices[DATASOURCE_NAME].keys,
            newKeys = {};

        layerId = params.queryId || data[0].properties.queryId;

        mediator.publishMessage({
            messageType: 'info',
            messageTitle: 'Data Service',
            messageText: data.length+ ' events have been added to ' + params.name + ' query layer.'
        });

        context.sandbox.stateManager.setLayerStateById({
            layerId: layerId,
            state: {
                dataTransferState: 'running'
            }
        });

        //For each feature, create the minimized feature to be stored locally, with all the fields needed for datagrid
        context.sandbox.utils.each(data, function(dataIndex, dataFeature){
            var newValue = {};

            if(keys){
                //For each of the keys required, if that property exists in the feature, hoist it
                //and give it the specified header name
                context.sandbox.utils.each(keys, function(index, keyMetadata){
                    if(dataFeature.properties[keyMetadata.property] !== undefined){
                        newValue[keyMetadata.property] = dataFeature.properties[keyMetadata.property];
                        if(!newKeys[keyMetadata.property]){
                            newKeys[keyMetadata.property] = keyMetadata;
                        }
                    }
                });
            }

            newValue.dataService = data[dataIndex].dataService = DATASOURCE_NAME;

            newValue.layerId = layerId;
            newValue.id = data[dataIndex].id = dataFeature.properties.featureId;
            newValue.geometry = dataFeature.geometry;
            newValue.type = dataFeature.type;
            newValue.properties = {};
            newValue.lat = dataFeature.geometry.coordinates[1];
            newValue.lon = dataFeature.geometry.coordinates[0];
            newValue.featureId = dataFeature.properties.featureId;

            context.sandbox.dataStorage.addData({
                datasetId: layerId,
                data: newValue
            });

            // Add style properties for map features, but not for local dataset storage
            context.sandbox.utils.each(context.sandbox.icons.getIconForFeature(dataFeature), function(styleKey, styleValue){
                newValue.properties[styleKey] = styleValue;
            });

            newData.push(newValue);
        });

        //Add new keys for the datagrid
        context.sandbox.dataStorage.insertKeys({
            keys: newKeys
        });

        // Clear data out from memory
        data = [];

        mediator.plotFeatures({
            layerId: layerId,
            data: newData
        });
    }

    function handleError(params) {
        mediator.publishMessage({
            messageType: 'error',
            messageTitle: 'Data Service',
            messageText: 'Connection to data service failed.'
        });

        mediator.removeFromProgressQueue();

        context.sandbox.stateManager.setLayerStateById({
            layerId: params.queryId,
            state: {
                dataTransferState: 'error'
            }
        });

        mediator.publishError({
            layerId: params.queryId
        });
    }

    function queryData(params) {
        var newAJAX = context.sandbox.utils.ajax({
            type: 'POST',
            url: context.sandbox.utils.getCurrentNodeJSEndpoint() + '/query/bbox/' + params.dataSourceId,
            data: {
                throttleMs: 0,
                minLat: params.minLat,
                minLon: params.minLon,
                maxLat: params.maxLat,
                maxLon: params.maxLon,
                start: params.start || 0,
                queryId: params.queryId || null,
                pageSize: params.pageSize,
                queryName: params.name,
                justification: params.justification
            },
            xhrFields: {
                withCredentials: true
            }
        })
        .done(function(data) {
            if(data && data.length > 0) {
                // Process and then loop to the next page
                processDataPage(data, params);
                params.start = parseInt(params.start || 0) + parseInt(params.pageSize);
                params.queryId = params.queryId || data[0].properties.queryId;
                queryData(params);
            } else {
                completeQuery(params.name, params.queryId);
            }

        })
        .error(function(e) {
            //If the error was because we aborted, ignore
            if(e.statusText === 'abort') {
                return;
            }
            handleError(params);
            return false;
        });

        context.sandbox.ajax.addActiveAJAX({
            newAJAX: newAJAX,
            layerId: params.queryId
        });
    }


    return exposed;

});
