var baseview = require('baseview')({url: 'http://localhost:8092', bucket: 'tweets'});
/*
 * GET twitter stream.
 */

exports.stream = function(req, res){
  res.render('stream', { title: 'Demo' });
};

/*
 * Generate stats
 */
exports.stats = function(req, res){
  baseview.view("dev_stats", "byTime", {"group" : true, "group_level" : 6}, function(err, data){
    res.render('stats', {"title": "Stats", "data": data.rows});
  })

};