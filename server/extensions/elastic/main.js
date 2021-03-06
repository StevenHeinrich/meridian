var query = require('./query'),
    save = require('./save'),
    mapping = require('./mapping'),
    client = require('./client'),
    stream = require('./stream'),
    purge = require('./purge'),
    metadata = require('./metadata'),

    uuid = require('node-uuid');

exports.init = function(context){

    var app = context.app;

    context.sandbox.elastic = {
        query: query,
        save: save,
        mapping: mapping,
        client: client,
        stream: stream,
        purge: purge,
        metadata: metadata,
        refresh: client.refresh
    };

    // Init sub-modules as necessary
    context.sandbox.elastic.client.init(context);
    context.sandbox.elastic.mapping.init(context);
    context.sandbox.elastic.query.init(context);
    context.sandbox.elastic.save.init(context);
    context.sandbox.elastic.stream.init(context);
    context.sandbox.elastic.purge.init(context);

    var auth = context.sandbox.auth;

    // See public/test.html for examples
    app.get('/feature', auth.verifyUser, auth.verifySessionHeaders, function(req, res){
        var userName = res.get('Parsed-User'),
            sessionId = res.get('Parsed-SessionId');
        query.executeQuery(userName, sessionId, JSON.parse(req.query.q), function(err, response){
            if (err){
                res.status(500);
                res.send(err);
            } else {
                res.status(200);
                res.send(response.hits.hits.map(function(ele){return ele._source;}));
            }
        });
    });

    app.get('/feature/:id', auth.verifyUser, function(req, res){
        var userName = res.get('Parsed-User');
        query.getByFeatureId(userName, null, req.params.id, function(err, response){
            if (err){
                res.status(500);
                res.send(err);
            } else {
                res.header('Content-Type', 'application/json');
                res.header('Content-Disposition', 'attachment; filename=results.geojson');
                res.status(200);
                res.send(response._source);
            }
        });
    });

    app.get('/feature/query/:queryId', auth.verifyUser, auth.verifySessionHeaders, function(req, res){
        var userName = res.get('Parsed-User'),
            sessionId = res.get('Parsed-SessionId'),
            queryId = req.params.queryId;

        query.getResultsByQueryId(userName, sessionId, queryId, function(err, results){
            if (err){
                res.status(500);
                res.send(err);
            } else {
                res.status(200);
                res.send(results);
            }
        });
    });

    app.get('/feature/query/:queryId/session/:sessionId', auth.verifyUser, function(req, res){
        var userName = res.get('Parsed-User'),
            sessionId = req.params.sessionId,
            queryId = req.params.queryId;

        query.getResultsByQueryId(userName, sessionId, queryId,
            req.query.start, req.query.size, function(err, results){
            if (err){
                res.status(500);
                res.send(err);
            } else {
                res.status(200);
                res.send(results.hits.hits.map(function(ele){return ele._source;}));
            }
        });
    });


    /**
     * Must be formatted as GeoJSON
     *
     * For example:
     * {queryId: 'foo', type: 'mockdata', data: {
     *  type: "Feature",
     *  geometry: {
     *      type: "Point",
     *      coordinates: [102.0, 0.5]
     *  },
     *  properties: {
     *      key1: 'value1'
     *      key2: true
     *  }
     * }
     * }
     *
     * Note: featureIds will be generated internally
     *
     * TODO: Allow the user to pass in a queryId
     */
    app.post('/feature', auth.verifyUser, auth.verifySessionHeaders, function(req, res){
        var geoJSON = req.body.data,
            userName = res.get('Parsed-User'),
            sessionId = res.get('Parsed-SessionId'),
            queryId = req.body.queryId || uuid.v4();
        save.writeGeoJSON(
            userName,
            sessionId,
            queryId,
            req.body.type || 'UNKNOWN',
            geoJSON,
            function(err, results){
                if (err){
                    res.status(500);
                    res.send(err);
                } else {
                    res.status(200);
                    res.send(geoJSON);
                }
            }
        );
    });

    app.get('/clear', auth.verifyUser, auth.verifySessionHeaders, function(req, res){
       purge.deleteRecordsForUserSessionId(res.get('Parsed-User'), res.get('Parsed-SessionId'), function(err, results){
           res.status(err ? 500 : 200);
           res.send(err ? err : results);
       });
    });


    /**
     * Delete the query metadata and features.
     * NOTE: This is a GET because DELETE expects an immediate return.
     *      We want to confirm the delete, so that isn't an option.
     */
    app.get('/clear/:queryId/:sessionId', auth.verifyUser, function(req, res){
        purge.deleteMetadataByQueryId(
            req.params.queryId, 
            function(err, results){
                if(err) {
                    res.status(500).send(err);
                } else {
                    purge.deleteRecordsByQueryId(
                        res.get('Parsed-User'), 
                        req.params.sessionId,
                        req.params.queryId, 
                        function(err, results){
                            res.status(err ? 500 : 200);
                            res.send(err ? err : results);
                        }
                    );
                }
            }
        );
       
    });
    // meta / terms
    app.get('/metadata/term', auth.verifyUser, function(req, res){
        metadata.getMetadataByTerm(req.query, function(err, results){
            res.status(err ? 500 : 200);
            res.send(err ? err : results);
        });
    });


    app.get('/metadata/user', auth.verifyUser, function(req, res){
        metadata.getMetadataByUserId(res.get('Parsed-User'), function(err, results){
            res.status(err ? 500 : 200);
            res.send(err ? err : results);
        });
    });

    app.get('/metadata/session', auth.verifyUser, auth.verifySessionHeaders, function(req, res){
        metadata.getMetadataBySessionId(res.get('Parsed-User'), res.get('Parsed-SessionId'), function(err, results){
            res.status(err ? 500 : 200);
            res.send(err ? err : results);
        });
    });

    app.get('/metadata/query/:id', auth.verifyUser, function(req, res){
        metadata.getMetadataByQueryId(res.get('Parsed-User'), req.params.id, function(err, results){
            res.status(err ? 500 : 200);
            res.send(err ? err : results);
        });
    });
};