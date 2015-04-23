"use strict";
var helper = {};
var qs = require('qs');

// Make the nested fields parsed by multiparty look like req.body from body-parser
// e.g. 'metadata[foo]': ['1']            => {metadata: {foo: 1}}
//      'metadata[foo]': ['bar']          => {metadata: {foo: 'bar'}}
//      'metadata[foo][]': ['bar', 'bat'] => {metadata: {foo: ['bar', 'bat']}}
helper.reformatFields = function reformatFields(fields, castNumber) {
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

                if (castNumber) {
                    fields[key] = fields[f].map(function (i) {
                        return toNumber(i)
                    });

                }
                else fields[key] = fields[f];
                delete fields[f];
            } else {
                // for scalar values, just extract the single value
                if (castNumber)
                    fields[f] = toNumber(fields[f][0]);
                else fields[f] = fields[f][0];
            }
        }
    }

    return qs.parse(fields);
};


module.exports = helper;