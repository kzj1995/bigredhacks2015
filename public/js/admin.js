$('document').ready(function () {
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

    $( ".applicantinfo" ).hover(
        function() {
            $( this ).css("background-color", "#78DEFC");
        }, function() {
            $( this ).css("background-color", "#ECFEFF");
        }
    );

    $(".decisionbuttons button").click(function () {
        var applicantboxindex = parseInt($(".decisionbuttons button").index(this) / 3);
        var decision = "";
        if($(this).index() == 0)
            decision = "Accept";
        else if($(this).index() == 1)
            decision = "Waitlist";
        else if($(this).index() == 2)
            decision = "Reject";
        var applicantid = $(".decisionbuttons #applicantid").eq(applicantboxindex).val();
        $.ajax({
            type: "POST",
            url: "/admin/updateStatus?id="+applicantid+"&decision="+decision
        });
        $(".applicantinfolist li:last-child").eq(applicantboxindex).text("Application Status: "+decision);
    });

    $("#categoryselection").change(function(){
        var category = $(this).val();
        $("#categoryinput").remove();
        if(category == "User Id"){
            $("<input id='categoryinput' class='form-control' type='text' name='userid' " +
            "placeholder='User Id' />").insertAfter("#categoryselection");
        }
        else if(category == "Email"){
            $("<input id='categoryinput' class='form-control' type='text' name='email' " +
            "placeholder='Email' />").insertAfter("#categoryselection");
        }
        else if(category == "Name"){
            $("<input id='categoryinput' class='form-control' type='text' name='name' " +
            "placeholder='Name' />").insertAfter("#categoryselection");
        }
    });

});




