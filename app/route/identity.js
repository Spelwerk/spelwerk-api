var rest = require('./../rest');

module.exports = function(pool, router, path, table) {
    var query = 'SELECT ' +
        'identity.id, ' +
        'identity.name, ' +
        'identity.description, ' +
        'identity.created, ' +
        'identity.deleted, ' +
        'attribute.id AS attribute_id, ' +
        'attribute.name AS attribute_name ' +
        'FROM identity ' +
        'LEFT JOIN attribute ON attribute.id = identity.give_attribute_id';

    router.get(path + '/help', function(req, res) {
        rest.HELP(pool, req, res, table);
    });

    router.get(path, function(req, res) {
        rest.QUERY(pool, req, res, query, null);
    });

    router.get(path + '/id/:id', function(req, res) {
        var call = query + ' WHERE identity.id = ?';
        rest.QUERY(pool, req, res, call, [req.params.id]);
    });

    router.post(path, function(req, res) {
        rest.POST(pool, req, res, table, req.body);
    });

    router.put(path, function(req, res) {
        rest.INSERT(pool, req, res, table, req.body);
    });

    router.put(path + '/id/:id', function(req, res) {
        rest.PUT(pool, req, res, table, req.body, 'id');
    });

    router.delete(path + '/id/:id', function(req, res) {
        rest.DELETE(pool, req, res, table, 'id');
    });
};