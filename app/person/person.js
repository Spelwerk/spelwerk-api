var async = require('async'),
    rest = require('./../rest');

module.exports = function(router, tableName, path) {
    path = path || '/' + tableName;

    var query = 'SELECT * FROM person ' +
        'LEFT JOIN person_playable ON person_playable.person_id = person.id ' +
        'LEFT JOIN person_description ON person_description.person_id = person.id ' +
        'LEFT JOIN person_creation ON person_creation.person_id = person.id ' +
        'LEFT JOIN person_has_species ON (person_has_species.person_id = person.id AND person_has_species.first = 1)';

    // GET

    router.get(path, function(req, res, next) {
        rest.GET(req, res, next, query);
    });

    router.get(path + '/popular', function(req, res, next) {
        var call = 'SELECT id,nickname,occupation FROM person WHERE ' +
            'playable = 1 AND ' +
            'calculated = 1 AND ' +
            'deleted IS NULL';

        rest.GET(req, res, next, call);
    });

    // DEFAULT

    router.get(path + '/id/:id', function(req, res, next) {
        var call = query + ' WHERE person.id = ?';

        rest.GET(req, res, next, call, [req.params.id]);
    });

    router.get(path + '/id/:id/isOwner', function(req, res, next) {
        rest.userVerifyOwner(req, res, next, 'person', req.params.id);
    });

    router.get(path + '/id/:id/comment', function(req, res, next) {
        rest.getComments(req, res, next, 'person', req.params.id);
    });

    router.get(path + '/deleted', function(req, res, next) {
        var call = query + ' WHERE person.deleted is NOT NULL';

        rest.GET(req, res, next, call, null, {"id": "ASC"});
    });

    // PERSON

    router.post(path, function(req, res, next) {
        if(!req.user.id) return next('Forbidden.');

        var person = {},
            insert = {},
            world = {},
            species = {},
            points = {};

        insert.playable = parseInt(req.body.playable) || 1;
        insert.supernatural = parseInt(req.body.supernatural) || 0;
        insert.nickname = req.body.nickname;
        insert.age = parseInt(req.body.age);
        insert.occupation = req.body.occupation;

        species.id = parseInt(req.body.species_id);

        world.id = parseInt(req.body.world_id);

        async.series([
            function(callback) {
                async.parallel([
                    function(callback) {
                        rest.query('SELECT * FROM world WHERE id = ?', [world.id], callback);
                    },
                    function(callback) {
                        rest.query('SELECT attribute_id, value FROM world_has_attribute WHERE world_id = ?', [world.id], callback);
                    },
                    function(callback) {
                        rest.query('SELECT skill_id AS id FROM world_has_skill WHERE world_id = ?', [world.id], callback);
                    },
                    function(callback) {
                        rest.query('SELECT * FROM species WHERE id = ?', [species.id], callback);
                    },
                    function(callback) {
                        rest.query('SELECT attribute_id, value FROM species_has_attribute WHERE species_id = ?', [species.id], callback);
                    },
                    function(callback) {
                        rest.query('SELECT id FROM skill WHERE species_id = ?', [species.id], callback);
                    },
                    function(callback) {
                        rest.query('SELECT weapon_id AS id FROM species_has_weapon WHERE species_id = ?', [species.id], callback);
                    }
                ], function(err, results) {
                    world.select = results[0][0];
                    world.attribute = results[1];
                    world.skill = results[2];

                    species.select = results[3][0];
                    species.attribute = results[4];
                    species.skill = results[5];
                    species.weapon = results[6];

                    points.expertise = 1;
                    points.gift = world.select.max_gift;
                    points.imperfection = world.select.max_imperfection;
                    points.milestone = 1;
                    points.money = 1;
                    points.power = 1;
                    points.relationship = 1;
                    points.skill = 1;
                    points.doctrine = 1;
                    points.doctrine_expertise = 1;

                    var split = {},
                        max = {};

                    // Calculate split value based on person age and world settings
                    split.expertise = Math.floor(insert.age / (world.select.split_expertise * species.select.multiply_expertise));
                    split.milestone = Math.floor(insert.age / world.select.split_milestone);
                    split.relationship = Math.floor(insert.age / world.select.split_relationship);
                    split.skill = Math.floor(insert.age / (world.select.split_skill * species.select.multiply_skill));
                    split.doctrine = Math.floor(insert.age / world.select.split_doctrine);

                    max.expertise = world.select.max_expertise;
                    max.milestone = world.select.max_milestone;
                    max.relationship = world.select.max_relationship;
                    max.skill = world.select.max_skill;
                    max.doctrine = world.select.max_doctrine;

                    // If the split value is lower than maximum, and higher than 1
                    // If the split value is higher than maximum
                    if (split.expertise < max.expertise && split.expertise > 1) {
                        points.expertise = split.expertise;
                    } else if (split.expertise > max.expertise) {
                        points.expertise = max.expertise;
                    }

                    if (split.milestone < max.milestone && split.milestone > 1) {
                        points.milestone = split.milestone;
                    } else if (split.milestone > max.milestone) {
                        points.milestone = max.milestone;
                    }

                    if (split.relationship < max.relationship && split.relationship > 1) {
                        points.relationship = split.relationship;
                    } else if (split.relationship > max.relationship) {
                        points.relationship = max.relationship;
                    }

                    if (split.skill < max.skill && split.skill > 1) {
                        points.skill = split.skill;
                    } else if (split.skill > max.skill) {
                        points.skill = max.skill;
                    }

                    if (split.doctrine < max.doctrine && split.doctrine > 1) {
                        points.doctrine = split.doctrine;
                    } else if (split.doctrine > max.doctrine) {
                        points.doctrine = max.doctrine;
                    }

                    callback(err);
                });
            },
            function(callback) {
                rest.query('INSERT INTO person (playable,nickname,occupation,world_id) VALUES (?,?,?,?)', [insert.playable, insert.nickname, insert.occupation, world.id], function(err,result) {
                    person.id = result.insertId;

                    callback(err);
                });
            },
            function(callback) {
                async.parallel([
                    function(callback) {
                        rest.query('INSERT INTO person_playable (person_id, supernatural, age) VALUES (?,?,?)', [person.id, insert.supernatural, insert.age], callback);
                    },
                    function(callback) {
                        rest.query('INSERT INTO person_description (person_id) VALUES (?)', [person.id], callback);
                    },
                    function(callback) {
                        rest.query('INSERT INTO person_has_species (person_id, species_id, first) VALUES (?,?,?)', [person.id, species.id, 1], callback);
                    },
                    function(callback) {
                        rest.query('INSERT INTO person_creation (person_id,point_expertise,point_gift,point_imperfection,' +
                            'point_milestone,point_money,point_power,point_relationship,point_skill,point_doctrine) VALUES (?,?,?,?,?,?,?,?,?,?)',
                            [person.id, points.expertise, points.gift, points.imperfection, points.milestone, points.money, points.power,
                                points.relationship, points.skill, points.doctrine], callback);
                    },
                    function(callback) {
                        var call = 'INSERT INTO person_has_attribute (person_id,attribute_id,value) VALUES ';

                        // Loop through attribute list from world
                        for(var i in world.attribute) {

                            // If species has a list of attributes
                            if(species.attribute !== undefined && species.attribute[0] !== undefined) {

                                // Loop through species list of attributes
                                for(var j in species.attribute) {

                                    // If species has attribute in world list = update values and save updated status in species attribute
                                    if(world.attribute[i].attribute_id === species.attribute[j].attribute_id) {
                                        world.attribute[i].value += species.attribute[j].value;
                                        species.attribute[j].updated = true;
                                    }
                                }
                            }

                            // Add the attribute and (perhaps updated) value to the call
                            call += '(' + person.id + ',' + world.attribute[i].attribute_id + ',' + world.attribute[i].value + '),';
                        }

                        // If species has a list of attributes
                        if(species.attribute !== undefined && species.attribute[0] !== undefined) {

                            // Loop through species list of attributes
                            for (var m in species.attribute) {

                                // If species attribute was not added to world call = it is species specific attribute
                                if (species.attribute[m].updated !== true) {
                                    call += '(' + person.id + ',' + species.attribute[m].attribute_id + ',' + species.attribute[m].value + '),';
                                }
                            }
                        }

                        call = call.slice(0, -1);

                        rest.query(call, null, callback);
                    },
                    function(callback) {
                        var call = 'INSERT INTO person_has_skill (person_id,skill_id,value) VALUES ';

                        // Loop through skill list from world
                        for(var i in world.skill) {

                            // Add skill to call
                            call += '(' + person.id + ',' + world.skill[i].id + ',0),';
                        }

                        // If species has a list of skills
                        if(species.skill !== undefined && species.skill[0] !== undefined) {

                            // Loop through species list of skills
                            for (var m in species.skill) {

                                // Add skill to call
                                call += '(' + person.id + ',' + species.skill[m].id + ',0),';
                            }
                        }

                        call = call.slice(0, -1);

                        rest.query(call, null, callback);
                    },
                    function(callback) {
                        if(species.weapon[0] === undefined) return callback();

                        var call = 'INSERT INTO person_has_weapon (person_id,weapon_id,species) VALUES ';

                        // Loop through species list of weapons
                        for(var i in species.weapon) {

                            console.log(species.weapon[i]);
                            // Add weapon to call
                            call += '(' + person.id + ',' + species.weapon[i].id + ',1),';
                        }

                        call = call.slice(0, -1);

                        rest.query(call, null, callback);
                    },
                    function(callback) {
                        if(!req.user.id) callback();

                        rest.query('INSERT INTO user_has_person (user_id,person_id,owner) VALUES (?,?,1)', [req.user.id, person.id], callback);
                    }
                ],function(err) {
                    callback(err);
                });
            }
        ],function(err) {
            if(err) return next(err);

            res.status(200).send({id: person.id});
        });
    });

    router.put(path + '/id/:id', function(req, res, next) {
        var person = {},
            insert = {},
            creation = {},
            playable = {},
            description = {};

        person.id = parseInt(req.params.id);

        insert.playable = req.body.playable || null;
        insert.calculated = req.body.calculated || null;
        insert.nickname = req.body.nickname || null;
        insert.occupation = req.body.occupation || null;

        creation.point_expertise = req.body.point_expertise;
        creation.point_gift = req.body.point_gift;
        creation.point_imperfection = req.body.point_imperfection;
        creation.point_milestone = req.body.point_milestone;
        creation.point_money = req.body.point_money;
        creation.point_power = req.body.point_power;
        creation.point_relationship = req.body.point_relationship;
        creation.point_skill = req.body.point_skill;
        creation.point_doctrine = req.body.point_doctrine;

        playable.supernatural = req.body.supernatural || null;
        playable.age = req.body.age || null;

        description.firstname = req.body.firstname || null;
        description.surname = req.body.surname || null;
        description.gender = req.body.gender || null;
        description.description = req.body.description || null;
        description.personality = req.body.personality || null;
        description.appearance = req.body.appearance || null;
        description.background = req.body.background || null;
        description.drive = req.body.drive || null;
        description.pride = req.body.pride || null;
        description.problem = req.body.problem || null;
        description.shame = req.body.shame || null;
        description.picture_path = req.body.picture_path || null;

        async.series([
            function(callback) {
                rest.userAuth(req, false, 'person', req.params.id, callback);
            },
            function(callback) {
                rest.query('SELECT playable,calculated FROM person WHERE id = ?', [person.id], function(err, result) {
                    person.auth = !!result[0];
                    person.playable = !!result[0].playable;
                    person.calculated = !!result[0].calculated;

                    if(!person.auth) return callback('Forbidden');

                    callback(err);
                });
            },
            function(callback) {
                var call = 'UPDATE person SET ',
                    values_array = [],
                    query_amount = 0;

                for (var i in insert) {
                    if(insert[i] !== null) {
                        call += i + ' = ?, ';
                        values_array.push(insert[i]);
                        query_amount++;
                    }
                }

                if(query_amount === 0) return callback();

                call = call.slice(0, -2) + ', updated = CURRENT_TIMESTAMP WHERE id = ?';
                values_array.push(person.id);

                rest.query(call, values_array, callback);
            },
            function(callback) {
                if(!person.playable || person.calculated) return callback();

                var call = 'UPDATE person_creation SET ',
                    values_array = [],
                    query_amount = 0;

                for(var i in creation) {
                    if(creation[i] !== undefined) {
                        call += i + ' = ?, ';
                        values_array.push(creation[i]);
                        query_amount++;
                    }
                }

                if(query_amount === 0) return callback();

                call = call.slice(0, -2) + ' WHERE person_id = ?';
                values_array.push(person.id);

                rest.query(call, values_array, callback);
            },
            function(callback) {
                if(!person.playable) return callback();

                var call = 'UPDATE person_playable SET ',
                    values_array = [],
                    query_amount = 0;

                for (var i in playable) {
                    if(playable[i] !== null) {
                        call += i + ' = ?, ';
                        values_array.push(playable[i]);
                        query_amount++;
                    }
                }

                if(query_amount === 0) return callback();

                call = call.slice(0, -2) + ' WHERE person_id = ?';
                values_array.push(person.id);

                rest.query(call, values_array, callback);
            },
            function(callback) {
                var call = 'UPDATE person_description SET ',
                    values_array = [],
                    query_amount = 0;

                for (var i in description) {
                    if(description[i] !== null) {
                        call += i + ' = ?, ';
                        values_array.push(description[i]);
                        query_amount++;
                    }
                }

                if(query_amount === 0) return callback();

                call = call.slice(0, -2) + ' WHERE person_id = ?';
                values_array.push(person.id);

                rest.query(call, values_array, callback);
            }
        ],function(err) {
            if(err) return next(err);

            res.status(200).send();
        });
    });

    router.put(path + '/revive/:id', function(req, res, next) {
        rest.REVIVE(req, res, next, tableName, req.params.id);
    });

    router.delete(path + '/id/:id', function(req, res, next) {
        rest.DELETE(req, res, next, adminRequired, tableName, req.params.id);
    });

    // SPECIAL

    router.put(path + '/id/:id/cheat', function(req, res, next) {
        var person = {};

        person.id = parseInt(req.params.id);

        async.series([
            function(callback) {
                rest.userAuth(req, false, 'person', req.params.id, callback);
            },
            function(callback) {
                rest.query('SELECT playable,calculated FROM person WHERE id = ?', [person.id], function(err, result) {
                    person.auth = !!result[0];
                    person.playable = !!result[0];
                    person.calculated = !!result[0];

                    if(!person.auth) return callback('Forbidden');

                    callback(err);
                });
            },
            function(callback) {
                rest.query('UPDATE person SET popularity = 0 WHERE id = ?', [person.id], callback);
            },
            function(callback) {
                rest.query('UPDATE person_playable SET cheated = 1 WHERE person_id = ?', [person.id], callback);
            }
        ],function(err) {
            if(err) return next(err);

            res.status(200).send();
        });
    });

    router.put(path + '/id/:id/background', function(req, res, next) {
        var person = {},
            insert = {},
            current = {};

        person.id = parseInt(req.params.id);
        insert.id = parseInt(req.body.insert_id);

        async.series([
            function(callback) {
                rest.userAuth(req, false, 'person', req.params.id, callback);
            },
            function(callback) {
                rest.query('SELECT background_id FROM person_playable WHERE person_id = ?', [person.id], function(err, result) {
                    current.id = result[0].background_id;

                    callback(err);
                });
            },
            function(callback) {
                if(insert.id === current.id) return callback();

                rest.query('UPDATE person_playable SET background_id = ? WHERE person_id = ?', [insert.id, person.id], callback);
            },

            // ATTRIBUTE

            function(callback) {
                rest.query('SELECT attribute_id AS id, value FROM person_has_attribute WHERE person_id = ?', [person.id], function(err, result) {
                    person.attribute = result;

                    callback(err)
                });
            },
            function(callback) {
                rest.query('SELECT attribute_id AS id, value FROM background_has_attribute WHERE background_id = ?', [insert.id], function(err, result) {
                    insert.attribute = result;

                    callback(err)
                });
            },
            function(callback) {
                if(!current.id) return callback();

                rest.query('SELECT attribute_id AS id, value FROM background_has_attribute WHERE background_id = ?', [current.id], function(err, result) {
                    current.attribute = result;

                    callback(err);
                });
            },
            function(callback) {
                if(insert.id === current.id) return callback();

                rest.personInsert('INSERT INTO person_has_attribute (person_id,attribute_id,value) VALUES ', person.id, person.attribute, insert.attribute, current.attribute, callback);
            },

            // SKILL

            function(callback) {
                rest.query('SELECT skill_id AS id, value FROM person_has_skill WHERE person_id = ?', [person.id], function(err, result) {
                    person.skill = result;

                    callback(err)
                });
            },
            function(callback) {
                rest.query('SELECT skill_id AS id, value FROM background_has_skill WHERE background_id = ?', [insert.id], function(err, result) {
                    insert.skill = result;

                    callback(err)
                });
            },
            function(callback) {
                if(!current.id) return callback();

                rest.query('SELECT skill_id AS id, value FROM background_has_skill WHERE background_id = ?', [current.id], function(err, result) {
                    current.skill = result;

                    callback(err);
                });
            },
            function(callback) {
                if(insert.id === current.id) return callback();

                rest.personInsert('INSERT INTO person_has_skill (person_id,skill_id,value) VALUES ', person.id, person.skill, insert.skill, current.skill, callback);
            }
        ],function(err) {
            if(err) return next(err);

            res.status(200).send();
        });
    });

    router.put(path + '/id/:id/focus', function(req, res, next) {
        async.series([
            function(callback) {
                rest.userAuth(req, false, 'person', req.params.id, callback);
            },
            function(callback) {
                rest.query('UPDATE person_playable SET focus_id = ? WHERE person_id = ?', [req.body.insert_id, req.params.id], callback);
            }
        ],function(err) {
            if(err) return next(err);

            res.status(200).send();
        });


    });

    router.put(path + '/id/:id/identity', function(req, res, next) {
        rest.query('UPDATE person_playable SET identity_id = ? WHERE person_id = ?', [req.body.insert_id, req.params.id], function(err) {
            if(err) return next(err);

            res.status(200).send();
        });
    });

    router.put(path + '/id/:id/manifestation', function(req, res, next) {
        var person = {},
            manifestation = {},
            insert = {};

        person.id = parseInt(req.params.id);
        insert.id = parseInt(req.body.insert_id);

        async.series([
            function(callback) {
                rest.userAuth(req, false, 'person', req.params.id, callback);
            },
            function(callback) {
                rest.query('UPDATE person_playable SET manifestation_id = ? WHERE person_id = ?', [insert.id, person.id], callback);
            },
            function(callback) {
                rest.query('SELECT power_id, skill_id FROM manifestation WHERE id = ?', [insert.id], function(err, result) {
                    manifestation.power = result[0].power_id;
                    manifestation.skill = result[0].skill_id;

                    callback(err);
                });
            },
            function(callback) {
                rest.query('INSERT INTO person_has_attribute (person_id,attribute_id,value) VALUES (?,?,0) ON DUPLICATE KEY UPDATE value = VALUES(value)', [person.id, manifestation.power], callback)
            },
            function(callback) {
                rest.query('INSERT INTO person_has_skill (person_id,skill_id,value) VALUES (?,?,0) ON DUPLICATE KEY UPDATE value = VALUES(value)', [person.id, manifestation.skill], callback)
            }
        ],function(err) {
            if(err) return next(err);

            res.status(200).send();
        });
    });

    router.put(path + '/id/:id/nature', function(req, res, next) {
        rest.query('UPDATE person_playable SET nature_id = ? WHERE person_id = ?', [req.body.insert_id, req.params.id], function(err) {
            if(err) return next(err);

            res.status(200).send();
        });
    });

    // COMMENTS

    router.post(path + '/id/:id/comment', function(req, res, next) {
        rest.postComment(req, res, next, 'person', req.params.id);
    });

    // RELATIONS

    require('./person_has_attribute')(router, path);

    require('./person_has_augmentation')(router, path);

    require('./person_has_bionic')(router, path);

    require('./person_has_disease')(router, path);

    require('./person_has_doctrine')(router, path);

    require('./person_has_expertise')(router, path);

    require('./person_has_gift')(router, path);

    require('./person_has_imperfection')(router, path);

    require('./person_has_milestone')(router, path);

    require('./person_has_protection')(router, path);

    require('./person_has_sanity')(router, path);

    require('./person_has_skill')(router, path);

    require('./person_has_software')(router, path);

    require('./person_has_species')(router, path);

    require('./person_has_weapon')(router, path);

    require('./person_has_wound')(router, path);
};