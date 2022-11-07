(function () {
  
  const lerpTreshold = 0.0001
  let inViewEls = []
  let vw = window.innerWidth
  let vh = window.innerHeight
  
  /* Linear Interpolation Functions */
  const lerp = (x, y, a) => x * (1 - a) + y * a
  const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a))
  const invlerp = (x, y, a) => clamp((a - x) / (y - x))
  const range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a))

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
  
  /* Remap progress value */
  function remapInterpolation(remap,progress) {
    if (!remap) return false
    let val
    remap.forEach((e,i) => {
      const prev = remap[i-1] ? remap[i-1][0] : 0
      const next = remap[i+1] || [1,e[1]]
      if (e[0] >= prev && e[0] <= progress) {
        val = range(e[0],next[0],e[1],next[1],progress)
        val = isNaN(val) ? next[1] : val
      }
    })
    return val
  }
  
  /* Format remap dataset */
  function formatRemap(data) {
    if (!data) return false
    let checkdata = data.split(",").map(e => e.split(":").map(e => e.replace(/[^0-9.\-]/g, '') ).map(Number))
    if (checkdata.every((d)=> (isNaN(d[0]) || isNaN(d[1])))) return false
    checkdata.forEach((d)=> d[0] = d[0]/100 )
    return checkdata
  }

  /* Compose inViewEls object */
  function composeObj(el) {
    const data = el.dataset
    const remap = formatRemap(data.remap)
    const remapX = formatRemap(data.remapX) || remap
    const remapY = formatRemap(data.remapY) || remap
    const remapMouse = formatRemap(data.remapMouse) || remap
    const remapMouseX = formatRemap(data.remapMouseX) || remapMouse
    const remapMouseY = formatRemap(data.remapMouseY) || remapMouse
    const remapScroll = formatRemap(data.remapScroll) || remap
    const remapScrollX = formatRemap(data.remapScrollX) || remapScroll
    const remapScrollY = formatRemap(data.remapScrollY) || remapScroll
    const trigger = data.trigger == 'window' ? window : 
                    el.closest(data.trigger) || 
                    document.querySelector(data.trigger) || el
    const isWindow = trigger == window ? true : false
    const triggerBC = isWindow ? false : trigger.getBoundingClientRect()
    const triggerHeight = (isWindow ? trigger.innerHeight : trigger.clientHeight)
    const offsetAll = unitCalc(data.offset, triggerHeight) || false
    const rest = data.rest ? data.rest.split(",") : [0.5, 0.5]
            
    return {
      el: el,
      lerp: Number((100 - (data.lerp || 90)) / 100),
      easing: data.easing || false,
      stack: Number(data.stack) || false,
      duration: data.duration || false,
      delay: Number(data.delay) || false,
      target: {
        el: el.closest(data.target) || document.querySelector(data.target) || false,
        addClass: data.addTargetClass || false
      },
      offset: {
        all: unitCalc(data.offset, triggerHeight) || false,
        top: unitCalc(data.offsetTop, triggerHeight) || offsetAll || 1,
        right: unitCalc(data.offsetRight, triggerHeight) || offsetAll || 1,
        bottom: unitCalc(data.offsetBottom, triggerHeight) || offsetAll || 1,
        left: unitCalc(data.offsetLeft, triggerHeight) || offsetAll || 1
      },
      trigger:  {
        el: trigger,
        w: isWindow ? trigger.innerWidth : trigger.clientWidth,
        h: triggerHeight,
        top: isWindow ? 0 : triggerBC.top,
        right: isWindow ? trigger.innerWidth : triggerBC.right,
        bottom: isWindow ? trigger.innerHeight : triggerBC.bottom,
        left: isWindow ? 0 : triggerBC.left,
        mX: rest[0],
        mY: rest[1],
        sX: 0,
        sY: 0
      },
      mouse: {
        is: el.hasAttribute('data-mouse'),
        active: false,
        x: rest[0],
        y: rest[1],
        xRest: rest[0],
        yRest: rest[1],
        remapX: remapMouseX,
        remapY: remapMouseY
      },
      txtSpan: {
        is: el.hasAttribute('data-spanify')
      },
      inview: {
        is: el.hasAttribute('data-inview'),
        active: false,
        x: 0,
        y: 0,
        scrub: (data.scrub == 'false') ? false : true,
        remapX: remapScrollX,
        remapY: remapScrollY
      }
    }
  }
  
  /* Update inViewEls object */
  function updateObj(el) {
    const trig = el.trigger.el
    const isWindow = trig == window ? true : false
    const trigBC = isWindow ? false : trig.getBoundingClientRect()
    const triggerHeight = isWindow ? trig.innerHeight : trig.clientHeight
    const data = el.el.dataset
    const offsetAll = unitCalc(data.offset, triggerHeight) || false
    const rest = [el.mouse.xRest, el.mouse.yRest]

    el.offset.all = offsetAll || false
    el.offset.top = unitCalc(data.offsetTop, triggerHeight) || offsetAll || 1
    el.offset.right = unitCalc(data.offsetRight, triggerHeight) || offsetAll || 1
    el.offset.bottom = unitCalc(data.offsetBottom, triggerHeight) || offsetAll || 1
    el.offset.left = unitCalc(data.offsetLeft, triggerHeight) || offsetAll || 1
    el.trigger.w = isWindow ? trig.innerWidth : trig.clientWidth
    el.trigger.h = triggerHeight
    el.trigger.top = isWindow ? 0 : trigBC.top
    el.trigger.right = isWindow ? trig.innerWidth : trigBC.right
    el.trigger.bottom = isWindow ? trig.innerHeight : trigBC.bottom
    el.trigger.left = isWindow ? 0 : trigBC.left
    el.trigger.mX = el.mouse.x = rest[0]
    el.trigger.mY = el.mouse.y = rest[1]
  }
  
  /* Push elements to inViewEls */
  document.querySelectorAll("[data-mouse], [data-inview], [data-spanify]")
    .forEach((el)=> inViewEls.push(composeObj(el)) )
  
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
  
  /* Mouse Move */
  function move(el) {
    const x = el.mouse.x
    const y = el.mouse.y
    const mx = el.trigger.mX
    const my = el.trigger.mY
    const target = el.target.el
    const lerpX = lerp(x, mx, el.lerp)
    const lerpY = lerp(y, my, el.lerp)
    if (Math.abs(mx - lerpX) + Math.abs(my - lerpY) > lerpTreshold) {
      el.mouse.x = lerpX
      el.mouse.y = lerpY
      el.el.style.setProperty("--mx", x)
      el.el.style.setProperty("--my", y)
      const remapX = remapInterpolation(el.mouse.remapX,x)
      const remapY = remapInterpolation(el.mouse.remapY,y)
      if (remapX) el.el.style.setProperty("--mx-remap", remapX)
      if (remapY) el.el.style.setProperty("--my-remap", remapY)
      if (target) {
        if (remapX) target.style.setProperty("--mx-remap", remapX)
        if (remapY) target.style.setProperty("--my-remap", remapY)
        target.style.setProperty("--mx", x)
        target.style.setProperty("--my", y)
      }
      window.requestAnimationFrame(() => move(el))
      return
    }
    el.mouse.active = false
  }

  /* update mouse */
  function updateMouse(el,m) {
    const trig = el.trigger
    const isWindow = trig.el == window
    const trigBC = isWindow ? false : trig.el.getBoundingClientRect()

    const tX = m.x - (isWindow ? 0 : trigBC.left)
    const tY = m.y - (isWindow ? 0 : trigBC.top)

    if (m.type != 'mouseleave' && tX > 0 && tX < trig.w && tY > 0 && tY < trig.h) {
      el.trigger.mX = tX / trig.w
      el.trigger.mY = tY / trig.h
      if (!el.mouse.active) {
        el.mouse.active = true
        move(el)
      }
      return
    }
    el.trigger.mX = el.mouse.xRest
    el.trigger.mY = el.mouse.yRest
  }

  /* Scrub Scroll */
  function scrub(el) {
    const target = el.target.el
    const trig = el.trigger
    const trigX = el.trigger.sX
    const trigY = el.trigger.sY
    const lerpX = lerp(el.inview.x, trigX, el.lerp)
    const lerpY = lerp(el.inview.y, trigY, el.lerp)
    if (Math.abs(trigX - lerpX) + Math.abs(trigY - lerpY) > lerpTreshold * .9) {
      el.inview.x = Math.abs(trigX - lerpX) <= lerpTreshold ? trigX : lerpX
      el.inview.y = Math.abs(trigY - lerpY) <= lerpTreshold ? trigY : lerpY
      let remapX = remapInterpolation(el.inview.remapX,el.inview.x)
      let remapY = remapInterpolation(el.inview.remapY,el.inview.y)
      el.el.style.setProperty("--sx", el.inview.x)
      el.el.style.setProperty("--sy", el.inview.y)
      if (remapX) el.el.style.setProperty("--sx-remap", remapX)
      if (remapY) el.el.style.setProperty("--sy-remap", remapY)
      if (target) {
        if (remapX) target.style.setProperty("--sx-remap", remapX)
        if (remapY) target.style.setProperty("--sy-remap", remapY)
        target.style.setProperty("--sx", el.inview.x)
        target.style.setProperty("--sy", el.inview.y)
      }
      window.requestAnimationFrame(() => scrub(el))
      return
    }
    el.inview.active = false
  }  

  /* In view */
  function isInViewport(el) {
    const trig = el.trigger
    const offset = el.offset
    const isWindow = trig.el == window ? true : false
    const trigBC = isWindow ? false : trig.el.getBoundingClientRect()
    trig.top = isWindow ? 0 : trigBC.top
    trig.right = isWindow ? trig.el.innerWidth : trigBC.right
    trig.bottom = isWindow ? trig.el.innerHeight : trigBC.bottom
    trig.left = isWindow ? 0 : trigBC.left
    return (
      trig.left + trig.w >= offset.right &&
      trig.right - trig.w <= vw - el.offset.left &&
      trig.top + trig.h >= offset.bottom &&
      trig.bottom - trig.h <= vh - offset.top
    )
  }

  /* Check if in view and set attr inview */
  function updateScroll() {
    inViewEls.forEach((el) => {
      if (!el.inview.is) return
      
      const trig = el.trigger
      const target = el.target.el
      const targetClass = el.target.addClass
      
      if (isInViewport(el) == true) {
        const offset = el.offset
        const totX = trig.w + vw - offset.left - offset.right
        const totY = trig.h + vh - offset.top - offset.bottom
        const curX = vw - trig.left - offset.left
        const curY = vh - trig.top - offset.top
        trig.sX = clamp(curX, 0, totX) / totX
        trig.sY = clamp(curY, 0, totY) / totY
        if (!el.inview.active && el.inview.scrub) {
          el.inview.active = true
          scrub(el)
        }
        el.el.setAttribute("inview", "")
        if (target) {
          target.setAttribute("inview", "")
          if (targetClass) target.classList.add(targetClass)
        }
        return false
      }
      el.el.removeAttribute("inview", "")
      if (target) {
        target.removeAttribute("inview", "")
        if (targetClass) target.classList.remove(targetClass)
      }
      trig.sX = Math.round(trig.sX)
      trig.sY = Math.round(trig.sY)
      return true
    })
  }

  /* Update when window resize */
  function resize() {
    vw = window.innerWidth
    vh = window.innerHeight
    inViewEls.forEach((el) => updateObj(el))
    window.requestAnimationFrame(() => updateScroll())
  }

  /* Initialize on loeaded */
  function init() {
    inViewEls.forEach((el,i) => {     
      updateObj(el)
      if (el.txtSpan.is) txtSpan(el)
      if (el.mouse.is) {
        const x = el.mouse.xRest
        const y = el.mouse.yRest
        const remapX = remapInterpolation(el.mouse.remapX,x)
        const remapY = remapInterpolation(el.mouse.remapY,y)
        el.trigger.el.addEventListener("mouseleave", (m) => {
          window.requestAnimationFrame(() => updateMouse(el,m))
        })
        el.trigger.el.addEventListener("mousemove", (m) => {
          window.requestAnimationFrame(() => updateMouse(el,m))
        })
        el.el.style.setProperty("--mx", x)
        el.el.style.setProperty("--my", y)
        if (remapX !== false) el.el.style.setProperty("--mx-remap", remapX)
        if (remapY !== false) el.el.style.setProperty("--my-remap", remapY)
        if (el.target.el) {
          el.target.el.style.setProperty("--mx", el.mouse.xRest)
          el.target.el.style.setProperty("--my", el.mouse.yRest)
          if (remapX !== false) el.target.el.style.setProperty("--mx-remap", remapX)
          if (remapY !== false) el.target.el.style.setProperty("--my-remap", remapY)
        }
      }
      if (el.inview.is && el.inview.scrub) {
        const x = el.inview.x
        const y = el.inview.y
        const remapX = remapInterpolation(el.inview.remapX,x)
        const remapY = remapInterpolation(el.inview.remapY,y)
        el.el.style.setProperty("--sx", x)
        el.el.style.setProperty("--sy", y)
        if (remapX !== false) el.el.style.setProperty("--sx-remap", remapX)
        if (remapY !== false) el.el.style.setProperty("--sy-remap", remapY)
        if (el.target.el) {
          el.target.el.style.setProperty("--sx", x)
          el.target.el.style.setProperty("--sy", y)
          if (remapX !== false) el.target.el.style.setProperty("--sx-remap", remapX)
          if (remapY !== false) el.target.el.style.setProperty("--sy-remap", remapY)
        }
      }
      if (el.delay) el.el.style.transitionDelay = `${el.delay}ms`
      if (el.duration) el.el.style.transitionDuration = `${el.duration}ms`
      if (el.easing) el.el.style.transitionTimingFunction = el.easing
      if (el.target.el) {
        if (el.delay) el.target.el.style.transitionDelay = `${el.delay}ms`
        if (el.duration) el.target.el.style.transitionDuration = `${el.duration}ms`
        if (el.easing) el.target.el.style.transitionTimingFunction = el.easing
      }
    })
    window.requestAnimationFrame(() => updateScroll())
  }

  document.addEventListener("scroll", ()=> window.requestAnimationFrame(() => updateScroll()))
  window.addEventListener("resize", ()=> window.requestAnimationFrame(() => resize()))
  document.addEventListener("DOMContentLoaded", ()=> window.requestAnimationFrame(() => init()))
})()
