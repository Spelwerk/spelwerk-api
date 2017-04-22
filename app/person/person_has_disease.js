var mysql = require('mysql'),
    async = require('async'),
    logger = require('./../logger'),
    rest = require('./../rest'),
    hasher = require('./../hasher');

module.exports = function(pool, router, table, path) {
    path = path || '/' + table;

    var query = 'SELECT ' +
        'disease.id, ' +
        'disease.canon, ' +
        'disease.name, ' +
        'person_has_disease.heal, ' +
        'person_has_disease.timestwo ' +
        'FROM person_has_disease ' +
        'LEFT JOIN disease ON disease.id = person_has_disease.disease_id';

    router.get(path + '/id/:id/disease', function(req, res) {
        var call = query + ' WHERE ' +
            'person_id = ?';

        rest.QUERY(pool, req, res, call, [req.params.id], {"heal": "ASC", "name": "ASC"});
    });

    router.post(path + '/id/:id/disease', function(req, res) {
        var person = {},
            insert = {};

        person.id = req.params.id;
        person.secret = req.body.secret;

        insert.name = req.body.name;
        insert.timestwo = req.body.timestwo;

        pool.query(mysql.format('INSERT INTO disease (name) VALUES (?)',[insert.name]),function(err,result) {
            if(err) {
                res.status(500).send({header: 'Internal SQL Error', message: err, code: err.code});
            } else {
                insert.id = result.insertId;

                pool.query(mysql.format('INSERT INTO person_has_disease (person_id,disease_id,timestwo) VALUES (?,?,?)',[person.id,insert.id,insert.timestwo]),function(err) {
                    if (err) {
                        res.status(500).send({header: 'Internal SQL Error', message: err, code: err.code});
                    } else {
                        res.status(200).send();
                    }
                });
            }
        });
    });

    router.put(path + '/id/:id/disease/:id2/heal/:heal', function(req, res) {
        var person = {},
            insert = {};

        person.id = req.params.id;
        person.secret = req.body.secret;

        insert.id = req.params.id2;
        insert.heal = req.params.heal;

        pool.query(mysql.format('UPDATE person_has_disease SET heal = ? WHERE person_id = ? AND disease_id = ?',[insert.heal,person.id,insert.id]),function(err) {
            if (err) {
                res.status(500).send({header: 'Internal SQL Error', message: err, code: err.code});
            } else {
                res.status(200).send();
            }
        });
    });
};