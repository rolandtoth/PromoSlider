/*!
 * PromoSlider v1.0 - JavaScript Image Slider
 * https://github.com/rolandtoth/promoSlider
 * last update: 2014.07.28.
 *
 * Licensed under the MIT license
 * Copyright 2014 Roland Toth (tpr)
 *
 */

/*global window, document */
/*jslint browser: true */
/*jslint sloppy: true */

var supportsTransitions = (function () {
    var s = document.createElement('p').style,
        v = ['ms', 'O', 'Moz', 'Webkit'];

    if (s.transition === '') {
        return true;
    }

    while (v.length) {
        if (document.addEventListener && s.hasOwnProperty(v.pop() + 'Transition')) {
            return true;
        }
    }

    return false;
}());

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, start) {
        var i = (start || 0),
            j = this.length;

        for (i; i < j; i = i + 1) {
            if (this[i] === obj) {
                return i;
            }
        }
        return -1;
    };
}

function getUrlOptions(obj) {

    var vars, pair, key, value, i,
        query = window.location.search.substring(1);

    vars = query.split("&");

    for (i = 0; i < vars.length; i = i + 1) {

        pair = vars[i].split("=");

        key = pair[0];
        value = pair[1];

        if (value && obj.hasOwnProperty(key)) {

            value = value === 'true' ? true : value;
            value = value === 'false' ? false : value;

            obj[key] = value;
        }
    }
}

function prefixer(rule, extraPrefix) {
    extraPrefix = extraPrefix || '';
    return ' ' + extraPrefix + rule + ' ' + extraPrefix + '-webkit-' + rule + ' ';
}

function opacity(value, important) {
    important = important ? ' !important' : '';
    return ' opacity:' + value / 100 + important + '; -ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=' + value + important + ')"; filter:alpha(opacity=' + value + important + '); ';
}

function verticalCenter() {

    var result = '', i;

    if (arguments.length) {

        for (i = 0; i < arguments.length; i = i + 1) {
            result += arguments[i] + ':before {content: ""; display: inline-block; height: 100%; vertical-align: middle;}';
        }

        return result;
    }

}

var cookie = {

    createCookie: function (name, value, days) {

        var expires = '', date;

        if (days && days !== 'session') {
            date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toGMTString();
        }

        document.cookie = name + '=' + value + expires + '; path=/;';
    },

    readCookie: function (name) {

        var i, c,
            nameEQ = name + '=',
            ca = document.cookie.split(';');

        for (i = 0; i < ca.length; i += 1) {
            c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }

        return null;
    },

    eraseCookie: function (name) {
        this.createCookie(name, '', -1);
    }
};

function addEvent(target, type, handler) {
    if (target.addEventListener) {
        target.addEventListener(type, handler, false);
    } else {
        target.attachEvent('on' + type, function (e) {
            return handler.call(target, e);
        });
    }
}

function removeEvent(target, type, handler) {
    if (target.removeEventListener) {
        target.removeEventListener(type, handler, false);
    }
    if (target.detachEvent) {
        target.detachEvent('on' + type, handler);
    }
}

function addClass(target, className, replace) {

    var elem = document.querySelector(target);

    if (elem) {
        if (replace) {
            elem.className = className;
        } else {
            elem.className += ' ' + className;
        }
    }
}

function makeElement(tag, properties, text) {

    var obj = document.createElement(tag), i;

    for (i in properties) {
        if (properties.hasOwnProperty(i)) {
            if (properties[i]) {
                obj.setAttribute(i, properties[i]);
            }
        }
    }

    if (text) {
        obj.innerHTML = text;
    }

    return obj;
}

function callCallBack(callback, event, obj, slide) {

    var e = event || window.event;
    slide = slide || null;
    obj = obj || null;

    if (typeof callback === 'function') {
        callback(e, obj, slide + 1);
    }
}

function loadSprite(src, callback) {
    var sprite = new Image();
    sprite.onload = callback;
    sprite.src = src;
}

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

function findInArray(search, where) {

    var i;

    if (!search) {
        return false;
    }

    if (isArray(search) && search.length === 0) {
        return false;
    }

    search = (typeof search === 'string') ? [search] : search;

    for (i = 0; i < search.length; i = i + 1) {
        if (where.indexOf(search[i]) !== -1) {
            return true;
        }
    }

    return false;
}

function shuffleArray(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function preventDefault(e) {

    if (e) {
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
    }
}

function checkRandomSeed(rate) {
    var seed = Math.floor(Math.random() * (1 / rate));
    return seed === 0;
}

function PromoSlider(o) {

    var autoCloseID, interstitialCloseID, autoPlayID,
        head = document.getElementsByTagName('head')[0],
        body = document.body,
        currentUrl = window.location.href,
        s = this;

    s.getSlide = function (index) {
        var slideIndex = (index < 0) ? s.promo.slides.childNodes.length + index : index;
        return s.promo.slides.childNodes[slideIndex];
    };

    s.addStyles = function () {

        var styles, mainPadding = '48px';

        if (!o.styles) {
            return false;
        }

        styles = [
            '#promoContainer a {background: transparent;}',
            '#promoContainer {' + opacity(0) + 'position: fixed; width: 100%; height: 100%; text-align: center; top: 0; left: 0; z-index: 9991; pointer-events: none;}',
            '#promoContainer * {color: #fff; text-decoration: none;}',
            '#promoOverlay {position: fixed; width: 100%; height: 100%; top: 0; left: 0; z-index: 9990; background: #000;' + opacity(70) + 'pointer-events: all;}',
            '#promoContent {position: relative; display: block; max-width: ' + o.width + '; max-height: ' + o.height + '; z-index: 9992; pointer-events: all; margin: 0 auto; top: 12%;}',
            '#promoContent:after {content: ""; display: block; padding-top: ' + o.ratio * 100 + '%;}',
            '#promoSlidesWrap {height: 100%; top: 0; bottom: 0; right: 0; left: 0; overflow: hidden; position: absolute;}',
            '#promoSlides {list-style: none; margin: 0; padding: 0; width: 100%; height: 100%; position: relative;}',
            '.embed #promoSlidesWrap {max-width: none; height: 100%;}',
            '#promoContent.embed * {color: #000;}',
            '#promoContent.embed .promoCaption {color: #fff;}',
            '#promoContent.embed {margin: ' + mainPadding + '; clear: both; position: relative; top: ' + mainPadding + '; left: auto; right: auto; bottom: auto;}',
            '.promoSlide {width: 100%; height: 100%; display: block; position: relative; text-align: center;}',
            '.slideContent {height: 100%; overflow: hidden;}',
            '.slideContentInner {width: auto; height: auto; display: inline-block; max-width: 100%; max-height: 100%; position: relative;}',
            '.promoImage, .promoLink {position: relative; display: inline-block; max-width: 100%; max-height: 100%; margin: 0 auto;}',
            '.embed .promoLink[href="#close"] {cursor: default;}',
            '.promoImage {vertical-align: middle;}',
            verticalCenter('.slideContent'),
            '#promoClose {position: absolute; top: -' + mainPadding + '; right: -16px; display: block; text-align: right; padding: 0 16px; z-index: 9992; font: normal 17px/' + mainPadding + ' sans-serif;' + opacity(75) + 'transition: 0.25s opacity; z-index: 9998;}',
            '#promoContent:hover #promoClose:hover {' + opacity(99) + 'cursor: pointer;}',
            '#promoCounter {position: absolute; top: -' + mainPadding + '; left: 0; margin: 0; z-index: 9997; font: normal 17px/' + mainPadding + ' sans-serif; display: inline-block;' + opacity(99) + '}',
            '.promoHidden {' + opacity(0, true) + 'pointer-events: none !important;}',
            '.promoCaption {width: 100%; box-sizing: border-box; position: absolute; bottom: 0; padding: 20px 24px; margin: 0; background: rgba(0,0,0,0.5); line-height: 1.5;}'
        ].join('');

        if (o.captionPosition === 'top') {
            styles += '.promoCaption {top: 0; bottom: auto;}';
        }

        if (!supportsTransitions) {
            styles += '#promoContainer {' + opacity(100) + '}';
        }

        if (!document.addEventListener) {
            styles += [
                '.slideContentInner {width: 100%; height: 100%; position: absolute; left: 0;}',
                '.#promoContainer {' + opacity(100) + '}',
                '.promoSlide * {' + opacity(100) + '}',
                '.promoLink {display: block;}'
            ].join('');
        }

        if (!o.noActionButtons) {
            styles += [
                '#actionButtons {width: 100%; position: absolute; top: 100%; padding: 8px 0 0; text-align: center; z-index: 9997;}',
                '#actionButtons a {display: inline-block; text-decoration: underline; padding: 4px 8px; margin: 0 5px;}'
            ].join('');
        }

        if (o.fitContent === 'stretch') {
            styles += '.promoLink, .promoImage, .slideContentInner {width: 100% !important; height: 100% !important;}';
        }

        if (o.interstitialDuration) {
            styles += [
                '#promoContainer * {color: #000;}',
                '#promoOverlay {background: #fff;' + opacity(99) + '}',
                '#interstitialText {z-index: 9996; position: fixed; top: 0; left: 0; width: 100%; pointer-events: all;}',
                '#interstitialSkipText {text-decoration: underline;}'
            ].join('');
        }

        styles += [
            '#promoContent.fullscreen {width: 100%;}',
            '.fullscreen #promoSlidesWrap, #promoContent.fullscreen {top: 0; left: 0; right: 0;}',
            '.fullscreen, #promoContent.fullscreen #promoSlidesWrap {margin: 0; padding: 0; height: 100%; max-width: 100%; max-height: 100%;}',
            '.fullscreen .promoImage, #promoContent.fullscreen .promoLink {display: block; height: 100%; width: auto; max-width: initial;}',
            '.fullscreen .promoLink {display: block; width: 100%;}',
            '.fullscreen .slideContentInner {width: auto; height: 100%;}',
            '.fullscreen #actionButtons {margin: 0; position: absolute; bottom: ' + mainPadding + '; top: auto;}',
            '.fullscreen #promoPrev, #promoContent.fullscreen #promoNext {width: 120px;}',
            '.fullscreen #promoPrev {left: 0;}',
            '.fullscreen #promoNext {right: 0;}',
            '.fullscreen #promoClose {right: ' + mainPadding + '; top: 3%;}',
            '.fullscreen #promoCounter {left: ' + mainPadding + '; top: 3%;}',
            '.fullscreen #promoPager {top: 3%;}'
        ].join('#promoContent');

        if (o.closeButtonOnHover) {
            styles += [
                '#promoClose { ' + opacity(0) + ' }',
                '#promoContent:hover #promoClose { ' + opacity(75) + ' }'
            ].join('');
        }

        if (o.slider) {
            styles += [
                '#promoSlides {width: 400%; left: -100%;}',
                '#promoNext, #promoPrev {position: absolute; top: 0; left: -' + mainPadding + '; width: ' + mainPadding + '; padding: 0; text-align: center; height: 100%; display: inline-block;' + opacity(50) + prefixer('transition: opacity 0.25s;') + 'z-index: 9997;}',
                '#promoNext {left: auto; right: -' + mainPadding + ';}',
                '#promoNext span, #promoPrev span {font: normal 64px/0 sans-serif; display: inline-block; position: absolute; left: 0; top: 48.7%; width: 100%;}',
                '#promoContent:hover #promoNext:hover, #promoContent:hover #promoPrev:hover {' + opacity(99) + '}',
                '.promoSlide {width: 100%; float: left;' + prefixer('transition: width ' + o.slideDuration + 's ' + o.easing + ';') + '}',
                '.promoSlide:first-child {overflow: hidden; width: 1px; visibility: hidden; margin-left: -1px;}',
                '.promoSlide:first-child + .promoSlide, .promoSlide:first-child + .promoSlide + .promoSlide, .promoSlide:first-child + .promoSlide + .promoSlide + .promoSlide {width: 25%;' + opacity(99) + '}',
                '#promoPager {position: absolute; top: -' + mainPadding + '; left: 20%; width: 60%; text-align: center; z-index: 9997;}',
                '#promoPager a {display: inline-block; position: relative; padding: 0 6px; margin: 0;' + opacity(50) + 'font: normal 36px/' + mainPadding + ' sans-serif;' + prefixer('transition: opacity ' + o.slideDuration + 's ease-out;') + '-webkit-transform: translateZ(0);}',
                '#promoPager a.active, #promoPager a.active:hover, #promoPager a:hover {' + opacity(99) + prefixer('transition-duration: 0.5s;)') + '}',
                '#promoPager.thumbs a {padding: 0; font: normal 32px/' + mainPadding + ' sans-serif; top: -4px;}',
                '#promoPager a img {width: auto; height: 32px;}',
                '.seekAnim .promoSlide {' + prefixer('transform-origin: center;') + prefixer('transition-timing-function: linear;') + prefixer('transition-duration: ' + o.seekAnimSpeed + 's;') + '}'
            ].join('');

            if (o.vertical) {
                styles += [
                    '#promoSlides {width: 100%; left: 0; height: 400%; top: 0;}',
                    '.promoSlide {top: -25%; width: 100%; float: none; height: auto;' + prefixer('transition-property: height;') + prefixer('transform-origin: center;') + '}',
                    '.promoSlide:first-child {width: 100%; height: 0;}',
                    '.slideContent {width: 100%; display: inline-block; position: relative;}',
                    '.promoLink {width: 100%;}',
                    '.promoSlide:first-child + .promoSlide, .promoSlide:first-child + .promoSlide + .promoSlide, .promoSlide:first-child + .promoSlide + .promoSlide + .promoSlide {width: 100%; left: 0; height: 25%;}'
                ].join('');
            }

            if (o.effect !== 'fade') {
                styles += '.promoSlide:first-child + .promoSlide + .promoSlide {' + prefixer('transition: none;') + '}';
            }

            if (o.pager === 'numeric') {
                styles += '#promoPager a {font: normal 17px/' + mainPadding + ' sans-serif; position: relative; padding-top: 0; padding-bottom: 0;}';
            }

            if (o.navArrowsPosition === 'inside') {
                styles += [
                    '#promoNext {right: 0;}',
                    '#promoPrev {left: 0;}'
                ].join('');
            }

            if (o.effect === 'fade') {
                styles += [
                    '#promoSlides {left: 0;}',
                    '.promoSlide {z-index: 94;' + opacity(0) + prefixer('transition-property: opacity;') + '}',
                    '.promoSlide:first-child {left: 25%;' + prefixer('transition: none;') + '}',
                    '.promoSlide:first-child + .promoSlide {' + opacity(0) + '}',
                    '.promoSlide:first-child + .promoSlide + .promoSlide {z-index: 97; left: -25%;' + opacity(99) + '}',
                    '.promoSlide:first-child + .promoSlide + .promoSlide + .promoSlide {left: -50%;' + opacity(0) + '}'
                ].join('');
            }

            if (o.navArrowsOnHover) {
                styles += [
                    '#promoNext, #promoPrev { ' + opacity(0) + ' }',
                    '#promoContent:hover #promoNext, #promoContent:hover #promoPrev { ' + opacity(50) + ' }'
                ].join('');
            }

            if (o.pagerOnHover) {
                styles += [
                    '#promoPager { ' + opacity(0) + prefixer('transition: opacity 0.25s;') + ' }',
                    '#promoContent:hover #promoPager { ' + opacity(99) + ' }'
                ].join('');
            }
        }

        if (o.pagerPosition === 'bottom') {
            styles += '#promoPager {top: auto; bottom: -' + mainPadding + ';}';

            if (!o.noActionButtons && o.actionButtons) {
                styles += '#actionButtons {margin-top: ' + mainPadding + ';}';
            }
        }

        if (o.fadeInDuration > 0) {
            styles += [
                prefixer('keyframes promoFadeIn {from {opacity: 0} to {opacity: 1}}', '@'),
                '#promoContainer {' + prefixer('animation: promoFadeIn ' + o.fadeInDuration + 's ease-in 0.2s 1 forwards;') + '}'
            ].join('');
        } else {
            styles += '#promoContainer {' + opacity(99) + ' }';
        }

        if (o.fadeOutDuration > 0) {
            styles += [
                prefixer('keyframes promoFadeOut {from {opacity: 1} to {opacity: 0}}', '@'),
                '#promoContainer.fadeOut {' + prefixer('animation: promoFadeOut ' + o.fadeOutDuration + 's ease-out;') + '}'
            ].join('');
        }

        if (!o.showScrollbar) {
            styles += 'html {overflow: hidden !important;}';
            if (window.innerHeight < body.scrollHeight) {
                styles += 'body {width: ' + body.offsetWidth + 'px;}';
            }
        }

        s.styles = makeElement('style', {id: 'promoStyle', type: 'text/css'});

        if (s.styles.styleSheet) {
            s.styles.styleSheet.cssText = styles;
        } else {
            s.styles.appendChild(document.createTextNode(styles));
        }

        if (head.firstChild) {
            head.insertBefore(s.styles, head.firstChild);
        } else {
            head.appendChild(s.styles);
        }
    };

    s.init = function () {

        var forceOnUrl, deleteCookie, showOnUrl, hideOnUrl,
            currentDateEpoch = Math.round(new Date().getTime() / 1000);

        o.actionButtons = o.actionButtons || null;
        o.activeSlide = o.activeSlide || 1;
        o.appendTo = o.appendTo || null;
        o.autoCloseSeconds = o.autoCloseSeconds || null;
        o.autoPlay = o.autoPlay || null;
        o.autoPlayDirection = o.autoPlayDirection || null;
        o.customClass = o.customClass || 'promoSlider';
        o.close = o.close || 'top-right';
        o.closeButtonOnHover = o.closeButtonOnHover || null;
        o.closeButtonText = o.closeButtonText || '×';
        o.captionPosition = o.captionPosition || '×';
        o.fullscreen = o.fullscreen || null;
        o.counter = o.counter || null;
        o.deleteCookieOnUrl = o.deleteCookieOnUrl || null;
        o.easing = o.easing || 'ease-in-out';
        o.effect = o.effect || null;
        o.endDate = o.endDate || null;
        o.fadeInDuration = o.fadeInDuration || 0;
        o.fadeOutDuration = o.fadeOutDuration || 0;
        o.firstSlide = o.firstSlide || 1;
        o.fitContent = o.fitContent || null;
        o.forceOnUrl = o.forceOnUrl || null;
        o.frequency = o.frequency || null;
        o.height = o.height || null;
        o.hideOnUrl = o.hideOnUrl || null;
        o.interstitialDuration = o.interstitialDuration || null;
        o.interstitialSkipText = o.interstitialSkipText || 'Skip this ad';
        o.interstitialText = o.interstitialText || 'or wait %s seconds';
        o.loadDelay = o.loadDelay || null;
        o.maxSlides = o.maxSlides || null;
        o.navArrowsOnHover = o.navArrowsOnHover || null;
        o.navArrowsPosition = o.navArrowsPosition || null;
        o.noActionButtons = o.noActionButtons || null;
        o.noCloseOnClick = o.noCloseOnClick || false;
        o.infinite = o.infinite || true;
        o.noKeyClose = o.noKeyClose || null;
        o.disableNavArrows = o.disableNavArrows || null;
        o.overlay = o.overlay || true;
        o.modal = o.modal || true;
        o.pager = o.pager || true;
        o.noPauseOnHover = o.noPauseOnHover || null;
        o.noSlider = o.noSlider || null;
        o.disableKeyNav = o.disableKeyNav || null;
        o.styles = o.styles || true;
        o.onPromoClick = o.onPromoClick || null;
        o.onPromoClose = o.onPromoClose || null;
        o.onPromoStart = o.onPromoStart || null;
        o.pagerOnHover = o.pagerOnHover || null;
        o.pagerPosition = o.pagerPosition || null;
        o.randomize = o.randomize || false;
        o.reverseKeyNav = o.reverseKeyNav || false;
        o.rewindOnEnd = o.rewindOnEnd || null;
        o.root = o.root || '';
        o.running = null;
        o.showOnUrl = o.showOnUrl || null;
        o.showProbability = o.showProbability || 1;
        o.showScrollbar = o.showScrollbar || false;
        o.slideDuration = o.slideDuration || 1;
        o.slides = o.slides || null;
        o.startDate = o.startDate || null;
        o.frequencyID = o.frequencyID || 'promoSlider';
        o.vertical = o.vertical || null;
        o.waitAnimationFinish = o.waitAnimationFinish || null;
        o.width = o.width || null;
        o.state = 'lightbox';

        if (!o.slides) {
            return false;
        }

        getUrlOptions(o);

        forceOnUrl = !!o.forceOnUrl && findInArray(o.forceOnUrl, currentUrl);
        deleteCookie = !!o.deleteCookieOnUrl && findInArray(o.deleteCookieOnUrl, currentUrl);

        showOnUrl = (function (obj) {
            if (!obj || (isArray(obj) && !obj.length)) {
                return false;
            }
            if (!!obj && !findInArray(obj, currentUrl)) {
                return true;
            }
        }(o.showOnUrl));

        hideOnUrl = !!o.hideOnUrl && findInArray(o.hideOnUrl, currentUrl);

        if (!forceOnUrl) {

            if (o.showProbability < 1 && !checkRandomSeed(o.showProbability)) {
                return false;
            }

            if (o.startDate) {
                if (currentDateEpoch < Math.round(new Date(o.startDate).getTime() / 1000)) {
                    return false;
                }
            }

            if (o.endDate) {
                if (currentDateEpoch > Math.round(new Date(o.endDate).getTime() / 1000)) {
                    return false;
                }
            }

            if (deleteCookie) {
                cookie.eraseCookie(o.frequencyID);
            }

            if (showOnUrl) {
                return false;
            }

            if (hideOnUrl) {
                return false;
            }

            if (o.frequency) {
                if (cookie.readCookie(o.frequencyID)) {
                    return false;
                }
                if (!deleteCookie) {
                    cookie.createCookie(o.frequencyID, '1', o.frequency);
                }
            }
        }

        if (!findInArray(o.easing, ['linear', 'ease-in', 'ease-in-out'])) {
            o.easing = 'ease-in-out';
        }

        if (!isArray(o.slides)) {
            o.slides = [o.slides];
        }

        if (o.autoPlay && (isNaN(o.autoPlay) || o.autoPlay <= 0)) {
            o.autoPlay = null;
        }

        if (o.effect === 'fade') {
            o.vertical = null;
        }

        if (o.randomize) {
            o.slides = shuffleArray(o.slides);
        }

        if (!o.noSlider && o.slides.length > 1) {
            s.initSlider();
        }

        if (deleteCookie) {
            cookie.eraseCookie(o.frequencyID);
        }

        if (o.interstitialDuration) {
            o.interstitialDuration = o.interstitialDuration > 0 ? o.interstitialDuration : 30;
            o.overlay = true;
            o.modal = true;
            o.close = false;
            o.closeButtonText = null;
            o.autoCloseSeconds = o.interstitialDuration;
            o.state = 'interstitial';

        } else if (o.appendTo) {

            if (!document.getElementById(o.appendTo)) {
                return false;
            }

            o.appendTo = document.getElementById(o.appendTo);
            o.showScrollbar = true;
            o.autoCloseSeconds = null;
            o.interstitialDuration = null;
            o.fullscreen = null;
            o.state = 'embed';

        } else if (o.fullscreen) {
            o.state = 'fullscreen';
        }

        return true;
    };

    s.initSlider = function () {

        var i;

        o.maxSlides = parseInt(o.maxSlides, 10);
        o.activeSlide = parseInt(o.activeSlide, 10);
        o.firstSlide = parseInt(o.firstSlide, 10);

        o.slideNum = o.slides.length;

        if (o.firstSlide > 1 && o.firstSlide <= o.slideNum) {
            for (i = 1; i < o.firstSlide; i = i + 1) {
                o.slides.push(o.slides.shift());
            }
        }

        if (o.maxSlides && o.maxSlides > 0) {

            if (o.maxSlides < o.slides.length) {
                o.slides.length = o.maxSlides;
                o.slideNum = o.slides.length;
            }
        }

        if (o.activeSlide > o.slideNum) {
            o.activeSlide = 1;
        }

        o.activeSlide = o.activeSlide - 1;

        if (o.slideNum > 1) {
            o.slider = true;
        } else {
            return false;
        }

        if (o.slideNum < 4) {
            for (i = 0; i < o.slideNum; i = i + 1) {
                o.slides.push(o.slides[i]);
            }
        }

        o.slides.unshift(o.slides.pop());
        o.slides.unshift(o.slides.pop());

        o.seekAnimSpeed = o.slideDuration / o.slideNum * 3 / 2;

        o.current = 0;
    };

    s.buildPromo = function () {

        var slideContent, slideContentInner, promoSlide, promoImage, promoLink, promoCaption, psImg, psLnk, psTgt, psCaption, pager, pagerContent, i;

        s.promo = {
            overlay: makeElement('div', {id: 'promoOverlay'}),
            container: makeElement('div', {id: 'promoContainer'}),
            content: makeElement('div', {id: 'promoContent'}),
            slidesWrap: makeElement('div', {id: 'promoSlidesWrap'}),
            slides: makeElement('ul', {id: 'promoSlides'}),
            close: makeElement('a', {id: 'promoClose', href: '#'}, o.closeButtonText),
            buttons: makeElement('div', {id: 'actionButtons'})
        };

        if (o.interstitialDuration) {

            s.promo.interstitialDurationCounter = '<span id="interstitialCounter">' + o.interstitialDuration + '</span>';

            o.interstitialText = o.interstitialText.replace('%s', s.promo.interstitialDurationCounter);

            s.promo.interstitialText = makeElement('p', {id: 'interstitialText'}, '&nbsp;' + o.interstitialText);
            s.promo.interstitialSkipText = makeElement('a', {
                id: 'interstitialSkipText',
                href: '#'
            }, o.interstitialSkipText);

            s.promo.interstitialText.insertBefore(s.promo.interstitialSkipText, s.promo.interstitialText.firstChild);
            s.promo.container.appendChild(s.promo.interstitialText);

            addClass('#promoContainer', 'interstitial');
        }

        for (i = 0; i < o.slides.length; i = i + 1) {

            psImg = o.root + o.slides[i][0] || null;
            psLnk = o.slides[i][1] || null;
            psTgt = o.slides[i][2] || '_self';
            psCaption = o.slides[i][3] || null;

            if (psImg) {

                promoSlide = makeElement('li', {'class': 'promoSlide'});
                slideContent = makeElement('div', {'class': 'slideContent'});
                slideContentInner = makeElement('div', {'class': 'slideContentInner'});
                promoLink = makeElement('a', {'class': 'promoLink', href: psLnk, target: psTgt});
                promoCaption = makeElement('p', {'class': 'promoCaption'}, psCaption);
                promoImage = makeElement('img', {'class': 'promoImage', src: psImg});

                if (psLnk) {
                    slideContentInner.appendChild(promoLink).appendChild(promoImage);
                } else {
                    slideContentInner.appendChild(promoImage);
                }

                if (psCaption) {
                    slideContentInner.appendChild(promoCaption);
                }

                slideContent.appendChild(slideContentInner);
                promoSlide.appendChild(slideContent);
                s.promo.slides.appendChild(promoSlide);
            }
        }

        s.promo.slidesWrap.appendChild(s.promo.slides);
        s.promo.content.appendChild(s.promo.slidesWrap);

        if (o.slider) {

            if (o.activeSlide > 0) {

                for (i = 0; i < o.activeSlide; i = i + 1) {
                    s.appendSlide();
                }

                o.current = o.activeSlide;
            }

            if (o.pager) {

                pagerContent = function (i) {

                    var result;

                    if (o.pager === 'thumb') {
                        result = makeElement('img', {src: o.root + o.slides[s.getVisibleOrder(i)][0]});
                    } else {
                        result = makeElement('span', null, o.pager === 'numeric' ? i + 1 : '•');
                    }

                    return result;
                };

                s.promo.pager = makeElement('div', {id: 'promoPager'});

                for (i = 0; i < o.slideNum; i = i + 1) {
                    pager = makeElement('a', {href: '#'});
                    pager.appendChild(pagerContent(i));
                    s.promo.pager.appendChild(pager);
                }

                s.promo.content.appendChild(s.promo.pager);
            }

            if (!o.disableNavArrows) {

                s.promo.nextButton = makeElement('a', {
                    id: 'promoNext',
                    href: '#'
                }, '<span>›</span>');
                s.promo.prevButton = makeElement('a', {
                    id: 'promoPrev',
                    href: '#'
                }, '<span>‹</span>');

                s.promo.content.appendChild(s.promo.nextButton);
                s.promo.content.appendChild(s.promo.prevButton);
            }

            if (o.counter) {

                o.counter = (typeof o.counter === 'string') ? o.counter : '%current/%total';

                o.counter = o.counter.replace('%current', '<span class="current"></span>');
                o.counter = o.counter.replace('%total', '<span class="total"></span>');

                s.promo.psCounter = makeElement('p', {id: 'promoCounter'}, o.counter);

                s.promo.content.appendChild(s.promo.psCounter);
            }
        }

        if (o.overlay && !document.getElementById('promoOverlay')) {
            s.promo.container.appendChild(s.promo.overlay);
        }

        if (o.close && !o.appendTo) {
            s.promo.content.appendChild(s.promo.close);
        }

        if (!o.noActionButtons && o.actionButtons && o.actionButtons.length) {

            for (i = 0; i < o.actionButtons.length; i = i + 1) {
                s.promo.buttons.appendChild(
                    makeElement('a',
                        {
                            'href': o.actionButtons[i][1] || '#close',
                            'target': o.actionButtons[i][2] || '',
                            'class': o.actionButtons[i][3] || ''
                        },
                        o.actionButtons[i][0])
                );
            }

            s.promo.content.appendChild(s.promo.buttons);
        }

        s.promo.container.appendChild(s.promo.content);

        if (o.state === 'embed') {
            body.appendChild(s.promo.overlay);
            o.appendTo.appendChild(s.promo.content);
            addClass('#promoContent', 'embed');
            addClass('#promoOverlay', 'promoHidden');
        } else {
            body.appendChild(s.promo.container);
        }

        addClass('#promoContainer', o.customClass);
        addClass('#promoContent', o.customClass);

        if (o.state === 'fullscreen') {
            addClass('#promoContent', 'fullscreen');
        }

        if (o.slider) {
            s.events.onSlide();
        }

        if (o.pager === 'thumb') {
            addClass('#promoPager', 'thumbs', true);
        }

        s.repaintStyle(document.querySelectorAll('.slideContentInner')[0]);
    };

    s.appendSlide = function (prepend) {

        if (s && s.promo && s.promo.slides) {

            if (prepend) {
                s.promo.slides.insertBefore(s.getSlide(-1), s.getSlide(0));
            } else {
                s.promo.slides.appendChild(s.getSlide(0));
            }

            s.events.onSlide(null);
        }
    };

    s.setDimensions = function (w, h) {

        var width, height, unit = 'px',
            getUnit = function (exp) {
                return (String(exp).indexOf('%') !== -1) ? '%' : 'px';
            };

        if (o.width && o.height) {

            unit = getUnit(o.width);

            width = String(o.width).replace(unit, '');
            height = String(o.height).replace('%', '').replace('px', '');

            o.ratio = height / width;

        } else {

            o.ratio = h / w;

            if (o.width) {
                unit = getUnit(o.width);
                width = String(o.width).replace(unit, '');
                height = width * o.ratio;
            } else {
                unit = getUnit(o.height);
                height = String(o.height).replace(unit, '');
                width = height / o.ratio;
            }

            if (isNaN(width)) {
                width = w;
            }

            if (isNaN(height)) {
                height = h;
            }
        }

        o.width = width + unit;
        o.height = height + unit;

    };

    s.getObjPosition = function (obj) {

        var index = 0;

        while (obj.previousSibling) {
            index = index + 1;
            obj = obj.previousSibling;
        }
        return index;
    };

    s.addListeners = function () {

        var i, counter, skipLink,
            actionButtons = document.getElementById('actionButtons'),
            openLink = function (e) {
                return s.events.clickHandler(e, this);
            },
            gotoSlide = function (e) {
                return s.events.gotoSlide(e, s.getObjPosition(this));
            },
            slide = function (i) {
                return s.promo.slides.childNodes[i].firstChild.firstChild;
            };

        if (o.close) {
            addEvent(s.promo.close, 'click', s.events.close);
        }

        if (!o.modal) {
            addEvent(s.promo.overlay, 'click', s.events.close);
        }

        if (!o.noActionButtons && actionButtons && actionButtons.childNodes) {
            for (i = 0; i < actionButtons.childNodes.length; i = i + 1) {
                addEvent(actionButtons.childNodes[i], 'click', openLink);
            }
        }

        for (i = 0; i < s.promo.slides.childNodes.length; i = i + 1) {
            if (slide(i).firstChild.nodeName === 'A') {
                addEvent(slide(i).firstChild, 'click', openLink);
            }
        }

        if (!o.noKeyClose) {
            addEvent(document, 'keydown', s.events.keyClose);
        }

        if (o.interstitialDuration) {

            skipLink = s.promo.interstitialText.firstChild;

            addEvent(s.promo.interstitialSkipText, 'click', s.events.close);

            counter = document.getElementById('interstitialCounter');

            interstitialCloseID = setInterval(function () {

                if (counter) {
                    counter.innerHTML = counter.innerHTML - 1;

                    if (counter.innerHTML === '0') {
                        s.promo.interstitialText.innerHTML = '';
                        s.promo.interstitialText.appendChild(skipLink);
                    }
                } else {
                    s.events.stopTimer(interstitialCloseID, true);
                }
            }, 1000);
        }

        if (o.autoCloseSeconds) {
            s.events.autoClose();
        }

        if (o.slider) {

            if (!o.disableNavArrows) {

                addEvent(s.promo.nextButton, 'click', function (e) {
                    s.events.stepSlide(e);
                });

                addEvent(s.promo.prevButton, 'click', function (e) {
                    s.events.stepSlide(e, true);
                });
            }

            if (o.pager) {

                for (i = 0; i < s.promo.pager.childNodes.length; i = i + 1) {
                    addEvent(s.promo.pager.childNodes[i], 'click', gotoSlide);
                }
            }

            if (!o.disableKeyNav && !o.appendTo) {
                addEvent(document, 'keydown', s.events.keyNav);
            }

            addEvent(s.promo.content, 'mouseover', s.events.sliderHover);
            addEvent(s.promo.content, 'mouseout', s.events.sliderBlur);

            s.events.toggleAutoPlay(true);
        }
    };

    s.getVisibleOrder = function (index) {

        index = index + 2;

        if (index >= o.slideNum) {
            index = index - o.slideNum;
        }

        return index;
    };

    s.setCounterValue = function () {

        var current = document.querySelector('#promoCounter .current'),
            total = document.querySelector('#promoCounter .total');

        if (current) {
            current.innerHTML = 1 + o.current;
        }

        if (total) {
            total.innerHTML = o.slideNum;
        }
    };

    s.getNextSlides = function (index) {

        var prev, next, max = o.slideNum - 1,
            current = index || o.current;

        if (current === max) {
            prev = current - 1;
            next = 0;
        } else if (current === 0) {
            prev = max;
            next = 1;
        } else {
            prev = current - 1;
            next = current + 1;
        }

        o.prev = prev;
        o.next = next;
    };

    s.repaintStyle = function (obj) {

        var tmp;

        if (!obj) {
            return false;
        }

        obj.style.display = 'none';
        tmp = obj.offsetHeight;
        obj.removeAttribute('style');

        tmp = tmp + 1;
    };

    s.events = {

        sliderHover: function () {

            if (!o.disableKeyNav && o.appendTo) {
                s.events.enableKeyNav();
            }

            if (!o.noPauseOnHover) {
                s.events.toggleAutoPlay();
            }

            s.events.stopTimer(autoCloseID);
        },

        sliderBlur: function () {

            if (!o.disableKeyNav && o.appendTo) {
                s.events.disableKeyNav();
            }

            s.events.toggleAutoPlay(true);
        },

        onSlide: function (e, index) {

            var activeSlide,
                slides = document.querySelectorAll('.promoSlide'),
                slideContentInner = document.querySelectorAll('.slideContentInner')[2];

            e = e || window.event;

            index = index || o.current;

            s.getNextSlides();

            if (s.promo && s.promo.pager) {

                activeSlide = document.querySelector('#promoPager a.active');

                if (activeSlide) {
                    activeSlide.className = '';
                }

                document.querySelectorAll('#promoPager a')[index].className = 'active';
            }

            slides[1].className = 'promoSlide';
            slides[2].className = 'promoSlide current';
            slides[3].className = 'promoSlide';

            s.repaintStyle(slideContentInner);

            if (!o.disableNavArrows) {

                addClass('#promoPrev', '', true);
                addClass('#promoNext', '', true);

                if (!o.infinite) {

                    if (o.prev === o.slideNum - 1) {
                        addClass('#promoPrev', 'promoHidden', true);
                    }

                    if (o.next === 0) {
                        addClass('#promoNext', 'promoHidden', true);
                    }
                }
            }

            if (o.counter) {
                s.setCounterValue();
            }
        },

        stepSlide: function (e, prev) {

            preventDefault(e);

            if (o.noSlider) {
                return false;
            }

            if (o.waitAnimationFinish && o.running) {
                return false;
            }

            if (!o.infinite) {

                if (prev && o.prev === o.slideNum - 1) {
                    return false;
                }

                if (!prev && o.next === 0) {
                    return false;
                }
            }

            if (o.rewindOnEnd) {

                if (!prev && o.next === 0) {
                    s.events.gotoSlide(e, o.next);
                    return false;
                }

                if (prev && o.current === 0) {
                    s.events.gotoSlide(e, o.prev);
                    return false;
                }
            }

            if (o.waitAnimationFinish) {

                o.running = true;

                setTimeout(function () {
                    o.running = false;
                }, o.slideDuration * 1000);
            }

            o.current = prev ? o.prev : o.next;

            s.appendSlide(prev);
        },

        gotoSlide: function (e, index) {

            var offset, gotoSlideID, prev;

            preventDefault(e);

            if (o.noSlider) {
                return false;
            }

            index = index || 0;

            if (o.waitAnimationFinish && o.running) {
                return false;
            }

            if (!o.infinite && index > o.slideNum - 1) {
                return false;
            }

            offset = index - o.current;

            if (offset === 0) {
                return false;
            }

            prev = offset < 0;

            offset = Math.abs(offset) - 1;

            if (offset === 0) {
                s.events.stepSlide(e, prev);
                return false;
            }

            o.current = index;

            o.running = o.waitAnimationFinish;

            addClass('#promoSlidesWrap', 'seekAnim', true);

            s.appendSlide(prev);

            gotoSlideID = setInterval(function () {

                if (offset === 0) {
                    o.running = false;
                    addClass('#promoSlidesWrap', '', true);
                    s.events.stopTimer(gotoSlideID, true);

                } else {
                    offset = offset - 1;
                    s.appendSlide(prev);
                }
            }, o.slideDuration / o.slideNum * 1000);
        },

        destroyPromo: function () {

            if (s.promo.container.parentNode) {
                s.promo.container.parentNode.removeChild(s.promo.container);
            }

            if (s.promo.content.parentNode) {
                s.promo.content.parentNode.removeChild(s.promo.content);
            }

            if (s.styles) {
                s.styles.parentNode.removeChild(s.styles);
            }

            s = null;
        },

        close: function (e) {

            preventDefault(e);

            if (!s) {
                return false;
            }

            if (o.appendTo) {
                s.events.toggleEmbed();
                return false;
            }

            callCallBack(o.onPromoClose, e, null, o.current);

            if (s.promo.container) {

                if (o.fadeOutDuration > 0) {

                    addClass('#promoContainer', 'fadeOut');

                    setTimeout(function () {
                        if (s) {
                            s.events.destroyPromo();
                        }
                    }, o.fadeOutDuration * 1000);

                } else {
                    s.events.destroyPromo();
                }
            }

            s.events.stopTimer(autoCloseID);
            s.events.stopTimer(interstitialCloseID);
            s.events.stopTimer(autoPlayID, true);
        },

        stopTimer: function (id, interval) {
            if (id) {
                if (interval) {
                    clearInterval(id);
                } else {
                    clearTimeout(id);
                }
                id = undefined;
            }
        },

        enableKeyNav: function () {
            addEvent(document, 'keydown', s.events.keyNav);
        },

        disableKeyNav: function () {
            removeEvent(document, 'keydown', s.events.keyNav);
        },

        toggleAutoPlay: function (start) {

            if (o.autoPlay) {

                s.events.stopTimer(autoPlayID, true);

                if (start) {
                    autoPlayID = setInterval(function (e) {
                        s.events.stepSlide(e, o.autoPlayDirection);
                    }, o.autoPlay * 1000);
                }
            }
        },

        autoClose: function () {
            autoCloseID = setTimeout(function () {
                s.events.close(null);
            }, o.autoCloseSeconds * 1000);
        },

        keyClose: function (e) {
            if (s && o.state !== 'embed' && e.keyCode === 27) {
                s.events.close(e);
            }
        },

        keyNav: function (e) {

            if (o.slider && s) {

                if (e.keyCode === 38 || e.keyCode === 39) {
                    s.events.stepSlide(e, o.reverseKeyNav);
                }

                if (e.keyCode === 37 || e.keyCode === 40) {
                    s.events.stepSlide(e, !o.reverseKeyNav);
                }
            }
        },

        toggleFullscreen: function () {

            if (o.state === 'interstitial') {
                return false;
            }

            if (o.state === 'fullscreen') {
                addClass('#promoContent', o.customClass, true);
                o.state = 'lightbox';

            } else {

                addClass('#promoContent', 'fullscreen ' + o.customClass, true);

                if (o.close) {
                    s.promo.content.appendChild(s.promo.close);
                    addEvent(s.promo.close, 'click', s.events.close);
                }

                o.state = 'fullscreen';
            }

            s.repaintStyle(document.querySelectorAll('.slideContentInner')[2]);

            return false;
        },

        toggleEmbed: function () {

            if (o.appendTo) {

                if (o.state !== 'embed') {

                    addClass('#promoContainer', 'fadeOut');

                    setTimeout(function () {

                        addClass('#promoOverlay', 'promoHidden', true);
                        addClass('#promoContent', 'embed ' + o.customClass, true);

                        o.appendTo.appendChild(s.promo.content);

                        if (o.close) {
                            s.promo.close.parentNode.removeChild(s.promo.close);
                        }

                        addClass('#promoContainer', '', true);
                        o.state = 'embed';

                        s.repaintStyle(document.querySelectorAll('.slideContentInner')[0]);
                        s.repaintStyle(document.querySelectorAll('.slideContentInner')[2]);

                    }, o.fadeOutDuration * 1000);

                } else {

                    body.appendChild(s.promo.container);
                    s.promo.container.appendChild(s.promo.content);

                    addClass('#promoOverlay', '', true);
                    addClass('#promoContent', o.customClass, true);

                    if (o.close) {
                        s.promo.content.appendChild(s.promo.close);
                        addEvent(s.promo.close, 'click', s.events.close);
                    }

                    o.state = 'lightbox';

                    s.repaintStyle(document.querySelectorAll('.slideContentInner')[0]);
                    s.repaintStyle(document.querySelectorAll('.slideContentInner')[2]);
                }
            }
        },

        clickHandler: function (e, obj) {

            var step, targetSlide,
                link = obj.href || '#close',
                target = obj.target || '_self';

            if (e) {
                preventDefault(e);
            }

            callCallBack(o.onPromoClick, e, obj, o.current);

            step = link.indexOf('#slide');

            if (step !== -1) {
                targetSlide = link.substr(step + 6, 1) - 1;
            }

            if (link.indexOf('#first') !== -1) {
                targetSlide = 0;
            } else if (link.indexOf('#last') !== -1) {
                targetSlide = o.slideNum - 1;
            } else if (link.indexOf('#prev') !== -1) {
                targetSlide = o.current - 1;
            } else if (link.indexOf('#next') !== -1) {
                targetSlide = o.current + 1;
            } else if (link.indexOf('#fullscreen') !== -1) {

                if (o.state === 'embed') {
                    s.events.toggleEmbed();
                } else {
                    s.events.toggleFullscreen();
                }
                return false;

            } else if (link.indexOf('#lightbox') !== -1) {

                if (o.appendTo) {
                    s.events.toggleEmbed();
                } else {
                    s.events.close(e);
                }
                return false;
            }

            if (targetSlide !== undefined) {
                s.events.gotoSlide(e, targetSlide);
                return false;
            }

            if (link.indexOf('#close') === -1) {
                window.open(link, target);
            }

            if (o.state !== 'embed' && (!o.noCloseOnClick || link.indexOf('#close') !== -1)) {
                s.events.close();
            }

            return false;
        }
    };

    if (s.init()) {

        loadSprite(o.root + o.slides[o.maxSlides === 1 ? 0 : 2][0], function () {

            s.setDimensions(this.width, this.height);

            setTimeout(function () {
                callCallBack(o.onPromoStart, null, null, o.current);
                s.addStyles();
                s.buildPromo();
                s.addListeners();
            }, o.loadDelay * 1000);
        });
    }

    return {

        gotoSlide: function (index) {

            if (index !== o.current + 1 && index < o.slideNum && index > 0) {

                if (index === 'first') {
                    index = 0;
                } else if (index === 'last') {
                    index = o.slideNum - 1;
                } else if (index === 'next') {
                    index = o.current + 1;
                } else if (index === 'prev') {
                    index = o.current - 1;
                } else {
                    index = index - 1;
                }

                s.events.gotoSlide(null, index);

                return true;
            }

            return false;
        },

        stop: function () {
            s.events.toggleAutoPlay();
        },

        start: function () {
            s.events.toggleAutoPlay(true);
        },

        close: function () {
            s.events.close(null);
        },

        current: function () {
            return o.current + 1;
        },

        prev: function () {
            return o.prev + 1;
        },

        next: function () {
            return o.next + 1;
        },

        total: function () {
            return o.slideNum;
        },

        toggleFullscreen: function () {
            return s.events.toggleFullscreen();
        },

        toggleEmbed: function () {
            return s.events.toggleEmbed();
        },

        getState: function () {
            return o.state;
        },

        autoPlay: function (start, duration) {

            if (!duration) {
                o.autoPlay = 4;
            }

            return s.events.toggleAutoPlay(start);
        },

        setInfinite: function (a) {

            o.infinite = a ? true : false;

            return s.events.onSlide(null);
        }
    };
}
