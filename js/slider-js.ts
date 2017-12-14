/**
 * SLIDER PURN JAVASCRIPT PLUGIN
 */
'use strict';
(function() {

  /**
   * CLASS SLIDER JS
   */
  class SliderJS {
    constructor(selector) {
      var $sliders = document.querySelectorAll(selector);
      for( let i = 0, len = $sliders.length; i < len; i++ ) {
        new SliderJSOne($sliders[i]);
      }
    }
  }
  // Assign Class to Global variable
  window.SliderJS = SliderJS;


  /**
   * CLASS SLIDER JS ONE
   * Ho tro nhieu slider tren cung 1 trang
   */
  class SliderJSOne {
    constructor($slider) {

      // Variable Initial
      this.$viewport = $slider.querySelector('.sliderjs-viewport');
      this.$canvas = $slider.querySelector('.sliderjs-canvas');
      this.$prev = $slider.querySelector('.sliderjs-prev') || document.createElement('div');
      this.$next = $slider.querySelector('.sliderjs-next') || document.createElement('div');
      this.actived = 'sliderjs-actived';
      this.xCanvas = this.xCanvasLast = 0;
      
      this.duration = $slider.getAttribute('data-duration') || 400;

      // Dieu kien tiep tuc thuc hien
      if( !(this.$viewport.nodeType && this.$canvas.nodeType) ) return false;

      // Find Nodes Slides
      let $slides = $slider.querySelectorAll('.sliderjs-canvas > li');
      if( !$slides.length ) return false;
      this.$slides = this.ConvertNode($slides);
      this.num = this.$slides.length;

      // Find Nodes Pagination Items
      let $pagItems = $slider.querySelectorAll('.sliderjs-pag > li');
      this.isPag = !!$pagItems.length;
      this.$pagItems = this.ConvertNode($pagItems);

      // Get options width
      let width = $slider.getAttribute('data-width') || '100%';
      this.width = this.ConvertPercent(width, this.$viewport);

      // Add Class 'actived' cho Slide dau tien luc ban dau
      let idCur = parseFloat($slider.getAttribute('data-idBegin'), 10) || 0;
      this.goto(idCur, false, true);

      // Mang chua vi tri cac Slides
      this.xMap = [];
      for( let i = 0; i < this.num; i++ ) {
        this.xMap.push(- i * this.width);
      }

      // Dat vi tri cua cac Slides luc ban dau
      this.PositionSlidesAtBegin();

      // Add Event Tap
      this.EventTap();
      this.EventSwipe();
    }

    private ConvertNode($nodes) {
      let $nodesNew = [];
      for( let i = 0, len = $nodes.length; i < len; i++ ) {
        $nodesNew.push($nodes[i]);
      }
      return $nodesNew;
    }
    private ConvertPercent(str, $nodeSize) {
      let re = /\d+\.?\d*\%/g,
          match = str.match(re),
          vConvert, valueCur;

      for( let key in match ) {
        vConvert = parseFloat(match[key].replace('%', ''), 10);
        vConvert = $nodeSize.offsetWidth * vConvert / 100;

        str = str.replace(match[key], vConvert);
      }
      return eval(str);
    }
    private Find($nodes, selector) {
      let $nodesNew = [];
      for( let i = 0, len = $nodes.length; i < len; i++ ) {
        let $nodesQuery = $nodes[i].querySelectorAll(selector);
        
        for( let j = 0, lenJ = $nodesQuery.length; j < lenJ; j++ ) {
          $nodesNew.push($nodesQuery[j]);
        }
      }
      return $nodesNew.length ? $nodesNew : null;
    }
    private HasClass($node, strClass) {
      let classOnNode = $node.getAttribute('class') || '';
      return (classOnNode.indexOf(strClass) !== -1) ? true : false;
    }
    private RemoveWS(str) {
      return str.replace(/(^\s+)|(\s+$)/g, '').replace(/(\s\s+)/g, ' ');
    }
    private AddClass($nodes, strClass) {
      let arrClass = strClass.split(' ');

      // Convert one node to array
      if( !!$nodes.nodeType ) $nodes = [$nodes];

      // Loop to get all node in array
      for( let i = 0, len = $nodes.length; i < len; i++ ) {
        let $nodeCur = $nodes[i];
        let classOnNode = $nodeCur.getAttribute('class') || '';

        for( let key in arrClass ) {
          if( classOnNode.indexOf(arrClass[key]) === -1 ) {
            $nodeCur.setAttribute('class', this.RemoveWS(classOnNode +' '+ arrClass[key]) );
          }
        }
      }
    }
    private RemoveClass($nodes, strClass) {
      let arrClass = strClass.split(' ');

      // Convert one node to array
      if( !!$nodes.nodeType ) $nodes = [$nodes];

      // Loop to get all node in array
      for( let i = 0, len = $nodes.length; i < len; i++ ) {
        let $nodeCur = $nodes[i];
        let classOnNode = $nodeCur.getAttribute('class') || '';

        // Support remove multi class
        for( let key in arrClass ) {
          if( classOnNode.indexOf(arrClass[key]) !== -1 ) {
            classOnNode = this.RemoveWS(classOnNode.replace(arrClass[key], ''));
            classOnNode === '' ? $nodeCur.removeAttribute('class')
                               : $nodeCur.setAttribute('class', classOnNode);
          }
        }
      }
    }
    private Css($nodes, styles) {
      // Convert to Array
      if( !!$nodes.nodeType ) $nodes = [$nodes];

      // Loop to get all Element in Array
      for( let i = 0, len = $nodes.length; i < len; i++ ) {
        let $nodeCur = $nodes[i];
        for( let key in styles ) {
          $nodeCur.style[key] = styles[key];
        }
      }
    }



    private PositionSlidesAtBegin() {
      for( let i = 0, len = this.$slides.length; i < len; i++ ) {
        
        // Set vi tri cua slide hien tai
        this.SetPostion(this.$slides[i], this.width * i);
      }
    }    
    // Setup vi tri cua Node theo value
    private SetPostion($node, value) {
      let tf = 'translate3D(XXpx, 0, 0)'.replace(/XX/i, value);
      this.Css($node, { transform: tf });
    }
    private AnimateCanvas() {
      // Request Animation Frame
      let requestAnimationFrame = window.requestAnimationFrame
                                || function(callback) { return window.setTimeout(callback, 1000/60) },
          cancelAnimationFrame = window.cancelAnimationFrame
                                || clearTimeout;
      // Variable at begin
      let that = this,
          duration = that.duration,
          tBegin = +new Date(),
          tEnd = tBegin + duration,
          xCanvasLast = that.xCanvasLast,
          xChange = that.xCanvas - xCanvasLast;
          console.log(that.xCanvasLast, that.xCanvas);

      // Loop Step function
      cancelAnimationFrame(that.request);
      let Step = function() {
        
        // Lay thoi gian hien tai dang Animation
        let tCur = +new Date() - tBegin;
        if( tCur > duration ) tCur = duration;

        // Thiet lap chieu cao theo thoi gian
        let xCur = xCanvasLast + (xChange * that.Easing['easeOutQuad'](null, tCur, 0, 1, duration));
        that.SetPostion(that.$canvas, xCur);
        // Cap nhat vi tri xCanvas
        // that.xCanvasLast = that.xCanvas;
        // that.xCanvas = xCur;

        // Loop action  
        that.request = requestAnimationFrame(Step);

        // End Loop
        if( tCur >= that.duration ) {
          cancelAnimationFrame(that.request);
        }
      };
      Step();
    }
    private GotoNearSlide() {
      let width = this.width,
          idCur = this.idCur,
          xBuffer = this.pageX0 - this.pageX1,
          xCanvasLast = this.xCanvas - xBuffer,
          isNext = xBuffer >= 0 ? true : false;

      // Di chuyen sang Next Slide
      if( (idCur < this.num - 1) && (xBuffer > 0) && (xBuffer >= width / 2) ) {
        this.goto(idCur + 1, true, true, xCanvasLast);
      }

      // Di chuyen sang Previous Slide
      else if( (idCur > 0) && (xBuffer < 0) && (xBuffer <= - width / 2) ) {
        this.goto(idCur - 1, true, true, xCanvasLast);
      }

      // Phuc hoi lai vi tri cua Slide Cu
      else {
        this.goto(idCur, true, true, xCanvasLast);
      }
    }



    private GetEventRight(e) {
      let i = e;
      if( /^touch/.test(e.type) )        i = e.originalEvent.touches[0];
      else if( /pointer/i.test(e.type) ) i = e.originalEvent;
      return i;
    },

    // Event Tap
    private EventTap() {
      let that = this;

      // Event Tap tren Button Prev
      that.$prev.addEventListener('click', function(e) {
        that.goto(that.idCur - 1, true);
        // PreventDefault
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
      });

      // Event Tap on Button Next
      that.$next.addEventListener('click', function(e) {
        that.goto(that.idCur + 1, true);
        // PreventDefault
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
      });

      // Event Tap on Pagination Item
      for(let i = 0, len = that.$pagItems.length; i < len; i++ ) {
        that.$pagItems[i].addEventListener('click', function(e) {
          that.goto(i, true);

          // PreventDefault
          e.preventDefault ? e.preventDefault() : e.returnValue = false;
        });
      }
    }

    // Event Swipe
    private EventSwipe() {
      let that = this;

      // Loai bo event 'Drag' tren Viewport
      that.$viewport.addEventListener('dragstart', function(e) { e.returnValue = false });

      // Event Mouse Start
      that.$viewport.addEventListener('mousedown', function(e) {

        var i = that.GetEventRight(e);
        that.pageX0 = i.pageX;

        // Event Mouse Move`
        document.addEventListener('mousemove', MouseMove);
        // Event Mouse End`
        document.addEventListener('mouseup', MouseUp);
      });

      // Function MouseMove
      function MouseMove(e) {
        let i = that.GetEventRight(e),
            pageX = i.pageX,
            xCanvasNext = that.xCanvas - that.width,
            xCanvasPrev = that.xCanvas + that.width,
            xCanvasCur = that.xCanvas + (pageX - that.pageX0);

        that.SetPostion(that.$canvas, xCanvasCur);

        // Kiem tra di chuyen sang vi tri Slide ke ben
        if( xCanvasCur <= xCanvasNext ) {
          that.goto(that.idCur + 1, false);
          that.pageX0 = pageX;
        }
        else if( xCanvasPrev <= xCanvasCur ) {
          that.goto(that.idCur - 1, false);
          that.pageX0 = pageX;
        }
      }

      // Function MouseUp
      function MouseUp(e) {
        let i = that.GetEventRight(e);
        that.pageX1 = i.pageX;

        // Thuc hien pageX1 - Di chuyen toi Slide ke ben
        that.GotoNearSlide();

        // Loai bo event MouseMove / MouseUp
        document.removeEventListener('mousemove', MouseMove);
        document.removeEventListener('mouseup', MouseUp);
      }
    }

    // Action goto Slide
    public goto(idNext, isAnimate, isForceActive, xCanvasLast) {
      console.log(idNext);

      let actived = this.actived,
          // Lenh if ho tro. setup actived Slide voi ID !== 0
          idCur  = this.idCur !== undefined ? this.idCur : 0,
          nSlide = idNext - idCur;

      // Dieu kien thuc hien
      if( !((0 <= idNext && idNext <= this.num - 1 && idNext !== idCur) || isForceActive) ) return;

      // Remove Class 'actived' in all Slides
      this.RemoveClass(this.$slides, actived);
      this.RemoveClass(this.$pagItems, actived);
      // Add Class 'actived' in Slide Next
      console.log(idNext);
      this.AddClass(this.$slides[idNext], actived);
      this.AddClass(this.$pagItems[idNext], actived);

      // Cap nhat vi tri cua Canvas
      this.xCanvasLast = xCanvasLast !== undefined ? xCanvasLast : this.xCanvas;
      this.xCanvas -= this.width * nSlide;

      if( isAnimate ) {
        this.AnimateCanvas();
      }
      else {
        this.SetPostion(this.$canvas, this.xCanvas);
      }
      

      // Cap nhat bien
      this.idCur = idNext;
    }
    public next() {
      this.goto(this.idCur + 1, true);
    }
    public prev() {
      this.goto(this.idCur - 1, true);
    }

    /**
     * Easing for Animation
     * Copyright : Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
     */
    private Easing = {
      // Variable
      // x: percent
      // t: current time (ms)
      // b: beginning value (gia tri 0)
      // c: change in value (gia tri 1)
      // d: duration (ms)
      easeOutQuad: function (x, t, b, c, d) {
        return -c *(t/=d)*(t-2) + b;
      }
    }
  }
})();


// Initial Slider
document.addEventListener('DOMContentLoaded', function() {
  let sliders = new SliderJS('.sliderjs');
});