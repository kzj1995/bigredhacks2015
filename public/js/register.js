$('document').ready(function () {
    //TODO: improve sorting when lots of similar matches found
    var engine = new Bloodhound({
        name: 'colleges',
        prefetch: '/api/colleges',
        datumTokenizer: function (d) {
            return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: 5,
        sorter: function (a, b) {

            //get input text
            var InputString = $('#college').val();
            //move exact matches to top
            if (InputString == a.name) {
                return -1;
            }
            if (InputString == b.name) {
                return 1;
            }

            //close match without case matching
            if (InputString.toLowerCase() == a.name.toLowerCase()) {
                return -1;
            }
            if (InputString.toLowerCase() == b.name.toLowerCase()) {
                return 1;
            }

            if ((InputString != a.name) && (InputString != b.name)) {

                if (a.name < b.name) {
                    return -1;
                }
                else if (a.name > b.name) {
                    return 1;
                }
                else return 0;
            }
        }
    });

    engine.initialize();

    $('.typeahead').typeahead({
        hint: true,
        highlight: true,
        autoselect: false,
        minLength: 1
    }, {
        displayKey: 'name', // if not set, will default to 'value',
        source: engine.ttAdapter()
    }).on('typeahead:selected typeahead:autocomplete', function (obj, datum, name) {
        $("#collegeid").val(datum.id);

    });

});