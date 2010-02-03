var TopicConnectionGraph = function(paper, graph_id, graph_x, graph_y, center_x, center_y, offset_x, offset_y, sizes) {

    // var paper = Raphael(graph_id, graph_x, graph_y);
    this.r = paper;
    this.center_x = center_x || 125;
    this.center_y = center_y || 125;
    this.offset_x = offset_x || 35;
    this.offset_y = offset_y || 35;
    this.sizes = sizes || { 'small': 30, 'medium': 50, 'large': 70, 'xlarge': 100 };
    this.rotation = 3.14/2;
	this.$graph = $('#' + graph_id);
	this.$module = this.$graph.parents('.SO-module');
};

TopicConnectionGraph.prototype = {

    runner: function(images, topic_image) {
        this.arc_step_size = 2*3.14 / images.length;

        topic_image['img_svg'] = this.create_image(topic_image['img'], this.center_x+this.offset_x, this.center_y+this.offset_y, this.sizes[topic_image['s']]);

        for (var i = 0, ii = images.length; i < ii; i++) {
            var img = images[i];
            var x =   (Math.cos(this.arc_step_size*i-this.rotation) * (this.center_x))
                    + (this.center_x)
                    + (this.offset_x);
            var y =   (Math.sin(this.arc_step_size*i-this.rotation) * (this.center_y))
                    + (this.center_y)
                    + (this.offset_y);
                      
            img['img_svg'] = this.create_image(img['img'], x, y, this.sizes[img['s']]);
			img['img_svg']['topic_index'] = i;

            var start_x =   Math.cos(this.arc_step_size*i-this.rotation) * (this.sizes[topic_image['s']]/2)
                          + this.center_x
                          + this.offset_x;
            var start_y =   Math.sin(this.arc_step_size*i-this.rotation)*(this.sizes[topic_image['s']]/2)
                          + this.center_y
                          + this.offset_y;
            var end_x = x - (Math.cos(this.arc_step_size*i-this.rotation)
                             * (this.sizes[img['s']]/2));
            var end_y = y - (Math.sin(this.arc_step_size*i-this.rotation)
                             * (this.sizes[img['s']]/2));
            
            var rand_x = Math.random()*end_x;
            var rand_y = Math.random()*end_y;
            
            var path = "M"+start_x+","+start_y+"L"+end_x+","+end_y;
            var p = this.r.path(path).attr({stroke:'#C0C0C0', 'stroke-width': 3});
            this.hover_image(img['img_svg'], p, topic_image['img_svg'], img);
            this.link_image(img, p);
        }
        this.position_topic_names(images);
        topic_image['img_svg']['c_2'].toFront();
    },

    create_image: function(src, x, y, s) {
        var radius = s / 2;
        var xCoor = x;
        var yCoor = y;
        var c_3_sw = (Math.sqrt(2) - 1) * radius;
        var c_2_sw = 3;
        var c_1_sw = 3;
        var c_3_r = radius + (.5*c_3_sw);
        var c_2_r = radius;
        var c_1_r = radius - 2;
        var color = '#C0C0C0';

        var heroImage = this.r.image(src, x-radius, y-radius, s, s);
        var c_3 = this.r.circle(xCoor, yCoor, c_3_r).attr({stroke: '#fff', 'stroke-width': c_3_sw });
        var c_2 = this.r.circle(xCoor, yCoor, c_2_r).attr({stroke: color, 'stroke-width': c_2_sw });
        var c_1 = this.r.circle(xCoor, yCoor, c_1_r).attr({stroke: '#fff', 'stroke-width': c_1_sw });
        c_2.insertAfter(c_1);

        var set = this.r.set();
        set.push(heroImage);
        set.push(c_2);
        set.push(c_1);

        return {img: heroImage, c_2: c_2, c_1: c_1, set: set};
    },

    hover_image: function(img_vect, path, topic_image_vect, img_info) {
        var self = this;
        var defaultColor = '#C0C0C0';
        var hoverColor = '#ffcc00';
        var c_2_r = img_vect['c_2'].attr('r');
        var t_r = topic_image_vect['c_2'].attr('r');
        var $topic_title = $('.SO-topic a.SO-name', this.$module).eq(img_vect['topic_index'])
                            .parents('.SO-topic').eq(0);

        var on = function () {
            img_vect['c_2'].attr({stroke: hoverColor});
            path.attr({stroke: hoverColor});
            topic_image_vect['c_2'].attr({stroke: hoverColor});
            path.animate({'stroke-width':5}, 150);
            img_vect['c_2'].animate({'stroke-width':5, 'r':c_2_r+1}, 150);
            topic_image_vect['c_2'].animate({'stroke-width':5, 'r':t_r+1}, 150);

            $(img_vect['img'][0]).css('cursor', 'pointer');
            $(img_vect['c_1'][0]).css('cursor', 'pointer');
            $(img_vect['c_2'][0]).css('cursor', 'pointer');
            $(path[0]).css('cursor', 'pointer');

            $topic_title.addClass('SO-active');
        };
        var off = function () {
            img_vect['c_2'].attr({stroke: defaultColor});
            path.attr({stroke: defaultColor});
            topic_image_vect['c_2'].attr({stroke: defaultColor});
            path.animate({'stroke-width':3}, 100);
            img_vect['c_2'].animate({'stroke-width':3, 'r':c_2_r}, 100);
            topic_image_vect['c_2'].animate({'stroke-width':3, 'r':t_r}, 100);

            $(img_vect['img'][0]).css('cursor', 'default');
            $(img_vect['c_1'][0]).css('cursor', 'default');
            $(img_vect['c_2'][0]).css('cursor', 'default');
            $(path[0]).css('cursor', 'default');

            $topic_title.removeClass('SO-active');
        };

        img_vect['set'].mouseover(on);
        img_vect['set'].mouseout(off);
        $topic_title.mouseover(on);
        $topic_title.mouseout(off);

    },

    link_image: function(img, path) {
        // DAYLIFE.log(['img', img, img['img_svg']['img'][0], $(img['img_svg']['img'][0])]);
        img['img_svg']['set'].click(function() {
            window.location.href = img['link'];
        });
        path.click(function() {
            window.location.href = img['link'];
        });
    },

	position_topic_names: function(images){
		var graph_height = this.$graph.height();
		var graph_width = this.$graph.width();
		var offset_x = this.$graph.offset().left;
		var offset_y = this.$graph.offset().top;
		$('.SO-topic .SO-name', this.$module).css({
		    'left': '-10000px'
		});
		for (var i = images.length - 1; i >= 0; i--) {
			var c_2 = images[i]['img_svg']['c_2'];
			var cx = Math.floor(c_2.attr('cx'));
			var cy = Math.floor(c_2.attr('cy'));
			var r = Math.ceil(c_2.attr('r'));
			var hemisphere = (cy < (graph_height/2)) ? 'top' : 'bottom';
			var y_padding = 0;
			var $a = $('li.SO-topic:eq('+i+') a.SO-name', this.$module);
			if ($a.length > 0) {
			    var left = cx - Math.floor($a.outerWidth()/2);
				var top = (hemisphere == 'top') ? cy - r - y_padding - $a.outerHeight(true) : cy + r + y_padding;
				$a.css({
					'left': left + offset_x,
					'top': top + offset_y,
					'visibility': 'visible'
				});
			}
		};
	}

};
