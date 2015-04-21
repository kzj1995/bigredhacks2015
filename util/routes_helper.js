"use strict";
var helper = {};

// Make the nested fields parsed by multiparty look like req.body from body-parser
// e.g. 'metadata[foo]': ['1']            => {metadata: {foo: 1}}
//      'metadata[foo]': ['bar']          => {metadata: {foo: 'bar'}}
//      'metadata[foo][]': ['bar', 'bat'] => {metadata: {foo: ['bar', 'bat']}}
helper.reformatFields = function reformatFields(fields) {
    // convert numbers to real numbers instead of strings
    function toNumber(i) {
        return i !== '' && !isNaN(i) ? Number(i) : i;
    }

    // remove the extra array wrapper around the values
    for (var f in fields) {
        if (f === 'null') {
            delete fields[f];  // ignore null fields like submit
        } else {
            if (f.match(/\[\]$/)) {
                // if our key uses array syntax we can make qs.parse produce the intended result
                // by removing the trailing [] on the key
                var key = f.replace(/\[\]$/,'');
                fields[key] = fields[f].map(function(i) { return toNumber(i) });
                delete fields[f];
            } else {
                // for scalar values, just extract the single value
                fields[f] = toNumber(fields[f][0]);
            }
        }
    }

    return fields;
};


module.exports = helper;