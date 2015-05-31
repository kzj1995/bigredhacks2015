"use strict";
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
 * @param {object}  options - valid options are selected (string of default value)
 * @returns {string}
 */
_export.generateOptions = function (arr, options) {
    var array = arr.slice(); //clone the array
    options = options || {};
    options.selected = options.selected || "";

    for (var i = 0; i < array.length; i++) {
        var params = "";
        if (options.selected === array[i] + "") {
            params += 'selected="selected" '
        }
        var tag = '<option ' + params + ' value="{0}">{0}</option>';
        array[i] = tag.format(array[i]);
    }
    return array.join('');
};

/**
 * generate <li><a href={url}>{name}</a></li>
 * @param listItems array of {name,url}
 * @param active url of active item
 */
_export.generateUrlList = function (listItems, active) {
    var array = [];
    for (var i = 0; i < listItems.length; i++) {
        var classes = "";
        if (active == listItems[i].url) {
            classes += "active";
        }
        array[i] = '<li><a href="{0}" class="{1}">{2}</a></li>'.format(listItems[i].url,classes,listItems[i].name);
    }
    return array.join('');
};

_export.require = function (arr, options) {

};

module.exports = _export;