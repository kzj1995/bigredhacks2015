function pad(num, size) {
    var s = "000" + num; //assume never need more than 3 digits
    return s.substr(s.length - size);
}

(function ($) {

    new WOW().init();

    jQuery(window).load(function () {
        jQuery("#preloader").delay(100).fadeOut("slow");
        jQuery("#load").delay(100).fadeOut("slow");
    });

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
            navbar: "blue",
            by: "Robert Barker",
            with: "University Photography"
        },
        {
            navbar: "orange",
            by: "Lindsay France",
            with: "University Photography"
        },
        {
            navbar: "purple",
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


})(jQuery);
