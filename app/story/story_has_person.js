var async = require('async'),
    rest = require('./../rest');

module.exports = function(router, path) {
    path = path || '/' + table;

    var query = 'SELECT ' +
        'story_has_person.story_id, ' +
        'story_has_person.person_id, ' +
        'story_has_person.person_hash, ' +
        'person.nickname AS person_nickname, ' +
        'person.occupation AS person_occupation ' +
        'FROM story_has_person ' +
        'LEFT JOIN person ON person.id = story_has_person.person_id';

    router.get(path + '/id/:id', function(req, res, next) {
        var call = query + ' WHERE ' +
            'story_has_person.story_id = ?';

        rest.QUERY(req, res, next, call, [req.params.id], {"nickname":"ASC"});
    });

    // todo post/put/delete
};