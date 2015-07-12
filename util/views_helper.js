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
 * @param {object}  options
 *                  options.selected: string corresponding to default value
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
 * generate a list of inline HTML radio inputs w/ a bootstrap wrapper
 * @param arr array to generate options on
 * @param {object} options
 *                  options.checked: string corresponding to default value
 *                  options.name: "name" of radio button set
 *                  options.label: label of radio button set
 * @returns {string}
 */
_export.generateInlineRadio = function(arr, options) {
    var array = arr.slice(); //clone the array
    options = options || {};
    options.checked = options.checked || ""; //value of checked item
    options.name = options.name || ""; //name of inputs
    options.label = options.label || arr; //text to display next to inputs, defaults to array

    for (var i = 0; i < array.length; i++) {
        var itemOpenWrapper = '<label class="radio-inline">';
        var itemCloseWrapper = '</label>';
        var params = "";
        if (options.checked === array[i] + "") {
            params += 'checked="checked" '
        }
        if (options.name.length > 0) {
            params += 'name=' + options.name;
        }
        var tag = '<input type="radio" ' + params + ' value="{0}">{1}</option>';
        array[i] = itemOpenWrapper + tag.format(array[i],options.label[i]) + itemCloseWrapper;
    }
    return array.join('');
};

/**
 * generate <li><a href={url}>{name}</a></li>
 * Used to generate the sidebars
 * @param listItems array of {name,url}
 * @param active url of active item
 */
_export.generateUrlList = function (listItems, active) {
    var array = [];
    active = url.split(/[?#]/)[0];; //remove query string, hash
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