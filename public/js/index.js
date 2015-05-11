/**
 * pad a number with leading 0's
 * @param num
 * @param size
 * @returns {string}
 */
function pad(num, size) {
    var s = "000" + num; //assume never need more than 3 digits
    return s.substr(s.length - size);
}

(function ($) {

    //jQuery to collapse the navbar on scroll
    $(window).scroll(function () {
        if ($(".navbar").offset().top > 50) {
            $(".navbar-fixed-top").addClass("top-nav-collapse");
        } else {
            $(".navbar-fixed-top").removeClass("top-nav-collapse");
        }
    });

    //jQuery for page scrolling feature - requires jQuery Easing plugin
    $(function () {
        $('.navbar-nav li a').bind('click', function (event) {
            var $anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $($anchor.attr('href')).offset().top
            }, 1000, 'easeInOutExpo');
            event.preventDefault();
        });
        $('.page-scroll a').bind('click', function (event) {
            var $anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $($anchor.attr('href')).offset().top
            }, 1000, 'easeInOutExpo');
            event.preventDefault();
        });
    });

    //properties correspond to indexed background images in /img/bgd
    var images = [
        {
            navbar: "orange",
            by: "Lindsay France",
            with: "University Photography"
        },
        {
            navbar: "blue",
            by: "Robert Barker",
            with: "University Photography"
        },
        {
            navbar: "purple",
            by: "Jason Koski",
            with: "University Photography"
        }
    ];

    var numImages = images.length;
    var index = Math.floor(Math.random() * numImages);
    var image = images[index];
    $('.intro').css({'background': 'url("/img/bgd/cornell_' + pad(index, 3) + '.jpg") no-repeat center center scroll',
    'background-size': 'cover'});
    $('.nav.navbar-nav').addClass(image.navbar);
    $('#cover-photo-attribution').html("Cover photo by " + image.by+"/"+image.with+"<br/>");

    //registration modal stuff
    var footer, title;
    $("#regCornell").on("click", function(e) {
        e.preventDefault();
        footer = $("#regModal .modal-footer").html();
        $("#regModal .modal-footer .reg-select").addClass("hidden");
        title = $("#regModal .modal-title").text();
        $("#regModal .modal-title").text("Cornell/Ithaca Registration");
        $("#regModal .modal-body").removeClass("hidden");
        $("#cornell-submit").removeClass("hidden");
    });

    $('#regModal').on('hidden.bs.modal', function (e) {
        $("#regModal .modal-footer .reg-select").removeClass("hidden");
        $("#regModal .modal-title").text(title);
        $("#regModal .modal-body").addClass("hidden");
        $("#cornell-submit").addClass("hidden");
    });


    /**
     * validator
     */

    $.validator.addMethod("cornellEmail", function (val, elem, params) {
        return /^[^@]+@cornell\.edu$/i.test(val) || val === "";
    }, 'Please enter a cornell.edu');

    $('#subscribeEmail').validate({
        onfocusout: function (e, event) {
            this.element(e); //validate field immediately
        },
        onkeyup: false,
        rules: {
            cornellEmail: {
                required: true,
                email: true,
                cornellEmail: true
            }
        }
    })

})(jQuery);
