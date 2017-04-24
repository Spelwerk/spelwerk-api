var rest = require('./../rest');

module.exports = function(pool, router, table, path) {
    path = path || '/' + table;

    var query = 'SELECT ' +
        'protection.id, ' +
        'protection.canon, ' +
        'protection.name, ' +
        'protection.description, ' +
        'protection.price, ' +
        'protection.protectiontype_id, ' +
        'protectiontype.name AS protectiontype_name, ' +
        'protectiontype.attribute_id, ' +
        'attribute.name AS attribute_name,' +
        'protection.attribute_value, ' +
        'protection.bodypart_id, ' +
        'bodypart.name AS bodypart_name, ' +
        'icon.path AS icon_path ' +
        'FROM world_has_protection ' +
        'LEFT JOIN protection ON protection.id = world_has_protection.protection_id ' +
        'LEFT JOIN protectiontype ON protectiontype.id = protection.protectiontype_id ' +
        'LEFT JOIN attribute ON attribute.id = protectiontype.attribute_id ' +
        'LEFT JOIN bodypart ON bodypart.id = protection.bodypart_id ' +
        'LEFT JOIN icon ON icon.id = protection.icon_id';

    router.get(path + '/id/:id/protection', function(req, res) {
        var call = query + ' WHERE ' +
            'world_has_protection.world_id = ? AND ' +
            'protection.canon = ? AND ' +
            'protection.deleted IS NULL';

        rest.QUERY(pool, req, res, call, [req.params.id, 1]);
    });

    router.get(path + '/id/:id/protection/type/:id2', function(req, res) {
        var call = query + ' WHERE ' +
            'world_has_protection.world_id = ? AND ' +
            'protection.protectiontype_id = ? AND ' +
            'protection.canon = ? AND ' +
            'protection.deleted IS NULL';

        rest.QUERY(pool, req, res, call, [req.params.id, req.params.id2, 1]);
    });

    router.get(path + '/id/:id/protection/type/:id2/bodypart/:id3', function(req, res) {
        var call = query + ' WHERE ' +
            'world_has_protection.world_id = ? AND ' +
            'protection.protectiontype_id = ? AND ' +
            'protection.bodypart_id = ? AND ' +
            'protection.canon = ? AND ' +
            'protection.deleted IS NULL';

        rest.QUERY(pool, req, res, call, [req.params.id, req.params.id2, req.params.id3, 1]);
    });

    router.post(path + '/id/:id/protection', function(req, res) {
        rest.worldPostHas(pool, req, res, req.params.id, 'protection');
    });

    router.delete(path + '/id/:id/protection/:id2', function(req, res) {
        rest.worldDeleteHas(pool, req, res, req.params.id, req.params.id2, 'protection');
    });
};