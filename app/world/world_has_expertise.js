var rest = require('./../rest');

module.exports = function(pool, router, table, path) {
    path = path || '/' + table;

    var query = 'SELECT ' +
        'expertise.id, ' +
        'expertise.name, ' +
        'expertise.description, ' +
        'expertise.skill_id, ' +
        'expertise.species_id, ' +
        'expertise.manifestation_id, ' +
        'expertise.doctrine_id, ' +
        'skill.icon ' +
        'FROM world_has_expertise ' +
        'LEFT JOIN expertise ON expertise.id = world_has_expertise.expertise_id ' +
        'LEFT JOIN skill ON skill.id = expertise.skill_id';

    router.get(path + '/id/:id/expertise', function(req, res) {
        var call = query + ' WHERE ' +
            'expertise.canon = 1 AND ' +
            'world_has_expertise.world_id = ? AND ' +
            'expertise.species_id IS NULL AND ' +
            'expertise.manifestation_id IS NULL AND ' +
            'expertise.doctrine_id IS NULL AND ' +
            'expertise.deleted IS NULL';

        rest.QUERY(pool, req, res, call, [req.params.id]);
    });

    router.get(path + '/id/:id/expertise/skill/:id2', function(req, res) {
        var call = query + ' WHERE ' +
            'expertise.canon = 1 AND ' +
            'world_has_expertise.world_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            'expertise.species_id IS NULL AND ' +
            'expertise.manifestation_id IS NULL AND ' +
            'expertise.doctrine_id IS NULL AND ' +
            'expertise.deleted IS NULL';

        rest.QUERY(pool, req, res, call, [req.params.id, req.params.id2]);
    });

    router.get(path + '/id/:id/expertise/skill/:id2/species/:id3', function(req, res) {
        var call = query + ' WHERE ' +
            'expertise.canon = 1 AND ' +
            'world_has_expertise.world_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            '(expertise.species_id = ? OR expertise.species_id IS NULL) AND ' +
            'expertise.manifestation_id IS NULL AND ' +
            'expertise.doctrine_id IS NULL AND ' +
            'expertise.deleted IS NULL';

        rest.QUERY(pool, req, res, call, [req.params.id, req.params.id2, req.params.id3]);
    });

    router.get(path + '/id/:id/expertise/skill/:id2/species/:id3/manifestation/:id4', function(req, res) {
        var call = query + ' WHERE ' +
            'expertise.canon = 1 AND ' +
            'world_has_expertise.world_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            '(expertise.species_id = ? OR expertise.species_id IS NULL) AND ' +
            '(expertise.manifestation_id = ? OR expertise.manifestation_id IS NULL) AND ' +
            'expertise.deleted IS NULL';

        rest.QUERY(pool, req, res, call, [req.params.id, req.params.id2, req.params.id3, req.params.id4]);
    });

    router.post(path + '/id/:id/expertise', function(req, res) {
        rest.relationPost(pool, req, res, 'world', 'expertise');
    });

    router.delete(path + '/id/:id/expertise/:id2', function(req, res) {
        rest.relationDelete(pool, req, res, 'world', 'expertise');
    });
};