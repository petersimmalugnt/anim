(function () {

  let rect, trigger, triggerHeight, offsetAll, triggerRect, rest, progScrubX, progScrubY, totScrubX, totScrubY, curScrubX, curScrubY, lerpX, lerpY, tX, tY, lastKnownScrollPosition = 0, ticking = false, activeEls = 0, inViewEls = [], activeElements = []

  /* Unit calc */
  function unitCalc(v, r) {
    if (v) {
      switch (true) {
        case v.includes("%"):
          return (r.height * v.replace("%", "")) / 100;
          break;
        case v.includes("px"):
          return v.replace("px", "");
          break;
        case v.includes("vh"):
          return (window.innerHeight * v.replace("vh", "")) / 100;
          break;
        case v.includes("vw"):
          return (window.innerWidth * v.replace("vw", "")) / 100;
          break;
        default:
          return (r.height * v) / 100;
      }
    }
    return 0;
  }

  /* Lerp calc */
  function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
  }

  /* clamp numbers */
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

  document.querySelectorAll("[data-mouse], [data-inview], [data-spanify]").forEach((el)=> pushInViewEls(el) )

  function pushInViewEls(el) { inViewEls.push(composeObj(el) ) }

  function composeObj(el) {
    trigger = el.getAttribute("data-trigger") == 'window' ? window : el.closest(el.getAttribute("data-trigger")) || document.querySelector(el.getAttribute("data-trigger")) || el
    triggerHeight = (trigger == window ? trigger.innerHeight : trigger.clientHeight)
    offsetAll = unitCalc(el.getAttribute("data-offset"), triggerHeight) || false
    rest = el.getAttribute("anim-rest") ? Number(el.getAttribute("anim-rest").split(",")) : [0.5, 0.5]

    return {
      el: el,
      lerp: Number((100 - (el.getAttribute("data-lerp") || 90)) / 100),
      easing: el.getAttribute("data-easing") || false,
      stack: Number(el.getAttribute("data-stack")) || false,
      duration: el.getAttribute("data-duration") || false,
      delay: Number(el.getAttribute("data-delay")) || false,
      target: {
        el: el.closest(el.getAttribute("data-target")) || document.querySelector(el.getAttribute("data-target")) || false,
        addClass: el.getAttribute("data-add-target-class") || false
      },
      offset: {
        all: unitCalc(el.getAttribute("data-offset"), triggerHeight) || false,
        top: unitCalc(el.getAttribute("data-offset-top"), triggerHeight) || offsetAll || 1,
        right: unitCalc(el.getAttribute("data-offset-right"), triggerHeight) || offsetAll || 1,
        bottom: unitCalc(el.getAttribute("data-offset-bottom"), triggerHeight) || offsetAll || 1,
        left: unitCalc(el.getAttribute("data-offset-left"), triggerHeight) || offsetAll || 1
      },
      trigger:  {
        el: trigger,
        w: trigger == window ? trigger.innerWidth : trigger.clientWidth,
        h: trigger == window ? trigger.innerHeight : trigger.clientHeight,
        top: trigger == window ? 0 : trigger.getBoundingClientRect().top,
        right: trigger == window ? trigger.innerWidth : trigger.getBoundingClientRect().right,
        bottom: trigger == window ? trigger.innerHeight : trigger.getBoundingClientRect().bottom,
        left: trigger == window ? 0 : trigger.getBoundingClientRect().left,
        mX: rest[0],
        mY: rest[1],
        sX: 0,
        sY: 0
      },
      mouse: {
        is: el.hasAttribute("data-mouse") || false,
        active: false,
        x: rest[0],
        y: rest[1],
        xRest: rest[0],
        yRest: rest[1]
      },
      txtSpan: {
        is: el.hasAttribute("data-spanify") || false
      },
      inview: {
        is: el.hasAttribute("data-inview") || false,
        active: false,
        x: 0,
        y: 0,
        scrub: el.getAttribute("data-inview") == 'scrub' || false,
      }
    }
  }

  function updateObj(el) {

    triggerHeight = (el.trigger.el == window ? el.trigger.el.innerHeight : el.trigger.el.clientHeight)
    offsetAll = unitCalc(el.el.getAttribute("data-offset"), triggerHeight) || false

    el.offset.top = unitCalc(el.el.getAttribute("data-offset-top"), triggerHeight) || offsetAll || 1
    el.offset.right = unitCalc(el.el.getAttribute("data-offset-right"), triggerHeight) || offsetAll || 0
    el.offset.bottom = unitCalc(el.el.getAttribute("data-offset-bottom"), triggerHeight) || offsetAll || 1
    el.offset.left = unitCalc(el.el.getAttribute("data-offset-left"), triggerHeight) || offsetAll || 0
    el.offset.all = unitCalc(el.el.getAttribute("data-offset"), triggerHeight) || false
    el.trigger.w = el.trigger.el == window ? el.trigger.el.innerWidth : el.trigger.el.clientWidth
    el.trigger.h = el.trigger.el == window ? el.trigger.el.innerHeight : el.trigger.el.clientHeight
    el.trigger.top = el.trigger.el == window ? 0 : el.trigger.el.getBoundingClientRect().top
    el.trigger.right = el.trigger.el == window ? el.trigger.el.innerWidth : el.trigger.el.getBoundingClientRect().right
    el.trigger.bottom = el.trigger.el == window ? el.trigger.el.innerHeight : el.trigger.el.getBoundingClientRect().bottom
    el.trigger.left = el.trigger.el == window ? 0 : el.trigger.el.getBoundingClientRect().left
    el.trigger.mX = el.mouse.xRest
    el.trigger.mY = el.mouse.yRest
    el.mouse.x = el.mouse.xRest
    el.mouse.y = el.mouse.yRest
  }

  /* Wrap words and characters in span */
  function txtSpan(el) {
    let stackWordDelay = 0,
        stackLetterDelay = 0,
        spanStack = el.stack || 20,
        spanDuration = el.duration || 500,
        spanDelay = el.delay || 0,
        spanEasing = el.easing || 'cubic-bezier(.6,0,0,1)'

    el.el.innerHTML = el.el.innerHTML
      .replace(/<br>/g, "\n")
      .replace(/[^\s]/g, "<span><span>$&</span></span>")
      .replace(/[^\s]+/g, "<span><span>$&</span></span>")
      .replace(/\n/g, "<br>")

    el.el.querySelectorAll(":scope > span > span").forEach((span) => {
      stackWordDelay = Number((stackWordDelay + spanStack).toFixed(2));
      span.style.transitionDelay = `${stackWordDelay + spanDelay}ms`;
      span.style.transitionDuration = `${spanDuration}ms`;
      span.style.transitionTimingFunction = spanEasing;
    })

    el.el.querySelectorAll(":scope > span > span > span").forEach((childSpan) => {
      stackLetterDelay = Number((stackLetterDelay + spanStack).toFixed(2));
      childSpan.style.transitionDelay = `${stackLetterDelay + spanDelay}ms`;
      childSpan.style.transitionDuration = `${spanDuration}ms`;
      childSpan.style.transitionTimingFunction = spanEasing;
      childSpan.firstChild.setAttribute("data-content", childSpan.textContent);
    })
  }

  /* update mouse */
  function updateMouse(el,m) {

    tX = m.x - (el.trigger.el == window ? 0 : el.trigger.el.getBoundingClientRect().left)
    tY = m.y - (el.trigger.el == window ? 0 : el.trigger.el.getBoundingClientRect().top)

    if (m.type != 'mouseleave' && tX > 0 && tX < el.trigger.w && tY > 0 && tY < el.trigger.h) {
      el.trigger.mX = tX / el.trigger.w
      el.trigger.mY = tY / el.trigger.h
      el.mouse.active = true
      updateActiveElements()
      return
    }
    el.trigger.mX = el.mouse.xRest
    el.trigger.mY = el.mouse.yRest
  }

  /* Mouse Move */
  function move(el) {
    lerpX = lerp(el.mouse.x, el.trigger.mX, el.lerp)
    lerpY = lerp(el.mouse.y, el.trigger.mY, el.lerp)
    if (Math.abs(el.trigger.mX - lerpX) + Math.abs(el.trigger.mY - lerpY) > 0.0001) {
      el.mouse.x = lerpX
      el.mouse.y = lerpY
      el.el.style.setProperty("--mx", el.mouse.x)
      el.el.style.setProperty("--my", el.mouse.y)
      if (el.target.el) {
        el.target.el.style.setProperty("--mx", el.mouse.x)
        el.target.el.style.setProperty("--my", el.mouse.y)
      }
      return
    }
    el.mouse.active = false;
    updateActiveElements()
  }

  /* Scrub Scroll */
  function scrub(el) {
    lerpX = lerp(el.inview.x, el.trigger.sX, el.lerp)
    lerpY = lerp(el.inview.y, el.trigger.sY, el.lerp)
    if (Math.abs(el.trigger.sX - lerpX) + Math.abs(el.trigger.sY - lerpY) > 0.0001) {
      el.inview.x = lerpX
      el.inview.y = lerpY
      el.el.style.setProperty("--sx", el.inview.x)
      el.el.style.setProperty("--sy", el.inview.y)
      if (el.target.el) {
        el.target.el.style.setProperty("--sx", el.inview.x)
        el.target.el.style.setProperty("--sy", el.inview.y)
      }
      return;
    }
    el.inview.active = false
    updateActiveElements()
  }  

  /* In view */
  function isInViewport(el) {

    let isInViewX = el.trigger.left + el.trigger.w >= el.offset.right &&
        el.trigger.right - el.trigger.w <= window.innerWidth - el.offset.left
    let isInViewY = el.trigger.top + el.trigger.h >= el.offset.bottom &&
        el.trigger.bottom - el.trigger.h <= window.innerHeight - el.offset.top

    totScrubX = el.trigger.w + window.innerWidth - el.offset.left - el.offset.right
    curScrubX = window.innerWidth - el.trigger.left - el.offset.left
    progScrubX = clamp(curScrubX, 0, totScrubX) / totScrubX

    totScrubY = el.trigger.h + window.innerHeight - el.offset.top - el.offset.bottom
    curScrubY = window.innerHeight - el.trigger.top - el.offset.top
    progScrubY = clamp(curScrubY, 0, totScrubY) / totScrubY

    if (isInViewX && isInViewY) {
      el.inview.active = true
      updateActiveElements()
      el.trigger.sX = progScrubX
      el.trigger.sY = progScrubY
      return true
    }

    if (!isInViewX && el.trigger.sX != 0 && el.trigger.sX != 1) el.trigger.sX = Math.round(progScrubX)

    if (!isInViewY && el.trigger.sY != 0 && el.trigger.sY != 1) el.trigger.sY = Math.round(progScrubY)

    return (isInViewX && isInViewY)
  }

  /* Check if in view and set attr inview */
  function trigInView(scrollPos) {
    inViewEls.forEach((el) => {

      if (!el.inview.is) return

      updateScrollPos(el)
      if (isInViewport(el) == true) {
        if (!el.el.hasAttribute("inview", "")) el.el.setAttribute("inview", "")
        if (el.target.el && !el.target.el.hasAttribute("inview", "")) el.target.el.setAttribute("inview", "")
        if (el.target.el && el.target.addClass && !el.target.el.classList.contains(el.target.addClass)) el.target.el.classList.add(el.target.addClass)
        return false
      }
      if (el.el.hasAttribute("inview", "")) el.el.removeAttribute("inview", "")
      if (el.target.el && el.target.el.hasAttribute("inview", "")) el.target.el.removeAttribute("inview", "")
      if (el.target.el && el.target.addClass && el.target.el.classList.contains(el.target.addClass)) el.target.el.classList.remove(el.target.addClass)
      return true
    })
  }

  /* update scroll */
  function updateScrollPos(el) {
    el.trigger.top = el.trigger.el == window ? 0 : el.trigger.el.getBoundingClientRect().top
    el.trigger.right = el.trigger.el == window ? el.trigger.el.innerWidth : el.trigger.el.getBoundingClientRect().right
    el.trigger.bottom = el.trigger.el == window ? el.trigger.el.innerHeight : el.trigger.el.getBoundingClientRect().bottom
    el.trigger.left = el.trigger.el == window ? 0 : el.trigger.el.getBoundingClientRect().left
  }

  /* Check scroll position */
  function checkScrollPos() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        trigInView()
        ticking = false
      })
      ticking = true
    }
  }       

  function resize() {
    inViewEls.forEach((el) => updateObj(el))
  }

  function updateActiveElements() {
    activeElements = inViewEls.filter((el) => {
      return el.mouse.active || (el.inview.active && el.inview.scrub )
    })
  }

  function render() {
    if(activeElements.length) {
      activeElements.forEach((el) => {
        el.mouse.active ? move(el) : ''
        el.inview.active && el.inview.scrub ? scrub(el) : ''
      })
    }
    window.requestAnimationFrame(render)
  }

  /* Initialize */
  function init() {
    inViewEls.forEach((el,i) => {     
      updateObj(el)
      updateActiveElements()
      if(el.txtSpan.is) txtSpan(el)
      if(el.mouse.is) {
        el.trigger.el.addEventListener("mouseleave", (m) => {
          requestAnimationFrame(() => updateMouse(el,m))
        })
        el.trigger.el.addEventListener("mousemove", (m) => {
          requestAnimationFrame(() => updateMouse(el,m))
        })
      }
      el.el.style.setProperty("--mx", el.mouse.xRest)
      el.el.style.setProperty("--my", el.mouse.yRest)
      if (el.target.el) {
        el.target.el.style.setProperty("--sx", el.inview.x)
        el.target.el.style.setProperty("--sy", el.inview.y)
      }
      if (el.delay) {
        if (el.target.el) {
          el.target.el.style.transitionDelay = `${el.delay}ms`
        } else { 
          el.el.style.transitionDelay = `${el.delay}ms`
        }
      }
      if (el.duration) {
        if (el.target.el) {
          el.target.el.style.transitionDuration = `${el.duration}ms`
        } else { 
          el.el.style.transitionDuration = `${el.duration}ms`
        }
      }
      if (el.easing) {
        if (el.target.el) {
          el.target.el.style.transitionTimingFunction = el.easing
        } else { 
          el.el.style.transitionTimingFunction = el.easing
        }
      }
    })
    checkScrollPos()
    render()
  }

  document.addEventListener("scroll", checkScrollPos)
  window.addEventListener("resize", resize)
  document.addEventListener("DOMContentLoaded", init)
})()
