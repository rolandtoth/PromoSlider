/*!
 * PromoSlider v1.0 - JavaScript Image Slider
 * https://github.com/rolandtoth/PromoSlider
 * last update: 2014.08.01.
 *
 * Licensed under the MIT license
 * Copyright 2014 Roland Toth (tpr)
 *
 */

/*global window, document */
/*jslint browser: true */
/*jslint sloppy: true */

var isWebkit = document.addEventListener && document.documentElement.style.hasOwnProperty('WebkitAppearance');

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

    if (target) {

        if (replace) {
            target.className = className;

        } else {

            if (target.className && target.className.indexOf(className) !== -1) {
                return false;
            }
            target.className += ' ' + className;
        }
    }
}

function removeClass(target, className) {
    if (target && target.className) {
        target.className = target.className.replace(className, '');
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

function callCallBack(callback, event, obj, slide, state) {

    var e = event || window.event;
    slide = slide || null;
    obj = obj || null;

    if (typeof callback === 'function') {
        callback(e, obj, slide + 1, state);
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
        body = document.body,
        currentUrl = window.location.href,
        s = this;

    s.getSlide = function (index) {
        var slideIndex = (index < 0) ? s.promo.slides.childNodes.length + index : index;
        return s.promo.slides.childNodes[slideIndex];
    };

    s.init = function () {

        var forceOnUrl, deleteCookie, showOnUrl, hideOnUrl,
            currentDateEpoch = Math.round(new Date().getTime() / 1000);

        o.actionButtons = o.actionButtons || null;
        o.actionButtonsPosition = o.actionButtonsPosition || 'bottom';
        o.activeSlide = o.activeSlide || 1;
        o.appendTo = o.appendTo || null;
        o.autoCloseSeconds = o.autoCloseSeconds || null;
        o.autoPlay = o.autoPlay || null;
        o.disableCaptions = o.disableCaptions || false;
        o.captionPosition = o.captionPosition || 'bottom';
        o.close = o.close !== false;
        o.closeButtonOnHover = o.closeButtonOnHover || null;
        o.closeButtonPosition = o.closeButtonPosition || 'top';
        o.closeButtonText = o.closeButtonText || '×';
        o.counter = o.counter || null;
        o.counterOnHover = o.counterOnHover || null;
        o.counterPosition = o.counterPosition || 'outside';
        o.customClass = o.customClass || 'promoSlider';
        o.deleteCookieOnUrl = o.deleteCookieOnUrl || null;
        o.disableKeyNav = o.disableKeyNav || null;
        o.disableNavArrows = o.disableNavArrows || null;
        o.easing = o.easing || 'ease-in-out';
        o.effect = o.effect || null;
        o.endDate = o.endDate || null;
        o.fadeInDuration = o.fadeInDuration || 0;
        o.fadeOutDuration = o.fadeOutDuration || 0;
        o.firstSlide = o.firstSlide || 1;
        o.fitContent = o.fitContent || null;
        o.forceOnUrl = o.forceOnUrl || null;
        o.frequency = o.frequency || null;
        o.fullscreen = o.fullscreen || null;
        o.height = o.height || null;
        o.hideOnUrl = o.hideOnUrl || null;
        o.infinite = o.infinite !== false;
        o.interstitialDuration = o.interstitialDuration || null;
        o.interstitialSkipText = o.interstitialSkipText || 'Skip this ad';
        o.interstitialText = o.interstitialText || 'or wait %s seconds';
        o.loadDelay = o.loadDelay || null;
        o.maxSlides = o.maxSlides || null;
        o.modal = o.modal !== false;
        o.navArrowsOnHover = o.navArrowsOnHover || null;
        o.navArrowsPosition = o.navArrowsPosition || 'outside';
        o.noCloseOnClick = o.noCloseOnClick || false;
        o.keyClose = o.keyClose !== false;
        o.pauseOnHover = o.pauseOnHover !== false;
        o.onPromoClick = o.onPromoClick || null;
        o.onPromoClose = o.onPromoClose || null;
        o.onPromoStart = o.onPromoStart || null;
        o.overlay = o.overlay !== false;
        o.pager = o.pager || o.pager !== false;
        o.pagerOnHover = o.pagerOnHover || null;
        o.pagerPosition = o.pagerPosition || 'top';
        o.promoID = o.promoID || 'promoSlider';
        o.randomize = o.randomize || false;
        o.reverseKeyNav = o.reverseKeyNav || false;
        o.rewindOnEnd = o.rewindOnEnd || null;
        o.reverseDirection = o.reverseDirection || false;
        o.reverseWheelNav = o.reverseWheelNav || false;
        o.rootDir = o.rootDir || '';
        o.running = null;
        o.showOnUrl = o.showOnUrl || null;
        o.showProbability = o.showProbability || 1;
        o.slideDuration = o.slideDuration >= 0 ? o.slideDuration : 1;
        o.slides = o.slides || null;
        o.startDate = o.startDate || null;
        o.state = 'lightbox';
        o.vertical = o.vertical || null;
        o.waitAnimationFinish = o.waitAnimationFinish || null;
        o.wheelNav = o.wheelNav !== false;
        o.width = o.width || null;

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
                cookie.eraseCookie(o.promoID);
            }

            if (showOnUrl) {
                return false;
            }

            if (hideOnUrl) {
                return false;
            }

            if (o.frequency) {
                if (cookie.readCookie(o.promoID)) {
                    return false;
                }
                if (!deleteCookie) {
                    cookie.createCookie(o.promoID, '1', o.frequency);
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

        if (o.slides.length > 1) {
            s.initSlider();
        }

        if (deleteCookie) {
            cookie.eraseCookie(o.promoID);
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

            if (!document.querySelector(o.appendTo)) {
                return false;
            }

            o.appendTo = document.querySelector(o.appendTo);
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

    s.addConditionalStyles = function () {

        var i;

        addClass(s.promo.container, o.customClass);
        addClass(s.promo.content, o.customClass);

        if (o.state === 'fullscreen') {
            addClass(s.promo.container, 'fullscreen');
        }

        if (o.vertical) {
            addClass(s.promo.content, 'vertical');
        }

        if (o.effect === 'fade') {
            addClass(s.promo.content, 'fade');
        }

        if (o.navArrowsPosition === 'inside') {
            addClass(s.promo.nextButton, 'inside');
            addClass(s.promo.prevButton, 'inside');
        }

        if (o.closeButtonPosition === 'inside') {
            addClass(s.promo.close, 'inside');
        }

        if (o.counterPosition === 'inside') {
            addClass(s.promo.counter, 'inside');
        }

        if (o.pager === 'numeric') {
            addClass(s.promo.pager, 'numeric');
        } else if (o.pager === 'thumb') {
            addClass(s.promo.pager, 'thumb');
        } else if (o.pager === 'progress') {
            addClass(s.promo.pager, 'progress');
        }

        if (o.pagerPosition === 'inside') {
            addClass(s.promo.pager, 'inside');
        }

        if (o.pagerPosition === 'bottom') {
            addClass(s.promo.pager, 'bottom');
        }

        if (o.actionButtonsPosition === 'top') {
            addClass(s.promo.actionButtons, 'top');
        }

        if (o.closeButtonOnHover) {
            addClass(s.promo.content, 'hover');
            addClass(s.promo.content, 'close');
        }

        if (o.counterOnHover) {
            addClass(s.promo.content, 'hover');
            addClass(s.promo.content, 'counter');
        }

        if (o.navArrowsOnHover) {
            addClass(s.promo.content, 'hover');
            addClass(s.promo.content, 'arrows');
        }

        if (o.pagerOnHover) {
            addClass(s.promo.content, 'hover');
            addClass(s.promo.content, 'pager');
        }

        if (o.fitContent === 'stretch') {
            addClass(s.promo.content, 'stretch');
        }

        if (o.fadeInDuration !== 0) {
            addClass(s.promo.container, 'fadeIn');
        }

        if (o.slider) {

            for (i = 0; i < o.slides.length; i = i + 1) {
                s.promo.slides.childNodes[i].style.transitionDuration = o.slideDuration + 's';
                s.promo.slides.childNodes[i].style.transitionTimingFunction = o.easing;
            }
            s.events.onSlide();

        } else {
            addClass(s.promo.content, 'single');
        }

        s.promo.content.style.maxWidth = o.width;
        s.promo.content.style.maxHeight = o.height;

        if (!supportsTransitions) {
            addClass(s.promo.container, 'noTransition');
        }

        if (!document.addEventListener) {
            addClass(s.promo.container, 'ie8');
            addClass(s.promo.content, 'ie8');
        }

//        s.repaintStyle(s.promo.slides.childNodes[0], '.slideContentInner');
    };

    s.buildPromo = function () {

        var slideContent, slideContentInner, promoSlide, promoImage, promoLink, promoCaption, psImg, psLnk, psTgt, psCaption, pager, pagerContent, i;

        s.promo = {
            overlay: makeElement('div', {'class': 'promoOverlay'}),
            container: makeElement('div', {'class': 'promoContainer'}),
            content: makeElement('div', {'class': 'promoContent'}),
            ratioPlaceholder: makeElement('div', {'class': 'ratioPlaceholder'}),
            slidesWrap: makeElement('div', {'class': 'promoSlidesWrap'}),
            slides: makeElement('ul', {'class': 'promoSlides'}),
            close: makeElement('a', {'class': 'promoClose', href: '#'}, o.closeButtonText),
            actionButtons: makeElement('div', {'class': 'actionButtons'})
        };

        if (o.interstitialDuration) {

            s.promo.interstitialDurationCounter = '<span class="interstitialCounter">' + o.interstitialDuration + '</span>';

            o.interstitialText = o.interstitialText.replace('%s', s.promo.interstitialDurationCounter);

            s.promo.interstitialText = makeElement('p', {'class': 'interstitialText'}, '&nbsp;' + o.interstitialText);
            s.promo.interstitialSkipText = makeElement('a', {'class': 'interstitialSkipText', href: '#'}, o.interstitialSkipText);

            s.promo.interstitialText.insertBefore(s.promo.interstitialSkipText, s.promo.interstitialText.firstChild);
            s.promo.container.appendChild(s.promo.interstitialText);

            addClass(s.promo.container, 'interstitial');
        }

        for (i = 0; i < o.slides.length; i = i + 1) {

            psImg = o.rootDir + o.slides[i][0] || null;
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

                if (!o.disableCaptions && psCaption) {
                    if (o.captionPosition === 'top') {
                        addClass(promoCaption, 'top');
                    }
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
                        result = makeElement('img', {src: o.rootDir + o.slides[s.getVisibleOrder(i)][0]});
                    } else if (o.pager === 'numeric') {
                        result = makeElement('span', null, i + 1);
                    } else if (o.pager === 'progress') {
                        result = makeElement('span', null);
                    } else {
                        result = makeElement('span', null, '•');
                    }

                    return result;
                };

                s.promo.pager = makeElement('div', {'class': 'promoPager'});

                for (i = 0; i < o.slideNum; i = i + 1) {
                    pager = makeElement('a', {href: '#'});
                    pager.appendChild(pagerContent(i));
                    s.promo.pager.appendChild(pager);
                }

                s.promo.content.appendChild(s.promo.pager);
            }

            if (!o.disableNavArrows) {

                s.promo.nextButton = makeElement('a', {'class': 'promoNext', href: '#'}, '<span>›</span>');
                s.promo.prevButton = makeElement('a', {'class': 'promoPrev', href: '#'}, '<span>‹</span>');

                s.promo.content.appendChild(s.promo.nextButton);
                s.promo.content.appendChild(s.promo.prevButton);
            }

            if (o.counter) {

                o.counter = (typeof o.counter === 'string') ? o.counter : '%current/%total';

                o.counter = o.counter.replace('%current', '<span class="current"></span>');
                o.counter = o.counter.replace('%total', '<span class="total"></span>');

                s.promo.counter = makeElement('p', {'class': 'promoCounter'}, o.counter);

                s.promo.content.appendChild(s.promo.counter);
            }
        }

        if (o.overlay && !document.querySelector('.promoOverlay')) {
            s.promo.container.appendChild(s.promo.overlay);
        }

        if (o.close && !o.appendTo) {
            s.promo.content.appendChild(s.promo.close);
        }

        if (o.actionButtons && o.actionButtons.length) {

            for (i = 0; i < o.actionButtons.length; i = i + 1) {
                s.promo.actionButtons.appendChild(
                    makeElement('a',
                        {
                            'href': o.actionButtons[i][1] || '#close',
                            'target': o.actionButtons[i][2] || '',
                            'class': o.actionButtons[i][3] || ''
                        },
                        o.actionButtons[i][0])
                );
            }

            s.promo.content.appendChild(s.promo.actionButtons);
        }

        s.promo.content.appendChild(s.promo.ratioPlaceholder);
        s.promo.ratioPlaceholder.style.paddingTop = o.ratio * 100 + '%';

        s.promo.container.appendChild(s.promo.content);

        if (o.state === 'embed') {
            o.appendTo.appendChild(s.promo.content);
            addClass(s.promo.content, 'embed');
        } else {
            body.appendChild(s.promo.container);
        }

        s.addConditionalStyles();

    };

    s.appendSlide = function (prepend) {

        prepend = o.reverseDirection ? !prepend : prepend;

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
            captionLinks = s.promo.slides.querySelectorAll('.promoCaption a'),
            actionButtonLinks = s.promo.content.querySelectorAll('.actionButtons > a'),
            slideLinks = s.promo.slides.querySelectorAll('.slideContentInner > a'),
            openLink = function (e) {
                return s.events.clickHandler(e, this);
            },
            gotoSlide = function (e) {
                return s.events.gotoSlide(e, s.getObjPosition(this));
            };

        if (o.close) {
            addEvent(s.promo.close, 'click', s.events.close);
        }

        if (!o.modal) {
            addEvent(s.promo.overlay, 'click', s.events.close);
        }

        if (o.keyClose) {
            addEvent(document, 'keydown', s.events.keyClose);
        }

        if (o.interstitialDuration) {

            skipLink = s.promo.interstitialText.firstChild;

            addEvent(s.promo.interstitialSkipText, 'click', s.events.close);

            counter = s.promo.container.querySelector('.interstitialCounter');

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

            if (actionButtonLinks.length) {
                for (i = 0; i < actionButtonLinks.length; i = i + 1) {
                    addEvent(actionButtonLinks[i], 'click', openLink);
                }
            }

            if (slideLinks.length) {
                for (i = 0; i < slideLinks.length; i = i + 1) {
                    addEvent(slideLinks[i], 'click', openLink);
                }
            }

            if (captionLinks.length) {
                for (i = 0; i < captionLinks.length; i = i + 1) {
                    addEvent(captionLinks[i], 'click', openLink);
                }
            }

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

        var current = s.promo.counter.querySelector('.current'),
            total = s.promo.counter.querySelector('.total');

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

    s.repaintStyle = function (obj, selector) {

        var tmp;

        if (isWebkit && obj) {

            obj = obj.querySelector(selector);

            obj.style.display = 'none';
            tmp = obj.offsetHeight;
            obj.removeAttribute('style');

            return tmp;
        }
    };

    s.events = {

        sliderHover: function () {

            if (!o.disableKeyNav && o.appendTo) {
                s.events.enableKeyNav();
            }

            if (o.pauseOnHover) {
                s.events.toggleAutoPlay();
            }

            if (o.wheelNav) {
                s.events.enableWheelNav();
            }

            s.events.stopTimer(autoCloseID);
        },

        sliderBlur: function () {

            if (!o.disableKeyNav && o.appendTo) {
                s.events.disableKeyNav();
            }

            s.events.disableWheelNav();

            s.events.toggleAutoPlay(true);

        },

        onSlide: function (e, index) {

            if (!o.slider) {
                return false;
            }

            e = e || window.event;

            index = index || o.current;

            s.getNextSlides();

            if (s.promo && s.promo.pager) {

                if (s.promo.pager.querySelector('a.active')) {
                    s.promo.pager.querySelector('a.active').className = '';
                }

                s.promo.pager.querySelectorAll('a')[index].className = 'active';
            }

            s.promo.slides.childNodes[1].className = 'promoSlide';
            s.promo.slides.childNodes[2].className = 'promoSlide current';
            s.promo.slides.childNodes[3].className = 'promoSlide';

            s.repaintStyle(s.promo.slides.childNodes[2], '.slideContentInner');

            if (!o.disableNavArrows) {

                removeClass(s.promo.prevButton, ' promoHidden', true);
                removeClass(s.promo.nextButton, ' promoHidden', true);

                if (!o.infinite) {

                    if (o.prev === o.slideNum - 1) {
                        addClass(s.promo.prevButton, 'promoHidden');
                    }

                    if (o.next === 0) {
                        addClass(s.promo.nextButton, 'promoHidden');
                    }
                }
            }

            if (o.counter) {
                s.setCounterValue();
            }
        },

        stepSlide: function (e, prev) {

            preventDefault(e);

            if (!o.slider) {
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

            var offset, gotoSlideID, prev, i;

            preventDefault(e);

            if (!o.slider) {
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

            for (i = 0; i < o.slides.length; i = i + 1) {
                s.promo.slides.childNodes[i].style.transitionDuration = o.seekAnimSpeed + 's';
                s.promo.slides.childNodes[i].style.transitionTimingFunction = 'linear';
            }

            s.appendSlide(prev);

            gotoSlideID = setInterval(function () {

                if (offset === 0) {
                    o.running = false;

                    for (i = 0; i < o.slides.length; i = i + 1) {
                        s.promo.slides.childNodes[i].style.transitionDuration = o.slideDuration + 's';
                        s.promo.slides.childNodes[i].style.transitionTimingFunction = o.easing;
                    }

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

            callCallBack(o.onPromoClose, e, null, o.current, o.state);

            if (s.promo.container) {

                if (o.fadeOutDuration > 0) {

                    addClass(s.promo.container, 'fadeOut');

                    setTimeout(function () {
                        if (s) {
                            s.events.destroyPromo();
                        }
                    }, o.fadeOutDuration * 1000);

                } else {
                    s.events.destroyPromo();
                }
            }

            if (s && s.events) {
                s.events.stopTimer(autoCloseID);
                s.events.stopTimer(interstitialCloseID);
                s.events.stopTimer(autoPlayID, true);
            }
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

        enableWheelNav: function () {
            addEvent(document, 'mousewheel', s.events.wheelNav);
            addEvent(document, 'DOMMouseScroll', s.events.wheelNav);
        },

        disableWheelNav: function () {
            removeEvent(document, 'mousewheel', s.events.wheelNav);
            removeEvent(document, 'DOMMouseScroll', s.events.wheelNav);
        },

        toggleAutoPlay: function (start) {

            if (o.autoPlay) {

                s.events.stopTimer(autoPlayID, true);

                if (start) {
                    autoPlayID = setInterval(function (e) {
                        s.events.stepSlide(e);
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

        wheelNav: function (e) {

            var delta;

            if (o.slider && s) {

                e = window.event || e;

                delta = e.detail ? e.detail * (-120) : e.wheelDelta;

                delta = delta > 0;

                delta = o.reverseDirection ? !delta : delta;
                delta = o.reverseWheelNav ? !delta : delta;

                s.events.stepSlide(e, delta);
            }
        },

        toggleFullscreen: function () {

            if (o.state === 'fullscreen') {
                removeClass(s.promo.container, ' fullscreen');

                o.state = 'lightbox';

            } else {

                addClass(s.promo.container, 'fullscreen');

                if (o.close) {
                    s.promo.content.appendChild(s.promo.close);
                    addEvent(s.promo.close, 'click', s.events.close);
                }

                o.state = 'fullscreen';
            }

            s.repaintStyle(s.promo.slides.childNodes[0], '.slideContentInner');
            s.repaintStyle(s.promo.slides.childNodes[2], '.slideContentInner');

            return false;
        },

        toggleEmbed: function () {

            if (o.appendTo) {

                if (o.state !== 'embed') {

                    addClass(s.promo.container, 'fadeOut');

                    setTimeout(function () {

                        s.promo.overlay.parentNode.removeChild(s.promo.overlay);
                        s.promo.container.parentNode.removeChild(s.promo.container);

                        removeClass(s.promo.container, ' fadeOut');
                        removeClass(s.promo.container, ' fullscreen');
                        addClass(s.promo.content, 'embed');

                        o.appendTo.appendChild(s.promo.content);

                        if (o.close) {
                            s.promo.close.parentNode.removeChild(s.promo.close);
                        }

                        s.events.sliderBlur();

                        o.state = 'embed';

                        s.repaintStyle(s.promo.slides.childNodes[0], '.slideContentInner');
                        s.repaintStyle(s.promo.slides.childNodes[2], '.slideContentInner');

                    }, o.fadeOutDuration * 1000);

                } else {

                    body.appendChild(s.promo.container);
                    s.promo.container.appendChild(s.promo.content);

                    s.promo.container.appendChild(s.promo.overlay);
                    removeClass(s.promo.content, ' embed');

                    if (o.close) {
                        s.promo.content.appendChild(s.promo.close);
                        addEvent(s.promo.close, 'click', s.events.close);
                    }

                    o.state = 'lightbox';

                    s.repaintStyle(s.promo.slides.childNodes[0], '.slideContentInner');
                    s.repaintStyle(s.promo.slides.childNodes[2], '.slideContentInner');
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

            callCallBack(o.onPromoClick, e, obj, o.current, o.state);

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

            }

            if (targetSlide !== undefined) {
                s.events.gotoSlide(e, targetSlide);
                return false;
            }

            if (link.indexOf('#fullscreen') !== -1) {

                if (o.state === 'embed') {
                    s.events.toggleEmbed();
                }
                s.events.toggleFullscreen();
                return false;

            }

            if (link.indexOf('#lightbox') !== -1) {
                if (o.appendTo) {
                    s.events.toggleEmbed();
                } else {
                    s.events.close(e);
                }
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

        loadSprite(o.rootDir + o.slides[o.maxSlides === 1 ? 0 : 2][0], function () {

            s.setDimensions(this.width, this.height);

            setTimeout(function () {
                callCallBack(o.onPromoStart, null, null, o.current, o.state);
                s.buildPromo();
                s.addConditionalStyles();
                s.addListeners();
            }, o.loadDelay * 1000);
        });
    }

    return {

        gotoSlide: function (index) {

            if (index !== o.current + 1) {

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

                if (index >= o.slideNum || index < 0) {
                    return false;
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
