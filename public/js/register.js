$('document').ready(function () {
    //TODO: match from start of string
    var engine = new Bloodhound({
        name: 'colleges',
        prefetch: '/api/colleges',
        datumTokenizer: function (d) {
            return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace
    });

    engine.initialize();

    $('.typeahead').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    }, {
        displayKey: 'name', // if not set, will default to 'value',
        source: engine.ttAdapter()
    }).on('typeahead:selected typeahead:autocomplete', function (obj, datum, name) {
        //TODO set hidden field
        //TODO Mark field as complete
        console.log((datum)); // contains datum value, tokens and custom fields

    });

});