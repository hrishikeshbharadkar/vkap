/**
 * memsetSpec.js
 */

var db = require('../src');

var data = [];

for (var i = 0; i < 15; i++) {
    data.push({
        name: 'user' + i,
        age: i + 20,
        mod: i % 5
    });
}

db.create('user', data);

describe('jasmine-node', function () {
    var item = db.user.find({age: 21});
    var items = db.user.find([{mod: 3}]);
    var all = db.user.find({name: true});
    var parts = db.user.find(3, 5);

    it('test find memset', function () {
        expect(item.length).toBe(1);
        expect(items.length).toBeGreaterThan(2);
        expect(all.length).toBe(15);
        expect(parts.length).toBe(5);
    });

    db.user.remove({mod: 3});
    
    it('test remove memset', function () {
        expect(db.user.length).toBeLessThan(13);
    });

});