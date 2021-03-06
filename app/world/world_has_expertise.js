var rest = require('./../rest');

module.exports = function(router, path) {
    var query = 'SELECT ' +
        'expertise.id, ' +
        'expertise.canon, ' +
        'expertise.popularity, ' +
        'expertise.name, ' +
        'expertise.description, ' +
        'expertise.skill_id, ' +
        'expertise.species_id, ' +
        'expertise.manifestation_id, ' +
        'skill.icon ' +
        'FROM world_has_expertise ' +
        'LEFT JOIN expertise ON expertise.id = world_has_expertise.expertise_id ' +
        'LEFT JOIN skill ON skill.id = expertise.skill_id';

    router.get(path + '/id/:id/expertise', function(req, res, next) {
        var call = query + ' WHERE ' +
            'world_has_expertise.world_id = ? AND ' +
            'expertise.species_id IS NULL AND ' +
            'expertise.manifestation_id IS NULL AND ' +
            'expertise.deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id]);
    });

    // world creation
    router.get(path + '/id/:id/expertise/skill/:id2', function(req, res, next) {
        var call = query + ' WHERE ' +
            'world_has_expertise.world_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            'expertise.species_id IS NULL AND ' +
            'expertise.manifestation_id IS NULL AND ' +
            'expertise.deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id, req.params.id2]);
    });

    // world creation
    router.get(path + '/id/:id/expertise/manifestation/:id2', function(req, res, next) {
        var call = query + ' WHERE ' +
            'world_has_expertise.world_id = ? AND ' +
            'expertise.species_id IS NULL AND ' +
            'expertise.manifestation_id = ? AND ' +
            'expertise.deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id, req.params.id2]);
    });

    // person creation
    router.get(path + '/id/:id/expertise/skill/:id2/species/:id3', function(req, res, next) {
        var call = query + ' WHERE ' +
            'world_has_expertise.world_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            '(expertise.species_id = ? OR expertise.species_id IS NULL) AND ' +
            'expertise.manifestation_id IS NULL AND ' +
            'expertise.deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id, req.params.id2, req.params.id3]);
    });

    // person creation
    router.get(path + '/id/:id/expertise/skill/:id2/species/:id3/manifestation/:id4', function(req, res, next) {
        var call = query + ' WHERE ' +
            'world_has_expertise.world_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            '(expertise.species_id = ? OR expertise.species_id IS NULL) AND ' +
            '(expertise.manifestation_id = ? OR expertise.manifestation_id IS NULL) AND ' +
            'expertise.deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id, req.params.id2, req.params.id3, req.params.id4]);
    });

    router.post(path + '/id/:id/expertise', function(req, res, next) {
        rest.relationPost(req, res, next, 'world', req.params.id, 'expertise', req.body.insert_id);
    });

    router.delete(path + '/id/:id/expertise/:id2', function(req, res, next) {
        rest.relationDelete(req, res, next, 'world', req.params.id, 'expertise', req.params.id2);
    });
};