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
      this.$slider = $slider;
      this.$viewport = $slider.querySelector('.sliderjs-viewport');
      this.$canvas = $slider.querySelector('.sliderjs-canvas');
      this.$prev = $slider.querySelector('.sliderjs-prev') || document.createElement('div');
      this.$next = $slider.querySelector('.sliderjs-next') || document.createElement('div');
      this.actived = 'sliderjs-actived';
      this.xCanvas = this.xCanvasLast = 0;
      this.isAnimate = false;
      this.duration = $slider.getAttribute('data-duration') || 400;
      this.isCenter = ($slider.getAttribute('data-isCenter') == 'true') ? true : false;

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
      this.wViewport = this.$viewport.offsetWidth;
      this.width = this.ConvertPercent(width, this.$viewport);
      this.margin = parseFloat($slider.getAttribute('data-margin')) || 0;

      // Mang chua vi tri cac Slides
      this.UpdateXMap();

      // Request Animation Frame shortcut
      this.requestAF = window.requestAnimationFrame.bind(window)
                    || function(callback) { return window.setTimeout(callback, 1000/60).bind(window) };
      this.cancelAF = window.cancelAnimationFrame.bind(window) || window.clearTimeout.bind(window);

      // Ten event touch tuy theo browser ho tro
      let isPointer = !!window.PointerEvent,
          isMSPointer = !!window.MSPointerEvent,
          isTouch = !!window.TouchEvent
                  || 'ontouchstart' in window
                  || (window.DocumentTouch && document instanceof DocumentTouch);
      
      if( isTouch )          this.evTouch = { start: 'touchstart', move: 'touchmove', end: 'touchend' };
      else if( isPointer )   this.evTouch = { start: 'pointerstart', move: 'pointermove', end: 'pointerend' };
      else if( isMSPointer ) this.evTouch = { start: 'mspointerstart', move: 'mspointermove', end: 'mspointerend' };
      else                   this.evTouch = { start: '', move: '', end: '' };

      // Them doi tuong Overlay - tren thiet bi iOS
      if( /iPhone|iPad|iPod/i.test(navigator.userAgent) && (typeof window.orientation !== 'undefined') ) {
        this.$overlay = document.createElement('div');
        this.$overlay.setAttribute('class', 'sliderjs-overlay');
        this.$viewport.appendChild(this.$overlay);
      }

      // Add Class 'actived' cho Slide dau tien luc ban dau
      let idCur = parseFloat($slider.getAttribute('data-idBegin'), 10) || 0;
      this.goto(idCur, false, true);

      // Dat kich thuoc & vi tri cua cac Slides luc ban dau
      this.UpdateSizeOnSlides();
      this.UpdatePosOnSlides();

      // Add Event cho cac doi tuong
      this.EventTap();
      this.EventSwipe();
      this.EventResize();
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
    private HasClass($nodes, strClass) {
      // Chi thuc hien voi Node dau tien
      if( !!$nodes.length ) $nodes = $nodes[0];

      // Bien
      let aClassOnNode = ($nodes.getAttribute('class') || '').split(' ');
      let isHas = false;

      for( var key in aClassOnNode ) {
        if( aClassOnNode[key] === strClass ) {
          isHas = true;
        }
      }
      return isHas;
    }
    private RemoveWS(str) {
      return str.replace(/(^\s+)|(\s+$)/g, '').replace(/(\s\s+)/g, ' ');
    }
    private AddClass($nodes, strClass) {
      let arrClass = strClass.split(' ');

      // Dieu kien thuc hien tiep
      if( $nodes === undefined ) return;
      // Convert one node to array
      if( !!$nodes.nodeType ) $nodes = [$nodes];

      // Loop to get all node in array
      for( let i = 0, len = $nodes.length; i < len; i++ ) {
        let $nodeCur = $nodes[i];
        let classOnNode = $nodeCur.getAttribute('class') || '';
        let aClassOnNode = classOnNode.split(' ');
        let isAddClass = false;

        for( let key in arrClass ) {
          if( aClassOnNode.indexOf(arrClass[key]) === -1 ) {
            classOnNode += ' ' + arrClass[key];
            isAddClass = true;
          }
        }

        // Add class on Node
        if( isAddClass ) {
          classOnNode = classOnNode.replace(/(^\s+)|(\s+$)/g, '').replace(/\s\s+/g, ' ');
          $nodeCur.setAttribute('class', classOnNode);
        }
      }
    }
    private RemoveClass($nodes, strClass) {
      let arrClass = strClass.split(' ');

      // Dieu kien thuc hien tiep
      if( $nodes === undefined ) return;
      // Convert one node to array
      if( !!$nodes.nodeType ) $nodes = [$nodes];

      // Loop to get all node in array
      for( let i = 0, len = $nodes.length; i < len; i++ ) {
        let $nodeCur = $nodes[i];
        let classOnNode = $nodeCur.getAttribute('class') || '';
        let aClassOnNode = classOnNode.split(' ');
        let isRemoveClass = false;

        // Support remove multi class
        for( let key in arrClass ) {
          for( let keyA in aClassOnNode ) {
            if( aClassOnNode[keyA] === arrClass[key] ) {
              aClassOnNode.splice(keyA, 1);
              isRemoveClass = true;
            }
          }
        }

        // Remove class from Node
        if( isRemoveClass ) {
          // Remove whitespce
          classOnNode = aClassOnNode.join(' ');
          classOnNode = classOnNode.replace(/(^\s+)|(\s+$)/g, '').replace(/\s\s+/g, ' ');
          classOnNode === '' ? $nodeCur.removeAttribute('class')
                             : $nodeCur.setAttribute('class', classOnNode);
        }
      }
    }
    private CSS($nodes, styles) {
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










    private UpdateXMap() {
      let width = this.width,
          margin = this.margin,
          wViewport = this.$viewport.offsetWidth,
          xMap = [],
          xMaxNormal = -((width + margin) * (this.num - 1)),
          xMax;

      /**
       * CASE: SLIDER CENTER
       */
      if( this.isCenter ) {
        // Khoang cach giua Slide center voi Viewport
        let padding = Math.round((wViewport - width ) / 2);
        xMaxNormal += padding;

        // Cap nhat vi tri cua Slide vao mang[]
        for( let i = 0; i < this.num; i++ ) {
          // Update vi tri vao mang[]
          let xCur = -((width + margin) * i) + padding;
          xMap.push(xCur);
        }
        this.xMap = xMap;
      }


      /**
       * CASE: SLIDER NORMAL
       */
      else {
        // Tim vi tri xMax khi widthSlide < widthViewport
        if( width < wViewport ) {
          xMax = xMaxNormal + (wViewport - width);
        }

        // Cap nhat vi tri cua Slide vao mang[]
        for( let i = 0; i < this.num; i++ ) {
          // Update vi tri vao mang[]
          let xCur = -((width + margin) * i);
          // Co gia tri khong duoc lon hon xMax
          if( xCur < xMax ) xCur = xMax;
          xMap.push(xCur);
        }
        this.xMap = xMap;
      }
    }
    private UpdateSizeOnSlides() {
      for( let i = 0, len = this.$slides.length; i < len; i++ ) {
        
        // Set vi tri cua slide hien tai
        this.CSS(this.$slides[i], { width: this.width + 'px' });
      }
    }
    private UpdatePosOnSlides() {
      for( let i = 0, len = this.$slides.length; i < len; i++ ) {

        // Setup margin
        let margin = (i == 0) ? 0 : this.margin;

        // Set vi tri cua slide hien tai
        this.SetPostion(this.$slides[i], (this.width + margin) * i);
      }
    }
    // Setup vi tri cua Node theo value
    private SetPostion($node, value) {
      // Lam tron gia tri 'value' 0.0
      value = parseFloat(Math.round(value * 10), 10) / 10;
      // Gia tri transform
      let tf = 'translate3D(XXXpx, 0, 0)'.replace(/XXX/i, value);
      // Di chuyen toi vi tri $target
      this.CSS($node, { transform: tf });
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

      // Loop Step function
      that.cancelAF(that.request);
      let Step = function() {
        
        // Lay thoi gian hien tai dang Animation
        let tCur = +new Date() - tBegin;
        if( tCur > duration ) tCur = duration;

        // Thiet lap chieu cao theo thoi gian
        let xCur = xCanvasLast + (xChange * that.Easing['easeOutQuad'](null, tCur, 0, 1, duration));
        that.SetPostion(that.$canvas, xCur);
        // Cap nhat vi tri xCanvas
        that.xCanvas = xCur;

        // Loop action  
        that.request = that.requestAF(Step);

        // End Loop
        if( tCur >= that.duration ) {
          that.cancelAF(that.request);
        }
      };
      Step();
    }
    private GotoAnimateEnd() {
      let that = this;
      let xEnd = that.xMap[that.idCur];

      // Dieu kien tiep tuc tuc hien
      if( that.xCanvas === xEnd ) return;

      // Dung Request Animation Frame
      that.cancelAF(that.request);
      // Di chuyen Canvas toi vi tri Animate-End
      that.SetPostion(that.$canvas, xEnd);
      // Luu tru vi tri hien tai
      that.xCanvas = xEnd;
    }
    private GotoNearSlide() {
      let width = this.width,
          idCur = this.idCur,
          xNear = this.pageX0 - this.pageX1,
          xCanvasLast = this.xCanvas - xNear,
          isNext = xNear >= 0 ? true : false;

      // Khoang cach toi thieu de di chuyen sang Slide moi
      let wMinNear = width / 2;
      // Truong hop thoi gian Swipe ngan(200ms) thi khoang cach ngan hon
      if( this.tEnd - this.tBegin <= 200 ) wMinNear = width / 16;

      // Di chuyen sang Next Slide
      if( (idCur < this.num - 1) && (xNear > 0) && (xNear >= wMinNear) ) {
        // console.log('#1 next slide');
        this.goto(idCur + 1, true, true);
      }

      // Di chuyen sang Previous Slide
      else if( (idCur > 0) && (xNear < 0) && (xNear <= -wMinNear) ) {
        // console.log('#2 prev slide');
        this.goto(idCur - 1, true, true);
      }

      // Phuc hoi lai vi tri cua Slide Cu
      else {
        if( this.xCanvas !== this.xMap[this.idCur] ) {
          // console.log('#3 phuc hoi');
          this.goto(idCur, true, true, xCanvasLast);
        }
      }
    }













    private GetEventRight(e) {
      let i = e;
      if( /^touch/.test(e.type) )        i = e.changedTouches[0];
      // else if( /pointer/i.test(e.type) ) i = e.originalEvent;
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
      that.$viewport.addEventListener('mousedown', MouseDown);
      that.$viewport.addEventListener(that.evTouch.start, MouseDown);

      // Function MouseDown
      function MouseDown(e) {
        // console.log('# mousedown', that.$slider);
        let i = that.GetEventRight(e);
        that.pageX0 = i.pageX;
        that.pageXLast = null;
        that.tBegin = +new Date();

        // Event Mouse Move
        document.addEventListener('mousemove', MouseMove);
        document.addEventListener(that.evTouch.move, MouseMove);
        // Event Mouse End
        document.addEventListener('mouseup', MouseUp);
        document.addEventListener(that.evTouch.end, MouseUp);
      }

      // Function MouseMove
      function MouseMove(e) {
        let i = that.GetEventRight(e);
        that.pageXLast = that.pageXLast !== null ? that.pageXLast : that.pageX0;

        let distance = i.pageX - that.pageXLast;
        that.pageXLast = i.pageX;

        // Di chuyen toi vi tri Animate-End khi chua Animate xong
        if( !that.isFirstSwipeMove && Math.abs(distance) > 0 ) {
          that.GotoAnimateEnd();

          // Stop scrollbar khi Touch
          if( /(touch)|(pointer)/i.test(e.type) ) {
            
            // Setup Slider nhan biet dang touchmove
            that.AddClass(document.body, that.actived);
            that.AddClass(that.$slider, that.actived);

            // Setup vi tri scroll chi giu
            !!that.$overlay && that.$overlay.scrollTo(100000/2, 0);
          }

          // Update bien de ngan chan thuc hien lan nua trong Even Swipe Move
          that.isFirstSwipeMove = true;
        }

        // Setup di chuyen giam dan o dau va cuoi Slide
        if(  (that.idCur == 0 && distance > 0)
          || (that.idCur == that.num-1 && distance < 0) )
        {
          distance /= 4;
        }
        that.xCanvas += distance;
        that.SetPostion(that.$canvas, that.xCanvas);



        // Kiem tra di chuyen sang vi tri Slide ke ben
        let isNearSlide = false
        if( (that.xCanvas <= that.xMap[that.idCur + 1]) && (that.idCur < that.num-1) ) {
          that.goto(that.idCur + 1, false);
          isNearSlide = true;
        }
        else if( (that.xCanvas >= that.xMap[that.idCur - 1]) && (that.idCur > 0) ) {
          that.goto(that.idCur - 1, false);
          isNearSlide = true;
        }
        if( isNearSlide ) {
          that.pageX0 = i.pageX;
          that.tBegin = +new Date();
        }
      }

      // Function MouseUp
      function MouseUp(e) {
        let i = that.GetEventRight(e);
        that.pageX1 = i.pageX;
        that.tEnd = +new Date();

        // Thuc hien pageX1 - Di chuyen toi Slide ke ben
        that.GotoNearSlide();

        // Loai bo event MouseMove / MouseUp
        document.removeEventListener('mousemove', MouseMove);
        document.removeEventListener(that.evTouch.move, MouseMove);
        document.removeEventListener('mouseup', MouseUp);
        document.removeEventListener(that.evTouch.end, MouseUp);

        // Loai bo Stop Scroll
        if( /(touch)|(pointer)/i.test(e.type) ) {
          that.RemoveClass(document.body, that.actived);
          that.RemoveClass(that.$slider, that.actived);
        }

        // Reset cac bien
        that.isFirstSwipeMove = false;
      }
    }
    // Event Resize
    private EventResize() {
      let resize = this.resize.bind(this);
      window.addEventListener('resize', resize);
    }










    // Action goto Slide
    public goto(idNext, isAnimate, isForceActive) {

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
      this.AddClass(this.$slides[idNext], actived);
      this.AddClass(this.$pagItems[idNext], actived);

      // Cap nhat vi tri cua Canvas
      this.xCanvasLast = this.xCanvas;
      this.xCanvas = this.xMap[idNext];

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
    public resize() {
      let that = this;
      
      // Tao timer de tiet kiem CPU
      clearTimeout(that.tResize);
      that.tResize = setTimeout(function() {

        // Dieu kien thuc hien
        let wViewportCur = that.$viewport.offsetWidth;
        if( that.wViewport === wViewportCur ) return;
        
        // Cap nhat cac gia tri cua bien
        that.wViewport = wViewportCur;
        let width = that.$slider.getAttribute('data-width') || '100%';
        that.width = that.ConvertPercent(width, that.$viewport);
        that.UpdateXMap();
        that.UpdatePosOnSlides();
        that.UpdateSizeOnSlides();

        // Di chuyen toi vi tri Slide hien tai
        that.goto(that.idCur, false, true);
      }, 100);
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