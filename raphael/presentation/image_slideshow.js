
var GALLERY_VIEWS = {
    WIDGET: {
        name: 'widget',
        selector: '.DL-gallery-widget',
        heading: '.DL-gallery-header-view-widget'
    },
    FILMSTRIP: {
        name: 'filmstrip',
        selector: '.DL-gallery-filmstrip',
        heading: '.DL-gallery-header-view-filmstrip'
    },
    MOSAIC: {
        name: 'mosaic',
        selector: '.DL-gallery-mosaic',
        heading: '.DL-gallery-header-view-mosaic'
    },
    THUMBNAILS_COVER: {
        name: 'thumbnails_cover',
        selector: '.DL-gallery-thumbnails-cover',
        heading: '.DL-gallery-header-view-thumbnails'
    },
    THUMBNAILS: {
        name: 'thumbnails',
        selector: '.DL-gallery-thumbnails',
        heading: '.DL-gallery-header-view-thumbnails'
    },
    FULLSCREEN: {
        name: 'fullscreen',
        selector: '.DL-gallery-fullscreen',
        heading: '.DL-gallery-header-view-fullscreen'
    }
};

var ImageSlideshow = function(paper, options, images) {

    var defaults = {
        slideshow_type: 'filmstrip',
        image_transition_time: 350,
        image_transition_type: 'backOut',
        page_transition_time: 900,
        page_transition_type: 'easeInOutQuint',
        image_width: 400,
        image_height: 300,
        slideshow_id: 'slideshow',
        canvas_width: 400,
        canvas_height: 300,
        scale: .75,
        thumbnails_gallery_thumbnails_per_page: 10,
        thumbnails_cover_gallery_thumbnails_per_page: 40,
        filmstrip_gallery_thumbnails_per_page: 24,
        images_per_ad_rotation: 3,
        page_type: 'embed',
        default_view: 'filmstrip'
    };

    this.opts = $.extend({}, defaults, options);
	this.$ss = $('#' + this.opts.slideshow_id);
	this.$module = this.$ss.parents('.DL-module').eq(0);
    this.filmstrip_loaded_pages = {};
    this.views = GALLERY_VIEWS;
    this.locks = {};
    this.cache = {};
    this.timers = {};
	this.counters = {
	    filmstrip_image_index: 0,
	    thumbnails_gallery: 0,
	    filmstrip_thumbnail_page: 0,
	    thumbnails_gallery_page: 0,
	    thumbnails_cover_page: 0,
	    mosaic_page: 0,
	    images_viewed: 0
	};

    if (this.opts.slideshow_type == 'svg') {
        this.images = images;
        this.num_images = images.length;
        this.R = paper; // Raphael(this.opts.slideshow_id, this.opts.canvas_width*this.num_images, this.opts.canvas_height);
    } else if (this.opts.slideshow_type == 'filmstrip') {
        this.num_images = $('.DL-slideshow .DL-photo-filmstrip-photos .DL-photo',
                            this.$module).length;
    }
};

ImageSlideshow.prototype = {

    // ==========
    // = Common =
    // ==========

    runner: function(images) {
        var self = this;
        if (this.opts.slideshow_type == 'svg') {
	        var R_images = this.create_svg_images(images);
		    $(this.R.canvas, this.$module).css({'left': '0px'});
		    this.paginate_svg_photos();
            this.filmstrip_page_to_photo(0);
        } else if (this.opts.slideshow_type == 'filmstrip') {
            var selected_view = this.extract_selected_view();
            var first_load = true;

            var image_id = $.hash('image') || this.convert_querystring_imageid_to_hash();

	        this.initial_hash = $.hash();
            this.change_view(selected_view, image_id, first_load);
            this.filmstrip_attach_hover_overlay_to_widget_images();
            this.watch_hash_for_changes();
        }

		this.handle_actions();
    },

    convert_querystring_imageid_to_hash: function() {
        var image_id = $.querystring_to_hash(location.search, 'image_id');

        return image_id;
    },

    extract_selected_view: function() {
        var hash_view = $.hash('view') || this.opts.default_view;
        var selected_view;

        for (v in this.views) {
            var view = this.views[v];
            if (view.name == hash_view) {
                selected_view = view;
                break;
            }
        }
        return selected_view;
    },

    get_image_index_from_image_id: function(image_id) {
        var photo_index = 0;
        $photos = $('.DL-photo-filmstrip-photos .DL-photo', this.$module);
        $photos.each(function(i) {
            var src = $('img', this).attr('src') || $('img', this).attr('rel');
            if (src && src.indexOf(image_id) != -1) {
                photo_index = i;
                return;
            }
        });

        return photo_index;
    },

    get_image_id_from_image_index: function(index) {
        $photo = $('.DL-photo-filmstrip-photos .DL-photo', this.$module).eq(index);
        var image_id = this.extract_image_id($photo);

        return image_id;
    },

    extract_image_id: function($image) {
        var img_src = $('img', $image).attr('src') || $('img', $image).attr('rel');
        if (img_src) {
            var r_img = img_src.match(/imageserve\/(.*?)\//);
            if (r_img && r_img.length > 0) {
                return r_img[1];
            }
        }
    },
    
    read_cache: function(func) {
        if (!this.cache[func]) {
            this.cache[func] = {};
        }
        
        return this.cache[func];
    },


    // ============
    // = URL Hash =
    // ============

    set_imageid_in_hash: function(image_id, view) {
        if (this.opts.page_type == 'gallery_page') {
            var hash = {
                'image': image_id
            };

            if (!view) view = this.active_view;
            hash['view'] = view.name;

			$.hash(hash);
            this.selected_hash = $.hash();
        }
    },

    remove_imageid_in_hash: function() {
        var current_view = $.hash('view');

        for (v in this.views) {
            var view = this.views[v];
            if (view.name == current_view) break;
        }
        if (view == this.views.FILMSTRIP || view == this.views.THUMBNAILS) {
        } else {
            $.removeHash('image');
        }
    },

    watch_hash_for_changes: function() {
        var self = this;
        if (this.opts.page_type != 'embed') {
            this.selected_hash = $.hash();

            	setInterval(function() {
                    if (!self.locks.prevent_hash_changes) {
                        var current_hash = $.hash();

                        if (self.selected_hash != current_hash) {

                            if (self.locks.hash_has_changed && current_hash == self.initial_hash) return;
                            var first_load = true;
                            var image_id = $.hash('image');
                            var selected_view = self.extract_selected_view();

                            self.selected_hash = current_hash;
            	            self.change_view(selected_view, image_id, first_load);
                        }
                    }
                }, 500);
        }
    },

    // ===================
    // = Lazyload Images =
    // ===================

    lazyload_load_images_by_view: function(selected_view) {
        var $view = $(selected_view.selector, this.$module);
        this.lazyload_load_images_by_container($view);
    },

    lazyload_load_images_by_container: function($container, index) {
        var $photos = $('.DL-photo img', $container);
        if (index) {
            // Also preload next image
            $photos = $photos.slice(index-1, index+2);
        }

        this.lazyload_load_images($photos);
    },

    lazyload_load_images_widget: function(index) {
        var $filmstrip = $(this.views.WIDGET.selector, this.$module);
        var $filmstrip_images = $('.DL-photo img', $filmstrip).slice(index, 2);

        this.lazyload_load_images($filmstrip_images);
    },

    lazyload_load_images: function($images) {
        $images.each(function() {
            var $img = $(this);
            var url = $img.attr('rel');
            $img.attr('src', url);
            $img.removeAttr('rel');
        });
    },

    // =================
    // = Gallery Views =
    // =================

    change_view: function(view, image, first_load) {
        var self = this;

        this.locks.prevent_hash_changes = true;

        if (first_load) {
            this.locks.hash_has_changed = true;
        }

        if (this.active_view != view || first_load) {

            // Filmstrip is special -- Need to compute this before showing
            if (view == this.views.FILMSTRIP) {
	            var $images = $('.DL-photo-filmstrip-thumbnails', this.$module);
    		    $images.css({'left': '0px'});
    		    this.filmstrip_connect_page_controls_to_image();
            }

            if (first_load && this.active_view == view) {
                // Special case: Back button.
                this.show_view(view, image);
            } else {
				// var is_iframed = (window.location.href != window.top.location.href);
                this.active_view = view;
                this.hide_all_views(function() {
                    self.show_view(view, image);
                });
            }
        }
    },

    hide_all_views: function(callback) {
        var num_views = $('.DL-gallery-view', this.$module).length;
        var i = 0;
        $('.DL-gallery-header-views li', this.$module).removeClass('DL-active');

        if (!num_views) {
            callback();
        } else {
            $('.DL-gallery-view', this.$module).fadeOut(250, function() {
                if (i == num_views-1) {
                    callback();
                }
                i++;
            });
        }
    },

    show_view: function(view, image) {
        var $thumbnail_pages, image_index;

        if (view == this.views.MOSAIC) {
            $.hash('view', view.name, {'clear': true});
            $('.DL-gallery-mosaic-page', this.$module).css({'display': 'none'});
            this.mosaic_page_to_mosaic(0);
        }
        if (view == this.views.THUMBNAILS_COVER) {
            $.hash('view', view.name, {'clear': true});
            $('.DL-gallery-thumbnails-cover-page', this.$module).css({'display': 'none'});
            this.thumbnails_cover_page(0);
        }
        if (view == this.views.THUMBNAILS) {
            $('.DL-gallery-thumbnails-page', this.$module).css({'display': 'none'});
            $('.DL-gallery-thumbnails-photos .DL-photo', this.$module).css({'display': 'none'});
            this.page_to_gallery_thumbnails_photo(image, view);
        }
        if (view == this.views.FILMSTRIP) {
            $thumbnail_pages = $('.DL-slideshow-thumbnails-images', this.$module);
            this.lazyload_load_images_by_container($thumbnail_pages);
        }
        if (view == this.views.WIDGET) {
            this.lazyload_load_images_widget(0);
        }

        $(view.selector, this.$module).fadeIn(250);
        $(view.heading, this.$module).addClass('DL-active');
        if (view == this.views.FILMSTRIP) {
            image_index = this.get_image_index_from_image_id(image) || 0;
            $thumbnail_pages = $('.DL-slideshow-thumbnails-images', this.$module);
            // Disable pagination arrows on thumbnails - removed, since they are now image-pagers.
            //if($thumbnail_pages.length == 1){
            //	$('.DL-thumbnails-previous-photo', this.$module).addClass('disabled');
            //	$('.DL-thumbnails-next-photo', this.$module).addClass('disabled');
            // }
            this.filmstrip_page_to_photo(image_index, true, view);
		    this.filmstrip_center_photo_view();
        }

        this.selected_hash = $.hash();
        this.locks.prevent_hash_changes = false;

    },

    // =============
    // = Filmstrip =
    // =============

    filmstrip_center_photo_view: function() {
        var image_size      =  $('.DL-photo-filmstrip-photos .DL-photo', this.$module).eq(0)
                                   .outerWidth({margin: true});
        var container_size  =  $('.DL-gallery-filmstrip-container', this.$module).width();
        var margin_left     =  (container_size - image_size) / 2;

        $('.DL-photo-filmstrip-photos-container', this.$module).css({'marginLeft': margin_left});
    },

    filmstrip_connect_page_controls_to_image: function() {
        var $thumbnails = $('.DL-slideshow-page-control', this.$module);
        $thumbnails.each(function(i) {
            $(this).data('page', i);
        });
    },

    filmstrip_page_to_photo: function(index, skip_animation, view) {
        var self = this;
        var start_time = (new Date()).getTime();
        var image_id = this.get_image_id_from_image_index(index);

        this.filmstrip_animate_to_photo(index, skip_animation);
        this.filmstrip_set_photo_as_active(index);

        clearTimeout(this.timers.rotate_ad_module);
        this.timers.rotate_ad_module = setTimeout(function(){
        	self.filmstrip_rotate_ad_module();
        }, 1000);
        
        clearTimeout(this.timers.set_imageid_in_hash);
        this.timers.set_imageid_in_hash = setTimeout(function() {
            self.set_imageid_in_hash(image_id, view);
        }, 650);
    },

    filmstrip_set_photo_as_active: function(index) {

        // var start_time = (new Date()).getTime();
        this.filmstrip_highlight_active_photo(index);
        this.filmstrip_highlight_thumbnail(index);
        this.filmstrip_show_photo_caption(index);
        this.filmstrip_show_correct_thumbnail_page(index);
        this.filmstrip_update_hover_image_link();
    },
    
    filmstrip_animate_to_photo: function(index, skip_animation) {
        var self = this;
        
        var cache = this.read_cache('filmstrip_animate_to_photo');
        
        var $arrows = cache.$arrows = cache.$arrows || 
                       $('.DL-photo-filmstrip-photos-container .DL-previous-photo, ' +
                         '.DL-photo-filmstrip-photos-container .DL-next-photo', this.$module);
        var $canvas = cache.$canvas = cache.$canvas || 
                       (this.opts.slideshow_type == 'svg'
                        ? $(this.R.canvas, this.$module)
                        : $('.DL-photo-filmstrip-photos', this.$module));
        var $action_button = cache.$action_button = cache.$action_button ||
                              $('a.DL-next-photo, a.DL-previous-photo', this.$module);
        var $page_control = cache.$page_control = cache.$page_control ||
                             $('.DL-slideshow-page-control', this.$module);
        var image_size = cache.image_size = cache.image_size ||
                          (this.opts.slideshow_type == 'svg'
                            ? this.opts.image_width
                            : $('.DL-photo-filmstrip-photos .DL-photo', this.$module).eq(0).outerWidth({margin: true}));
                            
        var old_left = parseInt($canvas.css('left'), 10) || 0;
        var new_left = (image_size * this.opts.scale * index * -1);

        $action_button.addClass('working');
        if (this.opts.slideshow_type == 'svg') {
            this.unfocus_svg_image(this.R_images[this.counters.filmstrip_image_index]);
        }
        this.counters.filmstrip_image_index = index;
        $page_control.removeClass('DL-active');
        $page_control.eq(index).addClass('DL-active');


        if (!skip_animation) {
            $canvas
                .css({'position': 'absolute', 'left': old_left})
                .stop()
                .animate({'left': new_left}, {
                    'duration': this.opts.page_transition_time,
                    'easing': this.opts.page_transition_type,
                    'complete': function() {
                        if (self.opts.slideshow_type == 'filmstrip') {
                            $action_button.removeClass('working');
                        }
                    },
                    'queue': false
                });
        } else if (skip_animation) {
            $canvas.css({
                'position': 'absolute',
                'left': new_left
            });
        }

        if (this.opts.slideshow_type == 'svg') {
            setTimeout(function() {
                self.focus_svg_image(self.R_images[index], function() {
                    $action_button.removeClass('working');
                });
            }, 400);
        }
    },

    filmstrip_toggle_captions: function($this) {
        $toggle = $this;
        var $caption = $('.DL-caption-wrapper', this.$module);
        var $caption_text = $('.DL-caption', $caption);
		this.filmstrip_hide_more_overlay();
        if ($caption.hasClass('hidden')) {
//            	$toggle.text('hide caption');
            $caption.css('height','auto').removeClass('hidden');
	    } else {
//                $toggle.text('show caption');
			$caption.animate({
    		    height: 0
		    }, 750, 'easeOutQuint').addClass('hidden');
	    }
	},


    // ======================
    // = Filmstrip Overlays =
    // ======================

    filmstrip_show_share_overlay: function() {
        var self = this;
        var $share_container = $('.DL-slideshow-share-container', this.$module);

        $share_container.bind('click.share_overlay', function(e) {
            if (e.target != $('.DL-slideshow-overlay-close', $share_container)[0]) {
                e.stopPropagation();
            }
        });
        setTimeout(function(){
            $(document).one('click.share_overlay', function(e) { self.filmstrip_hide_share_overlay(); });
        }, 20);

        this.filmstrip_hide_more_overlay();
        $('.DL-share-more', $share_container).addClass('DL-active');
        $share_container.fadeIn(350);

    },

    filmstrip_hide_share_overlay: function() {
        $('.DL-slideshow-share-container', this.$module).fadeOut(350);
    },

    filmstrip_show_more_overlay: function() {
        this.filmstrip_hide_share_overlay();

        this.filmstrip_highlight_thumbnail();
        $('.DL-slideshow-thumbnails-images', this.$module).css({'display': 'none'});
        this.filmstrip_page_to_thumbnails(0);

        $('.DL-slideshow-more-container', this.$module).fadeIn(250);

    },

    filmstrip_hide_more_overlay: function(callback) {
        $('.DL-slideshow-more-container', this.$module).fadeOut(250, callback);
    },
    
    filmstrip_highlight_active_photo: function(index) {
        var cache = this.read_cache('filmstrip_highlight_active_photo');
        var $photos = cache.$photos = cache.$photos || $('.DL-photo', this.$module);
        var $page_index = cache.$page_index = cache.$page_index || 
                                               $('.DL-slideshow-page-index-current', this.$module);
        $photos
            .siblings('.DL-active')
                .removeClass('DL-active')
            .end()
            .eq(index)
                .addClass('DL-active');
        $page_index.text(index+1);
    },

    filmstrip_highlight_thumbnail: function(index) {
        var cache = this.read_cache('filmstrip_highlight_thumbnail');
        var $photos = cache.$photos = cache.$photos ||
                                       $('.DL-slideshow-thumbnails-images .DL-photo', this.$module);
        var photo_index = index || $photos.siblings('.DL-active').prevAll().length;

        $photos
            .siblings('.DL-active')
                .andSelf()
                .removeClass('DL-active');
        $photos
            .eq(photo_index)
                .addClass('DL-active')
            .end();
    },

    filmstrip_show_photo_caption: function(index) {
        var cache = this.read_cache('filmstrip_show_photo_caption');
        var $photos = cache.$photos = cache.$photos ||
                                       $('.DL-slideshow-thumbnails-images .DL-photo', this.$module);
        var photo_index = index || $photos.siblings('.DL-active').prevAll().length;
        
        var $captions = cache.$captions = cache.$captions ||
                                           $('.DL-photo-filmstrip-captions .DL-photo-caption', this.$module);
        var $caption = $captions.eq(photo_index);
        var $captions_container = cache.$captions_container = cache.$captions_container ||
                                                      $('.DL-photo-filmstrip-captions-container', this.$module);

        $captions
            .siblings('.DL-active')
                .removeClass('DL-active')
                .css({
                	'display': 'none'
                });

        var caption_height = $('.DL-caption-wrapper', $caption).outerHeight();

        if((caption_height + 20) > 252){
        	$captions_container.css({'height': caption_height + 20});
        }else {
        	$captions_container.css({'height': 252});
        }

        $caption
            .css({
            	'display': 'block'
            })
            .addClass('DL-active');

    },

    filmstrip_page_to_thumbnails: function(index) {
        var cache = this.read_cache('filmstrip_page_to_thumbnails');
        
        var $pages = cache.$pages = cache.$pages || $('.DL-slideshow-thumbnails-images', this.$module);
        var $current = cache.$current = cache.$current || $('.DL-slideshow-more-page-index-current', this.$module);
        var $total = cache.$total = cache.$total || $('.DL-slideshow-more-page-index-total', this.$module);
        
        this.counters.filmstrip_thumbnail_page = index;

        $pages
            .fadeOut(250)
            .eq(index)
                .fadeIn(250);

        var $photo_page = $pages.eq(index);
        var photos_shown = $('.DL-photo', $photo_page).length;
        var photo_pages = $pages.length;
        var first_photo = index*this.opts.filmstrip_gallery_thumbnails_per_page + 1;
        var last_photo = first_photo + Math.min(this.opts.filmstrip_gallery_thumbnails_per_page, photos_shown) - 1;
		$current.text(index+1);
		$total.text($pages.length);
     },

    filmstrip_show_correct_thumbnail_page: function(index) {
        var cache = this.read_cache('filmstrip_show_correct_thumbnail_page');
        
        var $thumbnail_pages = cache.$thumbnail_pages = cache.$thumbnail_pages ||
                                                $('.DL-slideshow-thumbnails-images', this.$module);
        var $active_image_thumbnail_page = $('.DL-photo.DL-active', $thumbnail_pages).parents('.DL-slideshow-thumbnails-images');

        var thumbnail_page_index = $active_image_thumbnail_page.prevAll('.DL-slideshow-thumbnails-images').length;

        if (this.counters.filmstrip_thumbnail_page != thumbnail_page_index) {
            this.filmstrip_page_to_thumbnails(thumbnail_page_index);
        }

        this.filmstrip_filter_images_shown_in_page(index, thumbnail_page_index);
    },

    filmstrip_filter_images_shown_in_page: function(index, thumbnail_page_index) {
        var self = this;
        var cache = this.read_cache('filmstrip_filter_images_shown_in_page');
        
        photos_per_page = cache.photos_per_page;
        if (!photos_per_page) {
            var $thumbnail_pages = $('.DL-slideshow-thumbnails-images', this.$module).eq(0);
            photos_per_page = $('.DL-photo', $thumbnail_pages).length;
            cache.photos_per_page = photos_per_page;
        }

        if (!this.filmstrip_loaded_pages[thumbnail_page_index]) {
            this.filmstrip_loaded_pages[thumbnail_page_index] = true;
            var $photos = $('.DL-photo-filmstrip-photos .DL-photo img', this.$module)
                .slice(thumbnail_page_index*photos_per_page, (thumbnail_page_index+1)*photos_per_page);
            this.lazyload_load_images($photos);
        }
    },

    filmstrip_rotate_ad_module: function() {
        var cache = this.read_cache('filmstrip_rotate_ad_module');
        var $ad = cache.$ad = cache.$ad || $('.DL-ad-module-iframe', this.$module);

        this.counters.images_viewed++;

        if (this.counters.images_viewed % this.opts.images_per_ad_rotation == 0) {
            $ad.attr('src', $ad.attr('src'));
        }
    },

    filmstrip_attach_hover_overlay_to_widget_images: function() {
        var $widget_image_pane = $('.DL-gallery-widget .DL-photo-filmstrip-photos-container', this.$module);
        var $widget_hover_overlay = $('.DL-gallery-widget .DL-photo-filmstrip-photos-hover-overlay', this.$module);

        $widget_image_pane.hover(function() {
            $widget_hover_overlay.animate({ 'opacity': 1 }, { 'queue': false, duration: 250 });
        }, function() {
            $widget_hover_overlay.animate({ 'opacity': 0 }, { 'queue': false, duration: 250 });
        });

        this.filmstrip_update_hover_image_link();
    },

    filmstrip_update_hover_image_link: function() {
        var cache = this.read_cache('filmstrip_update_hover_image_link');
        var $widget_image_pane = cache.$widget_image_pane = cache.$widget_image_pane ||
                                    $('.DL-gallery-widget .DL-photo-filmstrip-photos-container', this.$module);
        var $widget_hover_overlay = cache.$widget_hover_overlay = cache.$widget_hover_overlay ||
                                    $('.DL-gallery-widget .DL-photo-filmstrip-photos-hover-overlay', this.$module);

        var $displayed_image = $('.DL-active a', $widget_image_pane);
        if (!$displayed_image.length) {
            $displayed_image = $('.DL-photo a', $widget_image_pane).eq(0);
        }
        var image_url = $displayed_image.attr('href');

        $('a', $widget_hover_overlay).attr('href', image_url);
    },

    // ===============
    // = Mosaic View =
    // ===============

    mosaic_page_to_mosaic: function(index) {
        var self = this;
        var active_view = $('.DL-gallery-mosaic-page', this.$module).eq(index).css('display') == 'block';

        if (!active_view) {
            this.mosaic_hide_all_mosaics(function() {
                self.mosaic_show_mosaic(index);
            });
        }

        $('.DL-gallery-mosaic-page-index-current', this.$module).text(index+1);
        this.counters.mosaic_page = index;

        var first_photo = 1;
        $('.DL-gallery-mosaic-page', this.$module).eq(index)
            .prevAll('.DL-gallery-mosaic-page').each(function() {
                first_photo += $(this).find('.DL-photo').length;
            });
        var photos_shown = $('.DL-gallery-mosaic-page', this.$module).eq(index)
                            .find('.DL-photo').length;
        var photo_pages =$('.DL-gallery-mosaic-page', this.$module).length;
        var last_photo = first_photo + photos_shown - 1;

        $('.DL-gallery-mosaic-page-index-current', this.$module).text(first_photo + '-' + last_photo);
    },

    mosaic_hide_all_mosaics: function(callback) {
        var $mosaics = $('.DL-gallery-mosaic-page', this.$module);
        var num_mosaics = $mosaics.length;
        var i = 0;
        $mosaics.fadeOut(250, function() {
            if (i == num_mosaics-1) {
                callback();
            }
            i++;
        });
    },

    mosaic_show_mosaic: function(index) {
        var $mosaic = $('.DL-gallery-mosaic-page', this.$module).eq(index);

        this.lazyload_load_images_by_container($mosaic);
        $mosaic.fadeIn(250);
    },

    // =========================
    // = Thumbnails Cover View =
    // =========================

    thumbnails_cover_page: function(index) {
        var self = this;
        var active_view = $('.DL-gallery-thumbnails-cover-page', this.$module).eq(index).css('display') == 'block';

        if (!active_view) {
            this.thumbnails_cover_hide_all_thumbnails(function() {
                self.thumbnails_cover_show_thumbnails(index);
            });
        }

        $('.DL-gallery-thumbnails-cover-page-index-current', this.$module).text(index+1);
        this.counters.thumbnails_cover_page = index;

        var first_photo = 1;
        $('.DL-gallery-thumbnails-cover-page', this.$module).eq(index)
            .prevAll('.DL-gallery-thumbnails-cover-page').each(function() {
                first_photo += $(this).find('.DL-photo').length;
            });
        var photos_shown = $('.DL-gallery-thumbnails-cover-page', this.$module).eq(index)
                            .find('.DL-photo').length;
        var photo_pages =$('.DL-gallery-thumbnails-cover-page', this.$module).length;
        var last_photo = first_photo + photos_shown - 1;

      	$('.DL-gallery-thumbnails-cover-page-index-current', this.$module).text(first_photo + '-' + last_photo);
    },

    thumbnails_cover_hide_all_thumbnails: function(callback) {
        var $thumbnail_pages = $('.DL-gallery-thumbnails-cover-page', this.$module);
        var num_thumbnail_pages = $thumbnail_pages.length;
        var i = 0;
        $thumbnail_pages.fadeOut(250, function() {
            if (i == num_thumbnail_pages-1) {
                callback();
            }
            i++;
        });
    },

    thumbnails_cover_show_thumbnails: function(index) {
        var $thumbnail_page = $('.DL-gallery-thumbnails-cover-page', this.$module).eq(index);

        this.lazyload_load_images_by_container($thumbnail_page);
        $thumbnail_page.fadeIn(250);
    },

    thumbnails_cover_gallery_page_to_photo: function(index) {
        this.change_view(this.views.THUMBNAILS, index);
    },

    // ===================
    // = Thumbnails View =
    // ===================

    thumbnails_page_to_gallery_thumbnails_page: function(index) {
        var self = this;
        var active_view = $('.DL-gallery-thumbnails-page', this.$module).eq(index).css('display') == 'block';

        if (!active_view) {
            this.thumbnails_hide_all_thumbnails(function() {
                self.thumbnails_show_thumbnails(index);
            });
        }

        this.counters.thumbnails_gallery_page = index;

        var first_photo = 1;
        $('.DL-gallery-thumbnails-page', this.$module).eq(index)
            .prevAll('.DL-gallery-thumbnails-page').each(function() {
                first_photo += $(this).find('.DL-photo').length;
            });
        var photos_shown = $('.DL-gallery-thumbnails-page', this.$module).eq(index)
                            .find('.DL-photo').length;
        var photo_pages =$('.DL-gallery-thumbnails-page', this.$module).length;
        var last_photo = first_photo + photos_shown - 1;
        $('.DL-gallery-thumbnails-page-index-current', this.$module).text(first_photo + '-' + last_photo);
    },

    thumbnails_hide_all_thumbnails: function(callback) {
        var $thumbnail_pages = $('.DL-gallery-thumbnails-page', this.$module);
        var num_thumbnail_pages = $thumbnail_pages.length;
        var i = 0;
        $thumbnail_pages.fadeOut(250, function() {
            if (i == num_thumbnail_pages-1) {
                callback();
            }
            i++;
        });
    },

    thumbnails_show_thumbnails: function(index) {
        var $thumbnail_page = $('.DL-gallery-thumbnails-page', this.$module).eq(index);

        this.lazyload_load_images_by_container($thumbnail_page);
        $thumbnail_page.fadeIn(250);
    },


    page_to_gallery_thumbnails_photo: function(index, view) {
        var self = this;

        if (!index) index = 0;
        if (typeof index != 'number') {
            var image_id = index;
            index = this.get_image_index_from_image_id(image_id);
        }

        this.counters.thumbnails_gallery = index;

        this.thumbnails_hide_all_photos();
        this.set_thumbnails_gallery_thumbnail_as_active(index);
        this.set_thumbnails_gallery_photo_as_active(index);

        var image_id = this.get_image_id_from_image_index(index);
        this.set_imageid_in_hash(image_id, view);
    },

    thumbnails_hide_all_photos: function() {
        var $photos = $('.DL-gallery-thumbnails-photos .DL-photo', this.$module);;
        $photos.css({'display': 'none'});
    },

    set_thumbnails_gallery_photo_as_active: function(index) {
        var $photos = $('.DL-gallery-thumbnails-photos .DL-photo', this.$module);
        var $photo = $photos.eq(index);
        $photos = $photos.not($photo);
        var num_thumbnail_photos = $photos.length;
        var i = 0;

        this.lazyload_load_images_by_container($photos.parent(), index);

        $photos.fadeOut(250, function() {
            if (i == num_thumbnail_photos-1) {
                $photo.fadeIn(250).addClass('DL-active');
            }
            i++;
        }).removeClass('DL-active');

        $('.DL-gallery-thumbnails .DL-gallery-thumbnails-photos-index-current', this.$module).text(index+1);
    },

    set_thumbnails_gallery_thumbnail_as_active: function(index) {
        $('.DL-gallery-thumbnails .DL-gallery-thumbnails-page .DL-photo', this.$module)
            .removeClass('DL-active')
            .eq(index)
                .addClass('DL-active');

        this.highlight_gallery_thumbnail(index);
        this.show_correct_gallery_thumbnail_page(index);
    },

    highlight_gallery_thumbnail: function(index) {
        var photo_index;
        if (typeof index != 'undefined') {
            photo_index = index;
        } else {
            photo_index = $('.DL-gallery-thumbnails .DL-gallery-thumbnails-photos .DL-photo.DL-active',
                                this.$module).prevAll().length;
        }

        $('.DL-gallery-thumbnails-page .DL-photo', this.$module)
            .removeClass('DL-active')
            .eq(photo_index)
                .addClass('DL-active')
            .end();
    },

    show_correct_gallery_thumbnail_page: function(index) {
        var $thumbnails_pages = $('.DL-gallery-thumbnails-page', this.$module);
        var $active_image_thumbnail_page = $('.DL-photo', $thumbnails_pages)
            .eq(index)
                .parents('.DL-gallery-thumbnails-page');

        var thumbnails_page_index = $active_image_thumbnail_page.prevAll('.DL-gallery-thumbnails-page').length;
        if ($thumbnails_pages.eq(thumbnails_page_index).css('display') != 'block') {
            this.thumbnails_page_to_gallery_thumbnails_page(thumbnails_page_index);
        }
    },

    // ==============
    // = SVG Images =
    // ==============

    create_svg_images: function(images) {
        var R_images = [];

		for (var i=0; i < this.num_images; i++) {
		    var image = images[i];
            var img_start_x = (this.opts.canvas_width-this.opts.image_width)/2 + i*this.opts.image_width*this.opts.scale;
            var img_start_y = (this.opts.canvas_height-this.opts.image_height)/2;
		    var R_image = this.R.image(image.src, img_start_x, img_start_y,
		                               this.opts.image_width, this.opts.image_height)
                            .toBack()
                            .scale(this.opts.scale)
		                    .attr({'opacity': .5});
		    R_images.push(R_image);
		};

		this.R_images = R_images;
		
		return R_images;
    },

    focus_svg_image: function(R_img,callback) {
        R_img
            .toFront()
            .animate({'scale': [1, 1], 'opacity': 1},
                     this.opts.image_transition_time, this.opts.image_transition_type, callback);
    },

	unfocus_svg_image: function(R_img, callback) {
		R_img
		    .animate({'scale': [this.opts.scale, this.opts.scale], 'opacity': .5},
                     this.opts.image_transition_time, this.opts.image_transition_type, callback);
    },

    paginate_svg_photos: function() {
        var images = this.images;

        var $page_controls = $.make('ul', { className: 'DL-slideshow-page-controls' });
        for (i in images) {
            var $page = $.make('li', { className: 'DL-slideshow-page-control' }, ''+(1+parseInt(i, 10)))
                            .data('page', i);
            $page_controls.append($page);
        }

        this.$module.append($page_controls);
    },

    // ==========
    // = Events =
    // ==========

    handle_actions: function() {
		this.$module.bind('click', $.rescope(this.click, this));
    },

    click: function(elem, e){
		var self = this;

		$.targetIs(e, { tagSelector: '.DL-caption-toggle' }, function($this){
            e.preventDefault();
            self.filmstrip_toggle_captions($this);
        });

		$.targetIs(e, { tagSelector: '.DL-slideshow-overlay-close' }, function($this){
            e.preventDefault();

            self.filmstrip_hide_share_overlay();
        	self.filmstrip_hide_more_overlay();
        });

		$.targetIs(e, { tagSelector: '.DL-slideshow-page-control' }, function($this){
            e.preventDefault();
            var page = parseInt($this.data('page'));
            
            self.filmstrip_page_to_photo(page);
        });

		$.targetIs(e, { tagSelector: '.DL-share.DL-slideshow-taskbar' }, function($this){
            e.preventDefault();
        	if ($('.DL-slideshow-share-container', self.$module).css('display') == 'block') {
        		self.filmstrip_hide_share_overlay();
        	} else {
        		self.filmstrip_show_share_overlay();
        	}
        });

		$.targetIs(e, { tagSelector: '.DL-more.DL-slideshow-taskbar' }, function($this){
            e.preventDefault();
        	if ($('.DL-slideshow-more-container', self.$module).css('display') == 'block') {
        		self.filmstrip_hide_more_overlay();
        	} else {
        		self.filmstrip_show_more_overlay();
        	}
        });

		$.targetIs(e, { tagSelector: '.DL-thumbnails-next-photo',
		                childOf: '.DL-slideshow-more-page-controls' }, function($this){
            e.preventDefault();
            var num_thumbnail_pages = $('.DL-slideshow-thumbnails-images', this.$module).length;
            if ($this.hasClass('disabled')){
            	return false;
            }
            if (self.counters.filmstrip_thumbnail_page < num_thumbnail_pages-1) {
                self.filmstrip_page_to_thumbnails(self.counters.filmstrip_thumbnail_page+1);
            } else {
                self.filmstrip_page_to_thumbnails(0);
            }
        });

		$.targetIs(e, { tagSelector: '.DL-thumbnails-previous-photo',
		                childOf: '.DL-slideshow-more-page-controls' }, function($this){
            e.preventDefault();
            var num_thumbnail_pages = $('.DL-slideshow-thumbnails-images', this.$module).length;
			if ($this.hasClass('disabled')){
            	return false;
            }
            if (self.counters.filmstrip_thumbnail_page > 0) {
                self.filmstrip_page_to_thumbnails(self.counters.filmstrip_thumbnail_page-1);
            } else {
                self.filmstrip_page_to_thumbnails(num_thumbnail_pages-1);
            }
        });

		$.targetIs(e, { tagSelector: '.DL-gallery-mosaic-next-page' }, function($this){
            e.preventDefault();
            var num_mosaic_pages = $('.DL-gallery-mosaic-page', this.$module).length;

            if (self.counters.mosaic_page < num_mosaic_pages-1) {
                self.mosaic_page_to_mosaic(self.counters.mosaic_page+1);
            } else {
                self.mosaic_page_to_mosaic(0);
            }
        });

		$.targetIs(e, { tagSelector: '.DL-gallery-mosaic-previous-page' }, function($this){
            e.preventDefault();
            var num_mosaic_pages = $('.DL-gallery-mosaic-page', this.$module).length;

            if (self.counters.mosaic_page > 0) {
                self.mosaic_page_to_mosaic(self.counters.mosaic_page-1);
            } else {
                self.mosaic_page_to_mosaic(num_mosaic_pages-1);
            }
        });

		$.targetIs(e, { tagSelector: '.DL-gallery-thumbnails-cover-next-page' }, function($this){
            e.preventDefault();
            var num_thumbnails_cover_pages = $('.DL-gallery-thumbnails-cover-page', this.$module).length;

            if (self.counters.thumbnails_cover_page < num_thumbnails_cover_pages-1) {
                self.thumbnails_cover_page(self.counters.thumbnails_cover_page+1);
            } else {
                self.thumbnails_cover_page(0);
            }
        });

		$.targetIs(e, { tagSelector: '.DL-gallery-thumbnails-cover-previous-page' }, function($this){
            e.preventDefault();
            var num_thumbnails_cover_pages = $('.DL-gallery-thumbnails-cover-page', this.$module).length;

            if (self.counters.thumbnails_cover_page > 0) {
                self.thumbnails_cover_page(self.counters.thumbnails_cover_page-1);
            } else {
                self.thumbnails_cover_page(num_thumbnails_cover_pages-1);
            }
        });

		$.targetIs(e, { tagSelector: '.DL-gallery-thumbnails-next-page' }, function($this){
            e.preventDefault();
            var num_thumbnails_pages = $('.DL-gallery-thumbnails-page', this.$module).length;

            if (self.counters.thumbnails_gallery_page < num_thumbnails_pages-1) {
                self.thumbnails_page_to_gallery_thumbnails_page(self.counters.thumbnails_gallery_page+1);
            } else {
                self.thumbnails_page_to_gallery_thumbnails_page(0);
            }
        });

		$.targetIs(e, { tagSelector: '.DL-gallery-thumbnails-previous-page' }, function($this){
            e.preventDefault();
            var num_thumbnails_pages = $('.DL-gallery-thumbnails-page', this.$module).length;

            if (self.counters.thumbnails_gallery_page > 0) {
                self.thumbnails_page_to_gallery_thumbnails_page(self.counters.thumbnails_gallery_page-1);
            } else {
                self.thumbnails_page_to_gallery_thumbnails_page(num_thumbnails_pages-1);
            }
        });

		$.targetIs(e, { tagSelector: '.DL-photo', childOf: '.DL-gallery-thumbnails-cover-container' },
		    function($this) {

            e.preventDefault();

            var index = $this.prevAll().length +
                (self.counters.thumbnails_cover_page*self.opts.thumbnails_cover_gallery_thumbnails_per_page);

            // self.thumbnails_cover_gallery_page_to_photo(index);
            var image_id = self.get_image_id_from_image_index(index);
            self.change_view(self.views.FILMSTRIP, image_id);
        });

		$.targetIs(e, { tagSelector: '.DL-photo', childOf: '.DL-gallery-thumbnails-side-container' },
		    function($this) {

            e.preventDefault();

            var index = $this.prevAll().length +
                (self.counters.thumbnails_gallery_page*self.opts.thumbnails_gallery_thumbnails_per_page);

            self.page_to_gallery_thumbnails_photo(index);
        });

		$.targetIs(e, { tagSelector: '.DL-photo', childOf: '.DL-slideshow-thumbnails-images' }, function($this){
            if ($this.parents('.DL-gallery-filmstrip').length) {
                e.preventDefault();
                var index = $this.prevAll().length + (self.counters.filmstrip_thumbnail_page*self.opts.filmstrip_gallery_thumbnails_per_page);

                self.filmstrip_page_to_photo(index);
            }
        });

		$.targetIs(e, { tagSelector: '.DL-photo', childOf: '.DL-slideshow-thumbnails-images' }, function($this){
            if ($this.parents('.DL-gallery-widget').length) {
                e.preventDefault();
                var index = $this.prevAll().length + (self.counters.filmstrip_thumbnail_page*self.opts.filmstrip_gallery_thumbnails_per_page);

                self.filmstrip_hide_more_overlay(function() {
                    self.filmstrip_page_to_photo(index);
                });
            }
        });

//			$.targetIs(e, { tagSelector: '.DL-photo', childOf: '.DL-photo-filmstrip-photos' }, function($this){
//                if ($this.parents('.DL-gallery-filmstrip').length) {
//                    e.preventDefault();
////                    var image_id = self.extract_image_id($this);
////                    self.change_view(self.views.THUMBNAILS, image_id);
//                }
//            });

		$.targetIs(e, { tagSelector: '.DL-photo', childOf: '.DL-gallery-mosaic-page' }, function($this){
            e.preventDefault();

            var image_id = self.extract_image_id($this);
            //self.change_view(self.views.THUMBNAILS, image_id);
             self.change_view(self.views.FILMSTRIP, image_id);
        });

		$.targetIs(e, { tagSelector: 'a.DL-next-photo, a.DL-previous-photo', childOf: '.DL-slideshow,.DL-gallery-thumbnails' }, function($this){
            e.preventDefault();

            if (!$this.hasClass('disabled')) {
                if ((self.opts.slideshow_type == 'svg' && !$this.hasClass('working'))
                    || (self.opts.slideshow_type != 'svg')) {
        	        var next = $this.hasClass('DL-next-photo') ? true : false;
                    var index;
                    if (self.counters.filmstrip_image_index == (self.num_images-1) && next) {
                        index = 0;
                    } else if (self.counters.filmstrip_image_index == 0 && !next) {
                        index = self.num_images - 1;
                    } else {
                        index = next ? self.counters.filmstrip_image_index + 1 : self.counters.filmstrip_image_index - 1;
                    }
                    var $nav = $('.DL-slideshow-page-control', self.$module).eq(index);

                    self.filmstrip_page_to_photo(index);
                }
            }
        });

		$.targetIs(e, { tagSelector: 'a.DL-next-photo, a.DL-previous-photo', childOf: '.DL-gallery-thumbnails' }, function($this){
            e.preventDefault();

	        var next = $this.hasClass('DL-next-photo') ? true : false;
            var index = self.counters.thumbnails_gallery;
            var total = self.num_images;

            if (next && index < total-1) {
                self.page_to_gallery_thumbnails_photo(index+1);
            } else if (next && index == total-1) {
                self.page_to_gallery_thumbnails_photo(0);
            } else if (!next && index == 0) {
                self.page_to_gallery_thumbnails_photo(total-1);
            } else if (!next && index > 0) {
                self.page_to_gallery_thumbnails_photo(index-1);
            }

        });

        // === Header Events ===

		$.targetIs(e, { tagSelector: '.DL-gallery-header-view-mosaic' }, function($this){
            e.preventDefault();
            self.change_view(self.views.MOSAIC);
        });
		$.targetIs(e, { tagSelector: '.DL-gallery-header-view-thumbnails' }, function($this){
            e.preventDefault();
            self.change_view(self.views.THUMBNAILS_COVER);
        });
		$.targetIs(e, { tagSelector: '.DL-gallery-header-view-filmstrip' }, function($this){
            e.preventDefault();
            self.change_view(self.views.FILMSTRIP);
        });
		$.targetIs(e, { tagSelector: '.DL-gallery-header-view-fullscreen' }, function($this){
            e.preventDefault();
            self.change_view(self.views.FULLSCREEN);
        });
   }

};

