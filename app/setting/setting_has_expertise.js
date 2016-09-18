var rest = require('./../rest');

module.exports = function(pool, router, table, path) {
    path = path || '/' + table;

    var query = 'SELECT ' +
        'expertise.id, ' +
        'expertise.name, ' +
        'expertise.description, ' +
        'expertise.hidden, ' +
        'expertisetype.maximum, ' +
        'expertise.expertisetype_id, ' +
        'expertisetype.name AS expertisetype_name, ' +
        'expertise.species_id, ' +
        'species.name AS species_name, ' +
        'expertise.manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'expertise.skill_attribute_id, ' +
        'a1.name AS skill_attribute_name, ' +
        'expertise.give_attribute_id, ' +
        'a2.name AS give_attribute_name, ' +
        'expertise.created, ' +
        'expertise.deleted ' +
        'FROM setting_has_expertise ' +
        'LEFT JOIN expertise ON expertise.id = setting_has_expertise.expertise_id ' +
        'LEFT JOIN expertisetype ON expertisetype.id = expertise.expertisetype_id ' +
        'LEFT JOIN species ON species.id = expertise.species_id ' +
        'LEFT JOIN manifestation ON manifestation.id = expertise.manifestation_id ' +
        'LEFT JOIN attribute a1 ON a1.id = expertise.skill_attribute_id ' +
        'LEFT JOIN attribute a2 ON a2.id = expertise.give_attribute_id';

    router.get(path + '/help', function(req, res) {
        rest.HELP(pool, req, res, table);
    });

    router.get(path + '/id/:id', function(req, res) {
        var call = query + ' WHERE ' +
            'setting_has_expertise.setting_id = ? AND ' +
            'expertise.deleted is null AND ' +
            'expertise.hidden = \'0\'';

        rest.QUERY(pool, req, res, call, [req.params.id]);
    });

    router.get(path + '/id/:id1/skill/:id2/type/:id3/species/:id4/manifestation/:id5', function(req, res) {
        var call = query + ' WHERE ' +
            'setting_has_expertise.setting_id = ? AND ' +
            'expertise.skill_attribute_id = ? AND ' +
            'expertise.expertisetype_id = ? AND ' +
            '(expertise.species_id = ? OR expertise.species_id is null) AND ' +
            '(expertise.manifestation_id = ? OR expertise.manifestation_id is null) AND ' +
            'expertise.hidden = \'0\' AND ' +
            'expertise.deleted is null';

        rest.QUERY(pool, req, res, call, [req.params.id1,req.params.id2,req.params.id3,req.params.id4,req.params.id5]);
    });

    router.post(path, function(req, res) {
        rest.INSERT(pool, req, res, table, req.body);
    });

    router.delete(path + '/id/:id1/id/:id2', function(req, res) {
        var call = {
            "setting_id": req.params.id1,
            "expertise_id": req.params.id2
        };

        rest.REMOVE(pool, req, res, table, call);
    });
};