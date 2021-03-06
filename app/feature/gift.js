var rest = require('./../rest');

module.exports = function(router, tableName, path) {
    path = path || '/' + tableName

    var query = 'SELECT * FROM gift';

    require('./../default')(router, tableName, query, {admin: false, user: true});

    router.get(path, function(req, res, next) {
        var call = query + ' WHERE ' +
            'canon = 1 AND ' +
            'species_id IS NULL AND ' +
            'manifestation_id IS NULL AND ' +
            'deleted IS NULL';

        rest.GET(req, res, next, call);
    });

    router.get(path + '/manifestation/:id', function(req, res, next) {
        var call = query + ' WHERE ' +
            'canon = 1 AND ' +
            'species_id IS NULL AND ' +
            'manifestation_id = ? AND ' +
            'deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id]);
    });

    router.get(path + '/species/:id', function(req, res, next) {
        var call = query + ' WHERE ' +
            'canon = 1 AND ' +
            'species_id = ? AND ' +
            'manifestation_id IS NULL AND ' +
            'deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id]);
    });

    require('./gift_has_attribute')(router, path);

    require('./gift_has_skill')(router, path);
};