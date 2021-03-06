var rest = require('./../rest');

module.exports = function(router, path) {
    var query = 'SELECT story.id FROM user_has_story ' +
        'LEFT JOIN story ON story.id = user_has_story.story_id';

    router.get(path + '/id/:id/story', function(req, res, next) {
        var call = query + ' WHERE ' +
            'user_has_story.user_id = ? AND ' +
            'story.deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id]);
    });

    router.get(path + '/id/:id/story/:id2', function(req, res, next) {
        var call = query + ' WHERE ' +
            'user_has_story.user_id = ? AND ' +
            'user_has_story.story_id = ? AND ' +
            'story.deleted IS NULL';

        rest.GET(req, res, next, call, [req.params.id]);
    });

    router.post(path + '/id/:id/story', function(req, res, next) {
        rest.userRelationPost(req, res, next, req.params.id, 'story', req.params.insert_id);
    });

    router.delete(path + '/id/:id/story/:id2', function(req, res, next) {
        rest.userRelationDelete(req, res, next, req.params.id, 'story', req.params.id2);
    });
};