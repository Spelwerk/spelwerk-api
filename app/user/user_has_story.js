var rest = require('./../rest');

module.exports = function(router, path) {
    var query = 'SELECT ' +
        'user_has_story.user_id, ' +
        'user_has_story.story_id, ' +
        'user_has_story.owner, ' +
        'user_has_story.secret, ' +
        'story.name AS story_name, ' +
        'world.name AS world_name ' +
        'FROM user_has_story ' +
        'LEFT JOIN story ON story.id = user_has_story.story_id ' +
        'LEFT JOIN world ON world.id = story.world_id';

    router.get(path + '/id/:id/story', function(req, res, next) {
        var call = query + ' WHERE ' +
            'user_has_story.user_id = ? AND ' +
            'story.deleted IS NULL';

        rest.QUERY(req, res, next, call, [req.params.id]);
    });

    router.post(path + '/id/:id/story', function(req, res, next) {
        req.relation.name = 'story';

        rest.userRelationPost(req, res, next);
    });

    router.delete(path + '/id/:id/story/:id2', function(req, res, next) {
        req.relation.name = 'story';

        rest.userRelationDelete(req, res, next);
    });
};