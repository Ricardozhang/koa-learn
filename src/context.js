let proto = {}; // proto同源码定义的变量名


function defineGetter(prop, name) {
    proto.__defineGetter__(name, function() {
        return this[prop][name];
    })
}

function defineSetter(prop, name) {
    proto.__defineSetter__(name, function(value) {
        this[prop][name] = value;
    })
}

defineGetter('request', 'url');
defineGetter('request', 'path');

defineGetter('response', 'body');
defineSetter('response', 'body');

module.exports = proto;