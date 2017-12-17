/**
 * SLIDER PURN JAVASCRIPT PLUGIN
 */
'use strict';
(function () {
    /**
     * CLASS SLIDER JS
     */
    var SliderJS = /** @class */ (function () {
        function SliderJS(selector) {
            var $sliders = document.querySelectorAll(selector);
            for (var i = 0, len = $sliders.length; i < len; i++) {
                new SliderJSOne($sliders[i]);
            }
        }
        return SliderJS;
    }());
    // Assign Class to Global variable
    window.SliderJS = SliderJS;
    /**
     * CLASS SLIDER JS ONE
     * Ho tro nhieu slider tren cung 1 trang
     */
    var SliderJSOne = /** @class */ (function () {
        function SliderJSOne($slider) {
            /**
             * Easing for Animation
             * Copyright : Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
             */
            this.Easing = {
                // Variable
                // x: percent
                // t: current time (ms)
                // b: beginning value (gia tri 0)
                // c: change in value (gia tri 1)
                // d: duration (ms)
                easeOutQuad: function (x, t, b, c, d) {
                    return -c * (t /= d) * (t - 2) + b;
                }
            };
            // Variable Initial
            this.$viewport = $slider.querySelector('.sliderjs-viewport');
            this.$canvas = $slider.querySelector('.sliderjs-canvas');
            this.$prev = $slider.querySelector('.sliderjs-prev') || document.createElement('div');
            this.$next = $slider.querySelector('.sliderjs-next') || document.createElement('div');
            this.actived = 'sliderjs-actived';
            this.xCanvas = this.xCanvasLast = 0;
            this.isAnimate = false;
            this.duration = $slider.getAttribute('data-duration') || 400;
            // Dieu kien tiep tuc thuc hien
            if (!(this.$viewport.nodeType && this.$canvas.nodeType))
                return false;
            // Find Nodes Slides
            var $slides = $slider.querySelectorAll('.sliderjs-canvas > li');
            if (!$slides.length)
                return false;
            this.$slides = this.ConvertNode($slides);
            this.num = this.$slides.length;
            // Find Nodes Pagination Items
            var $pagItems = $slider.querySelectorAll('.sliderjs-pag > li');
            this.isPag = !!$pagItems.length;
            this.$pagItems = this.ConvertNode($pagItems);
            // Get options width
            var width = $slider.getAttribute('data-width') || '100%';
            this.width = this.ConvertPercent(width, this.$viewport);
            // Mang chua vi tri cac Slides
            this.xMap = [];
            for (var i = 0; i < this.num; i++) {
                this.xMap.push(-i * this.width);
            }
            // Request Animation Frame shortcut
            this.requestAF = window.requestAnimationFrame.bind(window)
                || function (callback) { return window.setTimeout(callback, 1000 / 60).bind(window); };
            this.cancelAF = window.cancelAnimationFrame.bind(window) || window.clearTimeout.bind(window);
            // Ten event touch tuy theo browser ho tro
            var isPointer = !!window.PointerEvent, isMSPointer = !!window.MSPointerEvent, isTouch = !!window.TouchEvent
                || 'ontouchstart' in window
                || (window.DocumentTouch && document instanceof DocumentTouch);
            if (isTouch)
                this.evTouch = { start: 'touchstart', move: 'touchmove', end: 'touchend' };
            else if (isPointer)
                this.evTouch = { start: 'pointerstart', move: 'pointermove', end: 'pointerend' };
            else if (isMSPointer)
                this.evTouch = { start: 'mspointerstart', move: 'mspointermove', end: 'mspointerend' };
            else
                this.evTouch = { start: '', move: '', end: '' };
            // Add Class 'actived' cho Slide dau tien luc ban dau
            var idCur = parseFloat($slider.getAttribute('data-idBegin'), 10) || 0;
            this.goto(idCur, false, true);
            // Dat vi tri cua cac Slides luc ban dau
            this.PositionSlidesAtBegin();
            // Add Event Tap
            this.EventTap();
            this.EventSwipe();
        }
        SliderJSOne.prototype.ConvertNode = function ($nodes) {
            var $nodesNew = [];
            for (var i = 0, len = $nodes.length; i < len; i++) {
                $nodesNew.push($nodes[i]);
            }
            return $nodesNew;
        };
        SliderJSOne.prototype.ConvertPercent = function (str, $nodeSize) {
            var re = /\d+\.?\d*\%/g, match = str.match(re), vConvert, valueCur;
            for (var key in match) {
                vConvert = parseFloat(match[key].replace('%', ''), 10);
                vConvert = $nodeSize.offsetWidth * vConvert / 100;
                str = str.replace(match[key], vConvert);
            }
            return eval(str);
        };
        SliderJSOne.prototype.Find = function ($nodes, selector) {
            var $nodesNew = [];
            for (var i = 0, len = $nodes.length; i < len; i++) {
                var $nodesQuery = $nodes[i].querySelectorAll(selector);
                for (var j = 0, lenJ = $nodesQuery.length; j < lenJ; j++) {
                    $nodesNew.push($nodesQuery[j]);
                }
            }
            return $nodesNew.length ? $nodesNew : null;
        };
        SliderJSOne.prototype.HasClass = function ($node, strClass) {
            var classOnNode = $node.getAttribute('class') || '';
            return (classOnNode.indexOf(strClass) !== -1) ? true : false;
        };
        SliderJSOne.prototype.RemoveWS = function (str) {
            return str.replace(/(^\s+)|(\s+$)/g, '').replace(/(\s\s+)/g, ' ');
        };
        SliderJSOne.prototype.AddClass = function ($nodes, strClass) {
            var arrClass = strClass.split(' ');
            // Convert one node to array
            if (!!$nodes.nodeType)
                $nodes = [$nodes];
            // Loop to get all node in array
            for (var i = 0, len = $nodes.length; i < len; i++) {
                var $nodeCur = $nodes[i];
                var classOnNode = $nodeCur.getAttribute('class') || '';
                for (var key in arrClass) {
                    if (classOnNode.indexOf(arrClass[key]) === -1) {
                        $nodeCur.setAttribute('class', this.RemoveWS(classOnNode + ' ' + arrClass[key]));
                    }
                }
            }
        };
        SliderJSOne.prototype.RemoveClass = function ($nodes, strClass) {
            var arrClass = strClass.split(' ');
            // Convert one node to array
            if (!!$nodes.nodeType)
                $nodes = [$nodes];
            // Loop to get all node in array
            for (var i = 0, len = $nodes.length; i < len; i++) {
                var $nodeCur = $nodes[i];
                var classOnNode = $nodeCur.getAttribute('class') || '';
                // Support remove multi class
                for (var key in arrClass) {
                    if (classOnNode.indexOf(arrClass[key]) !== -1) {
                        classOnNode = this.RemoveWS(classOnNode.replace(arrClass[key], ''));
                        classOnNode === '' ? $nodeCur.removeAttribute('class')
                            : $nodeCur.setAttribute('class', classOnNode);
                    }
                }
            }
        };
        SliderJSOne.prototype.Css = function ($nodes, styles) {
            // Convert to Array
            if (!!$nodes.nodeType)
                $nodes = [$nodes];
            // Loop to get all Element in Array
            for (var i = 0, len = $nodes.length; i < len; i++) {
                var $nodeCur = $nodes[i];
                for (var key in styles) {
                    $nodeCur.style[key] = styles[key];
                }
            }
        };
        SliderJSOne.prototype.PositionSlidesAtBegin = function () {
            for (var i = 0, len = this.$slides.length; i < len; i++) {
                // Set vi tri cua slide hien tai
                this.SetPostion(this.$slides[i], this.width * i);
            }
        };
        // Setup vi tri cua Node theo value
        SliderJSOne.prototype.SetPostion = function ($node, value) {
            // Lam tron gia tri 'value' 0.0
            value = parseFloat(Math.round(value * 10), 10) / 10;
            // Gia tri transform
            var tf = 'translate3D(XXpx, 0, 0)'.replace(/XX/i, value);
            // Di chuyen toi vi tri $target
            this.Css($node, { transform: tf });
        };
        SliderJSOne.prototype.AnimateCanvas = function () {
            // Request Animation Frame
            var requestAnimationFrame = window.requestAnimationFrame
                || function (callback) { return window.setTimeout(callback, 1000 / 60); }, cancelAnimationFrame = window.cancelAnimationFrame
                || clearTimeout;
            // Variable at begin
            var that = this, duration = that.duration, tBegin = +new Date(), tEnd = tBegin + duration, xCanvasLast = that.xCanvasLast, xChange = that.xCanvas - xCanvasLast;
            // Loop Step function
            that.cancelAF(that.request);
            var Step = function () {
                // Lay thoi gian hien tai dang Animation
                var tCur = +new Date() - tBegin;
                if (tCur > duration)
                    tCur = duration;
                // Thiet lap chieu cao theo thoi gian
                var xCur = xCanvasLast + (xChange * that.Easing['easeOutQuad'](null, tCur, 0, 1, duration));
                that.SetPostion(that.$canvas, xCur);
                // Cap nhat vi tri xCanvas
                that.xCanvas = xCur;
                // Loop action  
                that.request = that.requestAF(Step);
                // End Loop
                if (tCur >= that.duration) {
                    that.cancelAF(that.request);
                }
            };
            Step();
        };
        SliderJSOne.prototype.GotoAnimateEnd = function () {
            var that = this;
            var xEnd = that.xMap[that.idCur];
            // Dieu kien tiep tuc tuc hien
            if (that.xCanvas === xEnd)
                return;
            // Dung Request Animation Frame
            that.cancelAF(that.request);
            // Di chuyen Canvas toi vi tri Animate-End
            that.SetPostion(that.$canvas, xEnd);
            // Luu tru vi tri hien tai
            that.xCanvas = xEnd;
        };
        SliderJSOne.prototype.GotoNearSlide = function () {
            var width = this.width, idCur = this.idCur, xNear = this.pageX0 - this.pageX1, xCanvasLast = this.xCanvas - xNear, isNext = xNear >= 0 ? true : false;
            // Khoang cach toi thieu de di chuyen sang Slide moi
            var wMinNear = width / 2;
            // Truong hop thoi gian Swipe ngan(200ms) thi khoang cach ngan hon
            if (this.tEnd - this.tBegin <= 200)
                wMinNear = width / 8;
            // Di chuyen sang Next Slide
            if ((idCur < this.num - 1) && (xNear > 0) && (xNear >= wMinNear)) {
                console.log('#1 next slide');
                this.goto(idCur + 1, true, true);
            }
            else if ((idCur > 0) && (xNear < 0) && (xNear <= -wMinNear)) {
                console.log('#2 prev slide');
                this.goto(idCur - 1, true, true);
            }
            else {
                if (this.xCanvas !== this.xMap[this.idCur]) {
                    console.log('#3 phuc hoi');
                    this.goto(idCur, true, true, xCanvasLast);
                }
            }
        };
        SliderJSOne.prototype.GetEventRight = function (e) {
            var i = e;
            if (/^touch/.test(e.type))
                i = e.changedTouches[0];
            // else if( /pointer/i.test(e.type) ) i = e.originalEvent;
            return i;
        };
        // Event Tap
        SliderJSOne.prototype.EventTap = function () {
            var that = this;
            // Event Tap tren Button Prev
            that.$prev.addEventListener('click', function (e) {
                that.goto(that.idCur - 1, true);
                // PreventDefault
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
            });
            // Event Tap on Button Next
            that.$next.addEventListener('click', function (e) {
                that.goto(that.idCur + 1, true);
                // PreventDefault
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
            });
            var _loop_1 = function (i, len) {
                that.$pagItems[i].addEventListener('click', function (e) {
                    that.goto(i, true);
                    // PreventDefault
                    e.preventDefault ? e.preventDefault() : e.returnValue = false;
                });
            };
            // Event Tap on Pagination Item
            for (var i = 0, len = that.$pagItems.length; i < len; i++) {
                _loop_1(i, len);
            }
        };
        // Event Swipe
        SliderJSOne.prototype.EventSwipe = function () {
            var that = this;
            // Loai bo event 'Drag' tren Viewport
            that.$viewport.addEventListener('dragstart', function (e) { e.returnValue = false; });
            // Event Mouse Start
            that.$viewport.addEventListener('mousedown', MouseDown);
            that.$viewport.addEventListener(that.evTouch.start, MouseDown);
            // Function MouseDown
            function MouseDown(e) {
                // console.log('## mouse down', e.type);
                var i = that.GetEventRight(e);
                that.pageX0 = i.pageX;
                that.pageXLast = null;
                that.tBegin = +new Date();
                // Event Mouse Move
                document.addEventListener('mousemove', MouseMove);
                document.addEventListener(that.evTouch.move, MouseMove, true);
                // Event Mouse End
                document.addEventListener('mouseup', MouseUp);
                document.addEventListener(that.evTouch.end, MouseUp, true);
            }
            // Function MouseMove
            function MouseMove(e) {
                var i = that.GetEventRight(e);
                that.pageXLast = that.pageXLast !== null ? that.pageXLast : that.pageX0;
                var distance = i.pageX - that.pageXLast;
                that.pageXLast = i.pageX;
                // Di chuyen toi vi tri Animate-End khi chua Animate xong
                if (!that.isFirstSwipeMove && Math.abs(distance) > 0) {
                    that.GotoAnimateEnd();
                    // Update bien de ngan chan thuc hien lan nua trong Even Swipe Move
                    that.isFirstSwipeMove = true;
                }
                // Setup di chuyen giam dan o dau va cuoi Slide
                if ((that.idCur == 0 && distance > 0)
                    || (that.idCur == that.num - 1 && distance < 0)) {
                    distance /= 4;
                }
                // // console.log(distance);
                that.xCanvas += distance;
                that.SetPostion(that.$canvas, that.xCanvas);
                // Kiem tra di chuyen sang vi tri Slide ke ben
                var isNearSlide = false;
                if ((that.xCanvas <= that.xMap[that.idCur + 1]) && (that.idCur < that.num - 1)) {
                    that.goto(that.idCur + 1, false);
                    isNearSlide = true;
                }
                else if ((that.xCanvas >= that.xMap[that.idCur - 1]) && (that.idCur > 0)) {
                    that.goto(that.idCur - 1, false);
                    isNearSlide = true;
                }
                if (isNearSlide) {
                    that.pageX0 = i.pageX;
                    that.tBegin = +new Date();
                }
                // Stop scrollbar khi Touch
                if (/(touch)|(pointer)/i.test(e.type)) {
                    // console.log(e.type);
                    // e.preventDefault();
                }
            }
            // Function MouseUp
            function MouseUp(e) {
                var i = that.GetEventRight(e);
                that.pageX1 = i.pageX;
                that.tEnd = +new Date();
                // Thuc hien pageX1 - Di chuyen toi Slide ke ben
                that.GotoNearSlide();
                // Loai bo event MouseMove / MouseUp
                document.removeEventListener('mousemove', MouseMove);
                document.removeEventListener(that.evTouch.move, MouseMove);
                document.removeEventListener('mouseup', MouseUp);
                document.removeEventListener(that.evTouch.end, MouseUp);
                // Reset cac bien
                that.isFirstSwipeMove = false;
                // setTimeout(function() {
                //   document.removeEventListener('touchmove', function(e) { return false });
                // }, 100);
            }
        };
        // Action goto Slide
        SliderJSOne.prototype.goto = function (idNext, isAnimate, isForceActive) {
            var actived = this.actived, 
            // Lenh if ho tro. setup actived Slide voi ID !== 0
            idCur = this.idCur !== undefined ? this.idCur : 0, nSlide = idNext - idCur;
            // Dieu kien thuc hien
            if (!((0 <= idNext && idNext <= this.num - 1 && idNext !== idCur) || isForceActive))
                return;
            // Remove Class 'actived' in all Slides
            this.RemoveClass(this.$slides, actived);
            this.RemoveClass(this.$pagItems, actived);
            // Add Class 'actived' in Slide Next
            this.AddClass(this.$slides[idNext], actived);
            this.AddClass(this.$pagItems[idNext], actived);
            // Cap nhat vi tri cua Canvas
            // console.log('#4', this.xCanvasLast, this.xCanvas);
            this.xCanvasLast = this.xCanvas;
            this.xCanvas = this.xMap[idNext];
            // console.log('#5', this.xCanvasLast, this.xCanvas);
            if (isAnimate) {
                this.AnimateCanvas();
            }
            else {
                this.SetPostion(this.$canvas, this.xCanvas);
            }
            // Cap nhat bien
            this.idCur = idNext;
        };
        SliderJSOne.prototype.next = function () {
            this.goto(this.idCur + 1, true);
        };
        SliderJSOne.prototype.prev = function () {
            this.goto(this.idCur - 1, true);
        };
        return SliderJSOne;
    }());
})();
// Initial Slider
document.addEventListener('DOMContentLoaded', function () {
    var sliders = new SliderJS('.sliderjs');
});
//# sourceMappingURL=slider-js.js.map