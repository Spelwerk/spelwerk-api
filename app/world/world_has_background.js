var rest = require('./../rest');

module.exports = function(router, path) {
    var query = 'SELECT * FROM world_has_background ' +
        'LEFT JOIN background ON background.id = world_has_background.background_id';

    router.get(path + '/id/:id/background', function(req, res, next) {
        var call = query + ' WHERE ' +
            'world_has_background.world_id = ? AND ' +
            'background.species_id IS NULL AND ' +
            'background.manifestation_id IS NULL AND ' +
            'background.deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id]);
    });

    router.get(path + '/id/:id/background/species/:id2', function(req, res, next) {
        var call = query + ' WHERE ' +
            'world_has_background.world_id = ? AND ' +
            '(background.species_id = ? OR background.species_id IS NULL) AND ' +
            'background.manifestation_id IS NULL AND ' +
            'background.deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id, req.params.id2]);
    });

    router.get(path + '/id/:id/background/species/:id2/manifestation/:id3', function(req, res, next) {
        var call = query + ' WHERE ' +
            'world_has_background.world_id = ? AND ' +
            '(background.species_id = ? OR background.species_id IS NULL) AND ' +
            '(background.manifestation_id = ? OR background.manifestation_id IS NULL) AND ' +
            'background.deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id, req.params.id2, req.params.id3]);
    });

    router.post(path + '/id/:id/background', function(req, res, next) {
        rest.relationPost(req, res, next, 'world', req.params.id, 'background', req.body.insert_id);
    });

    router.delete(path + '/id/:id/background/:id2', function(req, res, next) {
        rest.relationDelete(req, res, next, 'world', req.params.id, 'background', req.params.id2);
    });
};