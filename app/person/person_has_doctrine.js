var async = require('async'),
    rest = require('./../rest');

module.exports = function(router, path) {
    var query = 'SELECT ' +
        'doctrine.id, ' +
        'doctrine.canon, ' +
        'doctrine.popularity, ' +
        'doctrine.name, ' +
        'doctrine.description, ' +
        'doctrine.manifestation_id, ' +
        'doctrine.expertise_id, ' +
        'doctrine.icon,  ' +
        'person_has_doctrine.value ' +
        'FROM person_has_doctrine ' +
        'LEFT JOIN doctrine ON doctrine.id = person_has_doctrine.doctrine_id';

    router.get(path + '/id/:id/doctrine', function(req, res, next) {
        var call = query + ' WHERE ' +
            'person_has_doctrine.person_id = ?';

        rest.GET(req, res, next, call, [req.params.id], {"name": "ASC"});
    });

    router.post(path + '/id/:id/doctrine', function(req, res, next) {
        var person = {},
            insert = {};

        person.id = req.params.id;
        insert.id = req.body.insert_id;
        insert.value = parseInt(req.body.value);

        async.series([
            function (callback) {
                if(insert.value < 1) return callback();

                rest.userAuth(req, false, 'person', person.id, callback);
            },
            function (callback) {
                if(insert.value < 1) return callback();

                rest.query('INSERT INTO person_has_doctrine (person_id,doctrine_id,value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [person.id, insert.id, insert.value], callback);
            }
        ],function(err) {
            if(err) return next(err);

            res.status(200).send();
        });
    });

    router.put(path + '/id/:id/doctrine', function(req, res, next) {
        var person = {},
            insert = {},
            current = {};

        person.id = req.params.id;
        insert.id = parseInt(req.body.insert_id);
        insert.value = parseInt(req.body.value);

        async.series([
            function(callback) {
                rest.userAuth(req, false, 'person', req.params.id, callback);
            },
            function(callback) {
                rest.query('SELECT value FROM person_has_doctrine WHERE person_id = ? AND doctrine_id = ?', [person.id, insert.id], function(err, result) {
                    current.value = !!result[0] ? parseInt(result[0].value) : 0;

                    insert.value = insert.value + current.value;

                    callback(err);
                });
            },
            function(callback) {
                rest.query('INSERT INTO person_has_doctrine (person_id,doctrine_id,value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [person.id, insert.id, insert.value], callback);
            }
        ],function(err) {
            if(err) return next(err);

            res.status(200).send();
        });
    });
};