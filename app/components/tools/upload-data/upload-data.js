define([
    'bootstrap'
], function () {
    var context,
        mediator,
        DATASOURCE_NAME = 'upload',
        $modal,
        $file,
        $dummyFile,
        $submit,
        $zoom,
        RESTORE_PAGE_SIZE = 500;

    var exposed = {
        init: function(thisContext, thisMediator) {
            context = thisContext;
            mediator = thisMediator;
            $modal = context.$('#upload-data-modal');
            $file = context.$('#file');
            $dummyFile = context.$('#dummy-file');
            $submit = context.$('#upload-submit');
            $zoom = context.$('#zoomOnUpload');

            $submit.prop('disabled', true); //Start with submit disabled until a file is added

            $modal.modal({
                backdrop: true,
                keyboard: true,
                show: false
            }).on('hidden.bs.modal', function() {
                mediator.closeUploadTool();
            });

            //Tie the hidden <file> input with the pretty UI one
            context.$('#open-file').on('click', function(){
                $file.click();
            });

            //When a file is selected, check that it is a CSV file and
            //update the UI if there is an error
            $file.on('change', function(){
                var file = context.$(this)[0].files[0],
                    fileExtension,
                    FILE_SIZE_LIMIT = 10000000, //10M
                    isValidFileExtension = false;
                $dummyFile.val(context.$(this).val());

                if(file){
                    if(file.size > FILE_SIZE_LIMIT){
                        $dummyFile.parent().addClass('has-error');
                        $submit.prop('disabled', true);
                        mediator.publishMessage({
                            messageType: 'error',
                            messageTitle: 'Data Upload',
                            messageText: 'File too big - 10MB limit'
                        });
                    }else{
                        fileExtension = context.sandbox.utils.getFileExtension(file);
                        context.sandbox.utils.each(context.sandbox.dataServices[DATASOURCE_NAME].configuration.filetypes,
                            function(filetype, filetypeProperties){
                                if(filetype === fileExtension){
                                    isValidFileExtension = true;
                                }
                            });

                        if(isValidFileExtension){
                            removeFileError();
                            $submit.prop('disabled', false);
                        }else{
                            setFileError();
                            $submit.prop('disabled', true);
                        }
                    }
                }else{
                    removeFileError(); //'no file' is valid, or at least not an error
                    $submit.prop('disabled', true);
                }
            });
            
            //Handle submit
            $submit.on('click', function(){
                
                //Get the file from the input
                var file = $file[0].files[0],
                    filetype,
                    queryId,
                    queryName,
                    shouldZoom = false,
                    newAJAX;

                //TODO handle multiple files?
                if(file){
                    queryId = context.sandbox.utils.UUID();
                    queryName = file.name; //Use the file name as the query name
                    filetype = context.sandbox.utils.getFileExtension(file);
                    if (context.$('#zoomOnUpload').is(":checked")) {
                        shouldZoom = true; 
                    }
                    
                    //Create a new collection for the data
                    context.sandbox.dataStorage.datasets[queryId] = new Backbone.Collection();
                    context.sandbox.dataStorage.datasets[queryId].dataService = DATASOURCE_NAME;
                    context.sandbox.dataStorage.datasets[queryId].layerName = queryName;

                    createLayer({
                        queryId: queryId,
                        queryName: queryName,
                        selectable: true
                    });

                    mediator.addToProgressQueue();

                    mediator.publishMessage({
                        messageType: 'success',
                        messageTitle: 'Data Upload',
                        messageText: 'Data upload was started.'
                    });

                    // Try the upload
                    newAJAX = context.sandbox.upload.file({
                        queryId: queryId,
                        queryName: queryName,
                        file: file,
                        filetype: filetype
                    }, function(data){ //Success callback
                            mediator.publishMessage({
                                messageType: 'success',
                                messageTitle: 'Data Upload',
                                messageText: 'Data upload was Uploaded. Starting Import'
                            });

                            getPage({
                                queryId: queryId,
                                queryName: queryName,
                                sessionId: context.sandbox.sessionId,
                                shouldZoom: shouldZoom
                            }, 0);
                            $dummyFile.val('');
                            $submit.prop('disabled', true);
                            $zoom.prop('checked', false);
                        }, function(status, jqXHR){ //Error callback
                            markQueryError(queryId, queryName, status);
                        }
                    );

                    context.sandbox.ajax.addActiveAJAX({
                        newAJAX: newAJAX,
                        layerId: queryId
                    });

                    context.sandbox.stateManager.setLayerStateById({
                        layerId: queryId,
                        state: {
                            dataTransferState: 'running'
                        }
                    });

                    mediator.closeUploadTool();
                }
            });

            context.$('#upload-cancel').on('click', mediator.closeUploadTool); //Handle close
            mediator.closeUploadTool();
        },
        stopQuery: function(params){
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
            exposed.resetFields();
            for(queryId in context.sandbox.dataStorage.datasets){
                if(context.sandbox.dataStorage.datasets[queryId].dataService === DATASOURCE_NAME){
                    delete context.sandbox.dataStorage.datasets[queryId];
                }
            }

            context.sandbox.ajax.clear();
        },
        resetFields: function() {
            $dummyFile.val('');
            $zoom.prop('checked', false);
            $submit.prop('disabled', true);
        },
        restoreDataset: function(params){
            var queryId = params.queryId,
                queryName = params.queryName;

            if(params.dataSource !== DATASOURCE_NAME){
                return; //This is not the component to handle the restore.
            }else if(!context.sandbox.dataStorage.datasets[queryId]) {
                createLayer({
                    queryId: queryId,
                    queryName: queryName
                });

                markQueryStart(queryName);

                getPage(params, 0);
            }else{
                mediator.publishMessage({
                    messageType: 'warning',
                    messageTitle: 'Data Restore',
                    messageText: 'Dataset already loaded.'
                });
            }
        },
        show: function(){
            $modal.modal('show');
        },
        hide: function(){
            $modal.modal('hide');
        }
    };

    return exposed;

    function getPage (params, start){
        var queryId = params.queryId,
            queryName = params.queryName;

        context.sandbox.dataStorage.getResultsByQueryAndSessionId(queryId, params.sessionId, start, RESTORE_PAGE_SIZE, function(err, results){
            if(err) {
                markQueryError(queryId, queryName, err);
            } else if (!results || results.length === 0) {
                markQueryFinished(queryId, queryName);
                if(params.shouldZoom){
                    mediator.publishZoomToLayer({layerId: queryId});
                }
            } else {
                processDataPage(results, {
                    queryId: queryId,
                    queryName: queryName
                });
                getPage(params, start + RESTORE_PAGE_SIZE, RESTORE_PAGE_SIZE);
            }
        });
    }


    function removeFileError(){
        $dummyFile.parent().removeClass('has-error');
    }

    function setFileError(){
        mediator.publishMessage({
            messageType: 'warning',
            messageTitle: 'Data Upload',
            messageText: 'File type not supported for upload'
        });

        $dummyFile.parent().addClass('has-error');
    }

    function processDataPage(data, params){
        var queryId = params.queryId || data[0].properties.queryId,
            queryName = params.queryName,
            newData = [];

        mediator.publishMessage({
            messageType: 'info',
            messageTitle: 'Data Service',
            messageText: data.length+ ' events have been added to ' + queryName + ' query layer.'
        });

        context.sandbox.stateManager.setLayerStateById({
            layerId: queryId,
            state: {
                dataTransferState: 'running'
            }
        });

        //For each feature, create the minimized feature to be stored locally, with all the fields needed for datagrid
        context.sandbox.utils.each(data, function(dataIndex, dataFeature){
            var newValue;

            data[dataIndex].dataService = DATASOURCE_NAME;

            //No keys, so skip that step
            newValue = {
                dataService: DATASOURCE_NAME,
                layerId: queryId,
                id: dataFeature.properties.featureId,
                featureId: dataFeature.properties.featureId,
                geometry: dataFeature.geometry,
                type: dataFeature.type,
                properties : {},
                lat: dataFeature.geometry.coordinates[1],
                lon: dataFeature.geometry.coordinates[0]
            };

            context.sandbox.dataStorage.addData({
                datasetId: queryId,
                data: newValue
            });

            // Add style properties for map features, but not for local dataset storage
            context.sandbox.utils.each(context.sandbox.icons.getIconForFeature(dataFeature), function(styleKey, styleValue){
                newValue.properties[styleKey] = styleValue;
            });

            newData.push(newValue);
        });

        // Clear data out from memory
        data = [];

        mediator.publishData({
            layerId: queryId,
            data: newData
        });
    }


    function markQueryFinished(queryId, queryName){
        mediator.removeFromProgressQueue();

        mediator.publishMessage({
            messageType: 'success',
            messageTitle: 'Data Upload',
            messageText: queryName + ' Upload Complete'
        });

        mediator.publishFinished({layerId: queryId});
    }

    function markQueryError(queryId, queryName, error){
        mediator.removeFromProgressQueue();

        //If the error was because we aborted, ignore
        if(error === 'abort'){
            return;
        }

        mediator.publishMessage({
            messageType: 'error',
            messageTitle: 'Data Upload',
            messageText: 'Connection to upload service failed for ' + queryName
        });

        context.sandbox.stateManager.setLayerStateById({
            layerId: queryId,
            state: {
                dataTransferState: 'error'
            }
        });

        mediator.publishError({
            layerId: queryId
        });

        return false;
    }

    function createLayer(params){
        context.sandbox.dataStorage.datasets[params.queryId] = new Backbone.Collection();
        context.sandbox.dataStorage.datasets[params.queryId].dataService = DATASOURCE_NAME;
        context.sandbox.dataStorage.datasets[params.queryId].layerName = params.queryName;

        mediator.createLayer({
            layerId: params.queryId,
            name: params.queryName,
            selectable: true
        });
    }

    function markQueryStart(queryName) {
        mediator.publishMessage({
            messageType: 'success',
            messageTitle: 'Data Service',
            messageText: queryName + ' query initiated'
        });
        mediator.addToProgressQueue();
    }
});