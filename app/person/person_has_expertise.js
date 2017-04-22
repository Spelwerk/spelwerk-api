var mysql = require('mysql'),
    async = require('async'),
    logger = require('./../logger'),
    rest = require('./../rest'),
    hasher = require('./../hasher');

module.exports = function(pool, router, table, path) {
    path = path || '/' + table;

    var query = 'SELECT ' +
        'expertise.id, ' +
        'expertise.canon, ' +
        'expertise.special, ' +
        'expertise.name, ' +
        'expertise.description, ' +
        'person_has_expertise.expertise_custom, ' +
        'person_has_expertise.level, ' +
        'expertise.expertisetype_id, ' +
        'expertisetype.name AS expertisetype_name, ' +
        'expertisetype.maximum, ' +
        'expertisetype.skill_attribute_required, ' +
        'expertisetype.skill_attribute_increment, ' +
        'expertisetype.startsat, ' +
        'person_has_attribute.value AS skill_attribute_value, ' +
        'expertise.species_id, ' +
        'expertise.manifestation_id, ' +
        'expertise.skill_attribute_id, ' +
        'a1.name AS skill_attribute_name, ' +
        'expertise.give_attribute_id, ' +
        'a2.name AS give_attribute_name, ' +
        'icon.path AS icon_path ' +
        'FROM person_has_expertise ' +
        'LEFT JOIN expertise ON expertise.id = person_has_expertise.expertise_id ' +
        'LEFT JOIN expertisetype ON expertisetype.id = expertise.expertisetype_id ' +
        'LEFT JOIN attribute a1 ON a1.id = expertise.skill_attribute_id ' +
        'LEFT JOIN attribute a2 ON a2.id = expertise.give_attribute_id ' +
        'LEFT JOIN person_has_attribute ON person_has_attribute.person_id = ? AND person_has_attribute.attribute_id = expertise.skill_attribute_id ' +
        'LEFT JOIN icon ON icon.id = a1.icon_id';

    router.get(path + '/id/:id/expertise', function(req, res) {
        var call = query + ' WHERE ' +
            'person_has_expertise.person_id = ?';

        rest.QUERY(pool, req, res, call, [req.params.id, req.params.id]); // Using ? ON id IN LEFT JOIN
    });

    router.get(path + '/id/:id/expertise/id/:id2', function(req, res) {
        var call = query + ' WHERE ' +
            'person_has_expertise.person_id = ? AND ' +
            'person_has_expertise.expertise_id = ?';

        rest.QUERY(pool, req, res, call, [req.params.id, req.params.id, req.params.id2]); // Using ? ON id1 IN LEFT JOIN
    });

    router.get(path + '/id/:id/expertise/type/:id2', function(req, res) {
        var call = query + ' WHERE ' +
            'person_has_expertise.person_id = ? AND ' +
            'expertise.expertisetype_id = ?';

        rest.QUERY(pool, req, res, call, [req.params.id, req.params.id, req.params.id2]); // Using ? ON id1 IN LEFT JOIN
    });

    router.post(path + '/id/:id/expertise', function(req, res) {
        var person = {},
            insert = {},
            current = {};

        person.id = req.params.id;
        person.secret = req.body.secret;

        insert.id = req.body.expertise_id;
        insert.lvl = req.body.level;

        async.waterfall([
            function(callback) {
                async.parallel([
                    function(callback) {
                        pool.query(mysql.format('SELECT secret FROM person WHERE id = ? AND secret = ?',[person.id,person.secret]),callback);
                    },
                    function(callback) {
                        pool.query(mysql.format('SELECT attribute_id, value FROM person_has_attribute WHERE person_id = ?',[person.id]),callback);
                    },
                    function(callback) {
                        pool.query(mysql.format('SELECT give_attribute_id AS attribute_id FROM expertise WHERE id = ?',[insert.id]),callback);
                    },
                    function(callback) {
                        var call = 'SELECT ' +
                            'expertisetype.maximum ' +
                            'FROM expertise ' +
                            'LEFT JOIN expertisetype ON expertisetype.id = expertise.expertisetype_id ' +
                            'WHERE expertise.id = ?';

                        pool.query(mysql.format(call,[insert.id]),callback);
                    },
                    function(callback) {
                        pool.query(mysql.format('SELECT level FROM person_has_expertise WHERE person_id = ? AND expertise_id = ?',[person.id,insert.id]),callback);
                    }
                ],function(err,results) {
                    person.auth = !!results[0][0][0];
                    person.atr = results[1][0];
                    insert.atr = results[2][0];
                    insert.max = results[3][0][0].maximum;

                    current.lvl = results[4][0][0] !== undefined
                        ? results[2][0][0].level
                        : 0;

                    callback(err,person,insert,current);
                });
            },
            function(person,insert,current,callback) {
                if(person.auth) {
                    async.parallel([
                        function(callback) {
                            if(insert.lvl <= insert.max && insert.lvl > 0 && insert.lvl > current.lvl) {
                                pool.query(mysql.format('INSERT INTO person_has_expertise (person_id,expertise_id,level) VALUES (?,?,?) ON DUPLICATE KEY UPDATE level = VALUES(level)',[person.id,insert.id,insert.lvl]),callback);
                            } else { callback(); }
                        },
                        function(callback) {
                            if(insert.atr[0].attribute_id !== null && insert.lvl <= insert.max && insert.lvl > current.lvl) {
                                var call = 'INSERT INTO person_has_attribute (person_id,attribute_id,value) VALUES ';

                                insert.atr[0].value = insert.lvl - current.lvl;

                                for(var i in person.atr) {
                                    for(var j in insert.atr) {
                                        if(person.atr[i].attribute_id === insert.atr[j].attribute_id) {
                                            person.atr[i].value += insert.atr[j].value;
                                            person.atr[i].changed = true;
                                            insert.atr[j].updated = true;
                                        }
                                    }

                                    if(person.atr[i].changed === true) {
                                        call += '(' + person.id + ',' + person.atr[i].attribute_id + ',' + person.atr[i].value + '),';
                                    }
                                }

                                for(var m in insert.atr) {
                                    if(insert.atr[m].updated !== true) {
                                        call += '(' + person.id + ',' + insert.atr[m].attribute_id + ',' + insert.atr[m].value + '),';
                                    }
                                }

                                call = call.slice(0, -1);

                                call += ' ON DUPLICATE KEY UPDATE value = VALUES(value)';

                                pool.query(call,callback);
                            } else { callback(); }
                        }
                    ],function(err) {
                        callback(err);
                    });
                } else { callback('wrong secret'); }
            }
        ],function(err) {
            if(err) {
                res.status(500).send({header: 'Internal SQL Error', message: err, code: err.code});
            } else {
                res.status(200).send();
            }
        });
    });

    router.put(path + '/id/:id/expertise/:id2', function(req, res) {
        rest.personCustomDescription(req, res, 'expertise');
    });
};