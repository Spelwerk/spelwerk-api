var rest = require('./../rest');

module.exports = function(pool, router, table, path) {
    path = path || '/' + table;

    var query = 'SELECT ' +
        'user_has_person.user_id, ' +
        'user_has_person.person_id, ' +
        'user_has_person.hash AS person_hash, ' +
        'person.nickname AS person_nickname, ' +
        'person.firstname AS person_firstname, ' +
        'person.surname AS person_surname, ' +
        'person.created, ' +
        'person.deleted ' +
        'FROM user_has_person ' +
        'LEFT JOIN person ON person.id = user_has_person.person_id';

    router.get(path + '/id/:id', function(req, res) {
        var call = query + ' WHERE ' +
            'user_has_person.user_id = ? AND ' +
            'person.deleted is null';

        rest.QUERY(pool, req, res, call, [req.params.id]);
    });

    router.post(path, function(req, res) {
        rest.INSERT(pool, req, res, table);
    });

    router.delete(path + '/id/:id1/id/:id2', function(req, res) {
        var json = {
            "user_id": req.params.id1,
            "person_id": req.params.id2
        };

        rest.REMOVE(pool, req, res, table, json);
    });
};