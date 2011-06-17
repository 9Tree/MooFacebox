/*
 * mooFacebox
 * version: 0.5 (18/05/2011)
 * @requires MooTools v1.3 or later
 *
 * Licensed under the MIT:
 *
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Original Facebox (http://famspam.com/facebox) - Copyright since 2007 by Chris Wanstrath [ chris@ozmm.org ]
 * Original port (http://code.google.com/p/moofacebox/) - Copyright since 2008 by Augusto Becciu [ augusto@becciu.org ]
 * This version (https://github.com/carlosouro/MooFacebox) - Copyright since 2011 by Carlos Ouro [ carlos.ouro@9tree.net ]
 *
 * Usage:
 *  
 *  window.addEvent('domready', function() {
 *      var myFacebox = new mooFacebox();
 *  });
 *
 *
 *  <a href="#terms" rel="facebox">Terms</a>
 *    Loads the #terms div in the box
 *
 *  <a href="terms.html" rel="facebox">Terms</a>
 *    Loads the terms.html page in the box
 *
 *  <a href="terms.png" rel="facebox">Terms</a>
 *    Loads the terms.png image in the box
 *
 */


var mooFacebox = new Class({

    Implements: Options,

    options: {
        draggable: false,
        elementsSelector: 'a[rel="facebox"]',
        image_types   : [ 'png', 'jpg', 'jpeg', 'gif' ],
		default_opts  : {title:'', klass:false, close:true, data:{}, evalScripts:true},
        facebox_html  : '\
    <div class="popup"> \
      <table class="drag_container"> \
        <tbody> \
          <tr> \
            <td class="tl"/><td class="b"/><td class="tr"/> \
          </tr> \
          <tr> \
            <td class="b"/> \
            <td class="dialog-content"> \
              <h2 class="title"> \
                <span></span> \
              </h2> \
              <div class="body"> \
                <div class="content" style="overflow:visible;"> \
				</div> \
              </div> \
			  <div class="footer" style="display:none;"> \
                <div class="close"></div> \
				<div style="clear:both"></div> \
              </div> \
            </td> \
            <td class="b"/> \
          </tr> \
          <tr> \
            <td class="bl"/><td class="b"/><td class="br"/> \
          </tr> \
        </tbody> \
      </table> \
    </div>'
    },

    loading: function() {
        if (this.faceboxEl.getElement('.loading')) return true;
		
		if(this.opened) {
			//readjust position
			this.faceboxEl.getElement('.drag_container').setStyles({position:'relative',left:0,top:0});
		}
		
        this.faceboxEl.getElement('.content').empty();

        var bodyEl = this.faceboxEl.getElement('.body');
        bodyEl.getChildren().setStyle('display', 'none');
        
        var loadingEl = new Element('div', {'class': 'loading'});

        bodyEl.adopt(loadingEl);

        var pageScroll = this.getPageScroll();
        this.faceboxEl.setStyles({
            top: pageScroll[1] + (this.getPageHeight() / 6),
            left: pageScroll[0]
        });

        $(document).addEvent('keydown', this.keydownHdlr);
		
        this.fadeIn(this.faceboxEl, function(){
			this.opened = true;
			if (this.options.draggable == true) {
	            var dcontentEl = this.faceboxEl.getElement('.title');
	            this.drag=this.faceboxEl.getElement('.drag_container').makeDraggable({handle: dcontentEl});

	            dcontentEl.setStyle('cursor', 'move');
	        }
		}.bind(this));
    },
	
	// 9Tree: close option added (not implemented for rel atributtes)
    reveal: function(data, klass, close) {
		this.faceboxEl.getElement('.footer').setStyle('display', (close ? '' : 'none'));
		
        if (klass) this.faceboxEl.getElement('.content').addClass(klass);
		
        if ($type(data) == 'string')
            this.faceboxEl.getElement('.content').set('html', data);
        else
            this.faceboxEl.getElement('.content').adopt(data);

        this.faceboxEl.getElement('.loading').destroy();
        var childs = this.faceboxEl.getElement('.body').getChildren();
		this.fadeIn(childs[0]);
    },

    fadeIn: function(el, onComplete) {
        el.set('tween', {
            onStart: function() {
                el.setStyle('display', 'block');
            },
			onComplete: (onComplete?onComplete:function() {})
        });
        return el.fade('in');
    },

    fadeOut: function(el, onComplete) {
        el.set('tween', {
            onComplete: (onComplete?onComplete:function() {
                el.setStyle('display', 'none');
            })
        });
        return el.fade('out');
    },

    close: function() {
        $(document).removeEvent('keydown', this.keydownHdlr);
		this.drag.stop();
        this.fadeOut(this.faceboxEl, function(){
			this.faceboxEl.getElement('.drag_container').setStyles({position:'relative',left:0,top:0});
		}.bind(this));
        var contentEl = this.faceboxEl.getElement('.content');
        contentEl.set('class', '');
        contentEl.addClass('content');
		this.opened=false;
    },

    setTitle: function(title) {
        var titleEl = this.faceboxEl.getElement('.title');
        if (title == "")
            titleEl.setStyle('display', 'none');
        else
            titleEl.setStyle('display', 'block');

        titleEl.getElement('span').set('text', title);
    },

    initialize: function(options) {
        this.setOptions(options);

        this.faceboxEl = new Element('div', {'id': 'facebox', 'style': 'display: none;'});
        this.faceboxEl.fade('hide');
        this.faceboxEl.set('html', this.options.facebox_html);
		this.opened=false;

        $(document.body).adopt(this.faceboxEl);

        // preload images
		var preload=new Array();
        this.faceboxEl.getElements('.b:first, .bl, .br, .tl, .tr, .close, .loading').each(function(el) {
            preload.push(new Asset.image(el.getStyle('background-image').replace(/url\((.+)\)/, '$1')));
        });

        this.faceboxEl.getElement('.close').addEvent('click', this.close.bind(this));
		
		// 9Tree: set e.stop() only when e.code == 27
		// this allows you to write within facebox and still keeps the key event
        this.keydownHdlr = function(e) {
			e = new Event(e);
            if (e.code == 27){
	            e.stop();
				this.close();
			} 
        }.bind(this);

        this.image_types = this.options.image_types.join('|');
        this.image_types = new RegExp('\.' + this.image_types + '$', 'i');

        var elements = $$(this.options.elementsSelector);
		elements.each(function(el){
			el.addEvent('click', function(e) {
	            e = new Event(e);
	            e.stop();
	            this.openAnchor(el);
	            return false;
	        }.bind(this));
		}.bind(this));
        

    },

	// 9Tree: separated this code from within event click so it can be called 
	// from javascript without requiring the click event
	openAnchor:function(el) {
		el=$(el);

        // support for rel="facebox[.inline_popup]" syntax, to add a class
		var klass;
		if(el.rel){
			klass = el.rel.match(/facebox\[\.(\w+)\]/);
	        if (klass) klass = klass[1];
		} else klass=false;
		
		this.open(el.href, {klass:klass, title:el.title});

        return false;
    },
	
	// opens a facebox directly from javascript
	// also supports POST data
	open:function(url, opts){
		
		opts = $merge(this.options.default_opts, opts);
		this.setTitle(opts.title);
        this.loading();
		
		// div
        if (url.match(/#/)) {
            var target = url.replace('#','');
            this.reveal($(target).clone().setStyle('display','block'), opts.klass, opts.close);

        // image
        } else if (url.match(this.image_types)) {
            var image = new Asset.image(url, {
                onload: function() {
                    this.reveal('<div class="image"><img src="' + image.src + '" /></div>', opts.klass, opts.close);
                }.bind(this)
            });

        // ajax
        } else {
            new Request.HTML({
				evalScripts: opts.evalScripts,
	            url: url,
	            method: 'post',
	            onSuccess: function(responseText, responseXML) {
	                this.reveal(responseText, opts.klass, opts.close);
	            }.bind(this),
				data:opts.data
	        }).post();
        }
	},

    // getPageScroll() by quirksmode.com
    getPageScroll: function() {
        var xScroll, yScroll;
        if (self.pageYOffset) {
            yScroll = self.pageYOffset;
            xScroll = self.pageXOffset;
        } else if (document.documentElement && document.documentElement.scrollTop) { // Explorer 6 Strict
            yScroll = document.documentElement.scrollTop;
            xScroll = document.documentElement.scrollLeft;
        } else if (document.body) {// all other Explorers
            yScroll = document.body.scrollTop;
            xScroll = document.body.scrollLeft;	
        }

        return new Array(xScroll,yScroll);
    },

    // adapter from getPageSize() by quirksmode.com
    getPageHeight: function() {
        var windowHeight;
        if (self.innerHeight) {	// all except Explorer
            windowHeight = self.innerHeight;
        } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
            windowHeight = document.documentElement.clientHeight;
        } else if (document.body) { // other Explorers
            windowHeight = document.body.clientHeight;
        }

        return windowHeight;
    }

});

