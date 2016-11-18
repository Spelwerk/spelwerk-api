var rest = require('./../rest');

module.exports = function(pool, router, table, path) {
    path = path || '/' + table;

    var query = 'SELECT ' +
        'focus.id, ' +
        'focus.name, ' +
        'focus.description, ' +
        'focus.attribute_id, ' +
        'attribute.name AS attribute_name, ' +
        'focus.manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'focus.icon_id, ' +
        'icon.path AS icon_path, ' +
        'focus.created, ' +
        'focus.deleted ' +
        'FROM world_has_focus ' +
        'LEFT JOIN focus ON focus.id = world_has_focus.focus_id ' +
        'LEFT JOIN attribute ON attribute.id = focus.attribute_id ' +
        'LEFT JOIN manifestation ON manifestation.id = focus.manifestation_id ' +
        'LEFT JOIN icon ON icon.id = focus.icon_id';

    router.get(path + '/help', function(req, res) {
        rest.HELP(pool, req, res, table);
    });

    router.get(path + '/id/:id', function(req, res) {
        var call = query + ' WHERE ' +
            'world_has_focus.world_id = ? AND ' +
            'focus.deleted is null';

        rest.QUERY(pool, req, res, call, [req.params.id]);
    });

    router.get(path + '/id/:id1/manifestation/:id2', function(req, res) {
        var call = query + ' WHERE ' +
            'world_has_focus.world_id = ? AND ' +
            '(focus.manifestation_id = ? OR focus.manifestation_id is null) AND ' +
            'focus.deleted is null';

        rest.QUERY(pool, req, res, call, [req.params.id1, req.params.id2]);
    });

    router.post(path, function(req, res) {
        rest.INSERT(pool, req, res, table);
    });

    router.delete(path + '/id/:id1/id/:id2', function(req, res) {
        var call = {
            "world_id": req.params.id1,
            "focus_id": req.params.id2
        };

        rest.REMOVE(pool, req, res, table, call);
    });
};