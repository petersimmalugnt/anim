# anim

data-spanify              (Wrappar ord och bokstäver i spans och adderar transition dur, stack, ease)
data-mouse                (Reaktiv animation baserat på musposition över trigger)
data-inview               (data-inview="scrub" för reaktiv animation)
data-lerp                 (0—100 hur mjuka reaktiva animationerna ska va)
data-target               (id, class, tag får 'inview' attribute när triggad.)
data-add-target-class     (Lägg till class på target när triggad)
data-trigger              (id, class, tag som triggar)
data-offset               (offset för alla sidor)
data-offset-top           (px, %, vw, vh)
data-offset-right         (px, %, vw, vh)
data-offset-bottom        (px, %, vw, vh)
data-offset-left          (px, %, vw, vh)
data-easing               (cubic-bezer() eller css easings)
data-stack                (ms)
data-delay                (ms)
data-duration             (ms)
data-rest                 (resting state 0-1)
data-remap                progress value remap ex: data-remap="0%: 20, 50%: 100, 100%: 350"
data-remapX
data-remapY
data-remap-mouse          only remap mouse progress value
data-remap-mouse-X
data-remap-mouse-Y
data-remap-scroll         only remap scroll progress value
data-remap-scroll-x
data-remap-scroll-y

TODO:
· data-desktop, data-mobile (Boleaon. Stänga av på mobil och desktop)
· data-wrapper (Välja scope för scroll listener. Nu är det bara window)
