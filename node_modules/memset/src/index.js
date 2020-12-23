var db = require('./storage');
var Memset = require('./memset');

db.Memset = Memset;

db.create = function (key, data) {
    var set = {};
    set[key] = new Memset(data);
    db.init(set);
};

module.exports = db;
