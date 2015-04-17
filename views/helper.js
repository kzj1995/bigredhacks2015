"use strict"
var _export = {};

/**
 * String format
 * Usage: "I like {0} and {1}.format("cats","dogs")
 * Returns: "I like cats and dogs"
 */
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

/**
 * generate a list of HTML <option> items for a dropdown
 * @param arr array to generate options on
 * @param {string} options tag options to inject
 * @returns {string}
 */
_export.generateOptions = function (arr, options) {
    var array = arr.slice(); //clone the array
    options = options || "";
    var tag = '<option ' + options + ' value="{0}">{0}</option>';
    for (var i = 0; i < array.length; i++) {
        array[i] = tag.format(array[i]);
    }
    return array.join('');
};


_export.require = function(arr, options) {

};

module.exports = _export;