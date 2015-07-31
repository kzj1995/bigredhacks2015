/*
 * Typeahead
 */
var engine = new Bloodhound({
    name: 'colleges',
    prefetch: '/api/colleges',
    datumTokenizer: function (d) {
        return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    limit: 5,
    sorter: function (a, b) {

        //case insensitive matching
        var input = $('#college').val().toLowerCase();
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        //move exact matches to top
        if (input === a) {
            return -1;
        }
        if (input === b) {
            return 1;
        }

        //move beginning matches to top
        if (a.lastIndexOf(input, 0) === 0) {
            return -1;
        }
        if (b.lastIndexOf(input, 0) === 0) {
            return 1;
        }
    }
});

engine.initialize();

$('.typeahead').typeahead({
    hint: true,
    highlight: true,
    autoselect: false,
    minLength: 3
}, {
    displayKey: 'name', // if not set, will default to 'value',
    source: engine.ttAdapter()
}).on('typeahead:selected typeahead:autocomplete', function (obj, datum, name) {
    $("#collegeid").val(datum.id);
});
