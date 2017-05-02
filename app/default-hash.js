var rest = require('./rest'),
    hasher = require('./hasher');

module.exports = function(pool, router, table, path, query) {
    path = path || '/' + table;

    query = query || 'SELECT * FROM ' + table;

    router.get(path + '/help', function(req, res) {
        rest.HELP(pool, req, res, table);
    });

    router.get(path + '/deleted', function(req, res) {
        var call = query + ' WHERE ' + table + '.deleted is NOT NULL';

        rest.QUERY(pool, req, res, call, null, {"id": "ASC"});
    });

    router.get(path + '/all', function(req, res) {
        rest.QUERY(pool, req, res, query, null, {"id": "ASC"});
    });

    router.put(path + '/revive/:id', function(req, res) {
        rest.OLD_REVIVE(pool, req, res, table);
    });

    router.post(path, function(req, res) {
        req.body.hash = hasher(24);
        rest.OLD_INSERT(pool, req, res, table);
    });

    router.put(path + '/id/:id', function(req, res) {
        if (req.body.hash) {
            res.status(403).send({header: 'HASH error', message: 'HASH cannot be changed'})
        } else {
            rest.OLD_PUT(pool, req, res, table);
        }
    });

    router.put(path + '/hash/:id', function(req, res) {
        if (req.body.hash) {
            res.status(403).send({header: 'HASH error', message: 'HASH cannot be changed'})
        } else {
            rest.OLD_PUT(pool, req, res, table, {hash: req.params.id});
        }
    });

    router.delete(path + '/hash/:id', function(req, res) {
        rest.OLD_DELETE(pool, req, res, table, {hash: req.params.id});
    });
};