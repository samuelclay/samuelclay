
// ===================
// = Demo Controller =
// ===================

var Demo = function() {
    
    this.$slides = $('.RP-slides');
    this.$slide = $('.RP-slide', this.$slides).eq(0);
    
};

Demo.prototype = {

    init: function() {
        var self = this;
        var $slides = this.$slides;
        var $slide = this.$slide;
        
        $('body').bind('click', $.rescope(this.handle_click, this));
        
        $('.RP-slide', $slides).width($('.RP-module').width());
        $('.RP-module').height($slides.height());
        this.prepare_slide($slide);
        this.run_code();
    },
    
    prepare_slide: function($slide) {
        var $canvas = $('.canvas', $slide);
        
        if (!$slide.data('paper') && $canvas.length) {
            var paper = Raphael($canvas[0], 10000, 480);
            $slide.data('paper', paper);
        } else {
        }
        
        this.$slide = $slide;
    },
    
    run_code: function(pause) {
        var self = this;
        var paper = this.$slide.data('paper');
        var $slides = this.$slides;
        var $slide = this.$slide;
        var $textbox_code = $('.code', $slide);

        if (paper) {
            paper.clear();
            setTimeout(function() {
                try {
                    (new Function("paper", "window", "document", $textbox_code.val())).call(paper, paper);
                } catch (e) {
                    alert(e.message || e);
                }
            }, pause);
        }
    },
    
    advance_slide: function(dir) {
        var $to_slide;
        var $from_slide = $('.RP-slide.RP-active', this.$slides);
        
        if (dir == 1) {
            $to_slide = $from_slide.next('.RP-slide');
            if (!$to_slide.length)
                $to_slide = this.$slides.children('.RP-slide').eq(0);
        } else if (dir == -1) {
            var slide_index = this.$slides.children('.RP-active').prevAll('.RP-slide').length;
            $to_slide = this.$slides.children('.RP-slide').eq(slide_index-1);
        }
        
        this.$slides.animate({'left': -1*$to_slide.position().left + 'px'}, { duration: 1000, easing: 'easeInOutQuint' });
        
        $from_slide.removeClass('RP-active');
        $to_slide.addClass('RP-active');
        
        this.prepare_slide($to_slide);
        this.run_code(0);  
    },
    
    // ==========
    // = Events =
    // ==========
    
    handle_click: function(elem, e) {
        var self = this;

        $.targetIs(e, { tagSelector: '.run' }, function($t, $p){
            e.preventDefault();
            self.run_code();
        });
        
        $.targetIs(e, { tagSelector: '.RP-slide-control-previous' }, function($t, $p){
            e.preventDefault();
            self.advance_slide(-1);
        });
                
        $.targetIs(e, { tagSelector: '.RP-slide-control-next' }, function($t, $p){
            e.preventDefault();
            self.advance_slide(1);
        });

    }
    
};
