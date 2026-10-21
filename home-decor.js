/* Decorative canvases. Loaded after the homepage HTML so the title does not wait on them. */
/* ix-hero ambient background — variant A "3 hubs".
   ----------------------------------------------------------------
   Three hub points placed asymmetrically across the hero, each
   slowly cycling spokes in and out, with a gentle breathing ring
   around the hub itself. Decorative only; the canvas is z-index 0
   and pointer-events:none, so the search input + sources block
   render above and remain fully interactive.

   Tuned to the values from the v4 mockup (variant A, defaults):
     SPEED   = 1.0  — frame increment per RAF tick
     OPACITY = 1.0  (1.6× boost on mobile for legibility)
   Both are hard-coded here; tune them inline if you want to dial
   intensity up or down later.

   Disabled by CSS under prefers-reduced-motion. Pauses via
   IntersectionObserver while the hero is offscreen, so long
   sessions on the page don't burn cycles repainting nothing. */
(function(){
  if (typeof window === 'undefined') return;
  /* Defensive double-check: the CSS already hides the canvas under
     prefers-reduced-motion, but skipping the RAF loop is cleaner. */
  if (window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.querySelector('.ix-hero .ix-hero-bg');
  if (!canvas) return;
  /* The blocking stylesheet hides this canvas. Skip the animation so the
     homepage does not repaint a picture the reader cannot see. */
  if (window.getComputedStyle(canvas).display === 'none') return;
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  var SPEED = 1.0;
  /* Mobile (≤600px) gets a stronger opacity multiplier — at small
     scale the 0.14 stroke alpha disappears against the cream
     background on iPhone Safari. 1.6× brings it back into legible
     range without overwhelming the desktop look. */
  var IS_MOBILE = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
  var OPACITY = IS_MOBILE ? 1.6 : 1.0;
  /* Recompute on orientation/viewport change so the opacity boost
     is right after a portrait↔landscape rotation or after a bfcache
     restore. */
  function refreshMobileFlag(){
    IS_MOBILE = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
    OPACITY = IS_MOBILE ? 1.6 : 1.0;
  }
  window.addEventListener('orientationchange', refreshMobileFlag);
  window.addEventListener('pageshow', refreshMobileFlag);
  /* Brand teal, expressed as RGB triplet so we can vary alpha
     freely. Matches --color-brand (#155A50) with a touch more
     saturation — identical to the value tuned in the mockups. */
  var COLOR = '25, 152, 126';

  var dpr = window.devicePixelRatio || 1;

  function makeBranches(n, minLen, maxLen){
    var arr = [];
    for (var i = 0; i < n; i++){
      arr.push({
        angle: (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.3,
        len:   minLen + Math.random() * (maxLen - minLen),
        delay: Math.random() * 8
      });
    }
    return arr;
  }

  /* Three hubs, positions in unit-fraction space so they scale to
     any hero height/width. Spoke counts (5/6/5) and lengths come
     straight from variant A in the V4 mockup. */
  var hubs = [
    { cx: 0.20, cy: 0.30, branches: makeBranches(5, 100, 160) },
    { cx: 0.78, cy: 0.65, branches: makeBranches(6, 100, 160) },
    { cx: 0.62, cy: 0.22, branches: makeBranches(5, 100, 160) }
  ];

  /* `sized` flips to true once we successfully size the canvas. iOS
     Safari can fire the inline script before the hero parent has
     been laid out, in which case getBoundingClientRect() returns
     0×0 and the canvas keeps its useless 300×150 default. We retry
     on every observable event until we land a real size. */
  var sized = false;
  function resize(){
    var rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    canvas.width  = Math.round(rect.width  * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sized = true;
    return true;
  }

  function getSize(){
    return { w: canvas.width / dpr, h: canvas.height / dpr };
  }

  function drawHub(cx, cy, frame, scale){
    /* Hub core — small filled dot. */
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + COLOR + ',' + (0.32 * OPACITY) + ')';
    ctx.fill();
    /* Slow breathing ring — radius and alpha out-of-phase so the
       ring fades as it expands. ~13s period at SPEED=1. */
    var breath = (Math.sin(frame * 0.008) + 1) / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, (3.5 + breath * 8) * scale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(' + COLOR + ',' + (0.15 * OPACITY * (1 - breath)) + ')';
    ctx.lineWidth = IS_MOBILE ? 1 : 0.6;
    ctx.stroke();
  }

  function drawBranches(cx, cy, branches, frame, scale){
    for (var i = 0; i < branches.length; i++){
      var b = branches[i];
      /* Each spoke has its own phase (b.delay) so the spokes around
         a single hub don't all peak together — looks more organic. */
      var t = ((frame * 0.002) + b.delay) % 1;
      var alpha = Math.sin(t * Math.PI) * 0.14 * OPACITY;
      var len = b.len * scale;
      var ex = cx + Math.cos(b.angle) * len;
      var ey = cy + Math.sin(b.angle) * len;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = 'rgba(' + COLOR + ',' + alpha + ')';
      ctx.lineWidth = IS_MOBILE ? 1 : 0.6;
      ctx.stroke();
      /* Endpoint dot, slightly more opaque than its spoke. */
      ctx.beginPath();
      ctx.arc(ex, ey, 1.4 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + COLOR + ',' + (alpha * 2.5) + ')';
      ctx.fill();
    }
  }

  var frame = 0;
  var rafId = null;

  function tick(){
    frame += SPEED;
    var s = getSize();
    /* Scale spoke length and hub radius with hero size. Spokes
       were tuned for a ~600px-tall desktop hero; on a short mobile
       hero (~250px) the same absolute lengths look cramped and
       clip. We map the smaller canvas dimension into the range
       [0.55, 1.0] so mobile renders a proportionally tighter
       version of the same composition. */
    var dim = Math.min(s.w, s.h);
    var scale = Math.max(0.55, Math.min(1, dim / 600));
    ctx.clearRect(0, 0, s.w, s.h);
    for (var i = 0; i < hubs.length; i++){
      var h = hubs[i];
      drawHub(h.cx * s.w, h.cy * s.h, frame, scale);
      drawBranches(h.cx * s.w, h.cy * s.h, h.branches, frame, scale);
    }
    rafId = requestAnimationFrame(tick);
  }

  function start(){ if (rafId === null) tick(); }
  function stop(){
    if (rafId !== null){ cancelAnimationFrame(rafId); rafId = null; }
  }

  resize();
  window.addEventListener('resize', resize);
  /* iOS Safari: layout sometimes finishes after the inline script
     runs, and also after orientation changes / bfcache restores.
     Re-attempt the sizing on each of these events so we never end
     up animating into a 300×150 internal canvas stretched up to
     the hero's CSS width. */
  window.addEventListener('orientationchange', resize);
  window.addEventListener('load', resize);
  window.addEventListener('pageshow', resize);
  /* Belt-and-braces retry loop: if we still don't have a real size
     after paint (e.g. fonts not yet loaded so the H1 hasn't
     reflowed), poll for up to ~1.5s. Stops the moment we get a
     non-zero rect. */
  if (!sized){
    var retries = 0;
    var retryId = setInterval(function(){
      if (resize() || ++retries > 15) clearInterval(retryId);
    }, 100);
  }

  /* Pause when the hero scrolls offscreen — saves cycles during
     long scroll sessions on the index page. Falls back to
     always-on if the browser lacks IntersectionObserver. */
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      if (entries[0].isIntersecting){
        /* If we never got a real size, try once more now that the
           canvas is in view — its parent must be laid out for the
           IO to fire. */
        if (!sized) resize();
        start();
      } else stop();
    }, { threshold: 0 });
    io.observe(canvas);
  } else {
    start();
  }
})();

/* profile-gate gene-labeled DNA helix ambient.
     ----------------------------------------------------------------
     Two slowly-rotating double helices flank the centered .gate-page
     content. Floating gene labels (MTHFR, VDR, CYP2D6, APOE, COMT,
     CYP1A2) drift along each strand — these names intentionally echo
     the roadmap copy elsewhere about genetic-variant-aware
     personalization, so the background reinforces the message
     instead of just decorating it.

     Tuned to match the v8 mockup defaults (variant C):
       SPEED   = 1.0
       OPACITY = 1.0

     Disabled by CSS for prefers-reduced-motion. Paused via
     IntersectionObserver while #profile-gate is hidden (it starts
     display:none on the index page) or scrolled offscreen, so the
     RAF loop only burns cycles when actually rendering. */
  (function(){
    if (typeof window === 'undefined') return;
    if (window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var canvas = document.querySelector('#profile-gate .gate-bg');
    if (!canvas) return;
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;

    /* Lowered from 1.0 by ~30% so the helix rotation reads as
       genuinely meditative — at SPEED=1.0 it felt too active behind
       the centered hero copy. */
    var SPEED   = 0.7;
    /* Lowered from 1.0 to make the helix more subtle. The strands +
       gene labels were reading too prominent at full opacity behind
       the centered hero copy; 0.6 keeps everything legible but
       recedes into the background more gracefully. */
    var OPACITY = 0.6;
    var COLOR   = '25, 152, 126';
    var dpr     = window.devicePixelRatio || 1;
    /* The canvas is rendered taller than #profile-gate by EXTEND_TOP
       pixels and offset upward by the same amount, so the helices
       reach above the section, past the nav pill, all the way up to
       the green status banner at the top of the page. Bumped from
       200 → 350 because the section's top edge sits lower than the
       original estimate (there's nav + tab-bar padding above it
       that 200px alone didn't fully cover). */
    var EXTEND_TOP = 350;

    /* Two helices: one on the left, one on the right, framing the
       centered .gate-page content (440px max-width). On wider
       viewports they sit at ~18% / 82% of canvas width; on narrower
       viewports (≤700px) they would crowd the copy, so we hide the
       canvas entirely on phones — see the mobile media query below. */
    var helices = [
      {
        cxF: 0.18,
        slots: [0.18, 0.42, 0.65, 0.85],
        slotLabels: ['MTHFR', 'VDR', 'CYP2D6', 'APOE']
      },
      {
        cxF: 0.82,
        slots: [0.22, 0.50, 0.78],
        slotLabels: ['COMT', 'CYP1A2', 'BDNF']
      }
    ];

    /* Pre-bake the slot objects so the labels are stable across
       frames (the v8 mockup randomized them each load — fine for
       a brainstorm, but for production we want consistent text). */
    helices.forEach(function(he){
      he.slots = he.slots.map(function(t, i){
        return { t: t, label: he.slotLabels[i] };
      });
    });

    function resize(){
      var rect = canvas.parentElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      /* Canvas is sized to (parent height + EXTEND_TOP) and offset
         upward by EXTEND_TOP, so the drawing area extends above the
         section. Internal coordinates run from (0, 0) at the top of
         the extended area down to (w, parentHeight + EXTEND_TOP) at
         the section's bottom edge — y0 = 0 in the renderer means
         "very top of the visible animation," not "top of the
         section." */
      var canvasH = rect.height + EXTEND_TOP;
      canvas.width  = Math.round(rect.width  * dpr);
      canvas.height = Math.round(canvasH    * dpr);
      canvas.style.width  = rect.width + 'px';
      canvas.style.height = canvasH    + 'px';
      canvas.style.top    = '-' + EXTEND_TOP + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getSize(){
      return { w: canvas.width / dpr, h: canvas.height / dpr };
    }

    function alpha(a){ return 'rgba(' + COLOR + ',' + (a * OPACITY) + ')'; }

    /* Vertical helix between (cx, y0) → (cx, y1) with rotation
       phase. Renders both strands and the base-pair rungs. */
    function renderHelix(cx, y0, y1, helixW, turns, phaseShift){
      var samples = 80;
      // Two strands, offset by π so they intertwine.
      function strand(offset){
        ctx.beginPath();
        for (var i = 0; i <= samples; i++){
          var t = i / samples;
          var yy = y0 + t * (y1 - y0);
          var ang = t * turns * Math.PI * 2 + phaseShift + offset;
          var xx = cx + Math.sin(ang) * helixW;
          if (i === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.strokeStyle = alpha(0.22);
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
      strand(0);
      strand(Math.PI);
      // Base-pair rungs every 4 samples — alpha tied to which strand
      // is currently in front (cos > 0 = front, brighter rung).
      for (var j = 0; j <= samples; j += 4){
        var t = j / samples;
        var yy = y0 + t * (y1 - y0);
        var a1 = t * turns * Math.PI * 2 + phaseShift;
        var a2 = a1 + Math.PI;
        var x1 = cx + Math.sin(a1) * helixW;
        var x2 = cx + Math.sin(a2) * helixW;
        var depthFront = (Math.cos(a1) + 1) / 2;
        ctx.beginPath();
        ctx.moveTo(x1, yy);
        ctx.lineTo(x2, yy);
        ctx.strokeStyle = alpha(depthFront * 0.18);
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    /* Renders a gene label anchored at fractional position `t` along
       the helix. The label sits to whichever side of the strand is
       currently facing forward, with a faint connector tick. */
    function renderGeneLabel(cx, y0, y1, helixW, turns, phaseShift, slot){
      var yy = y0 + slot.t * (y1 - y0);
      var ang = slot.t * turns * Math.PI * 2 + phaseShift;
      var xRel = Math.sin(ang); // -1..1
      var xx = cx + xRel * helixW;
      var depth = (Math.cos(ang) + 1) / 2;
      var a = 0.20 + depth * 0.20;
      var side = xRel > 0 ? 1 : -1;
      var labelX = xx + side * 14;
      ctx.font = '600 10px ui-monospace, "SF Mono", Menlo, monospace';
      ctx.fillStyle = alpha(a);
      ctx.textAlign = side > 0 ? 'left' : 'right';
      ctx.fillText(slot.label, labelX, yy + 3);
      // Connector tick from strand to label
      ctx.strokeStyle = alpha(a * 0.7);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(labelX - side * 2, yy);
      ctx.stroke();
    }

    var frame = 0;
    var rafId = null;

    function tick(){
      frame += SPEED;
      var s = getSize();
      ctx.clearRect(0, 0, s.w, s.h);
      // Helix radius is a fraction of the smaller dimension so it
      // scales with whatever viewport the gate renders into.
      var helixW = 0.07 * Math.min(s.w, s.h);
      var turns = 4;
      /* Full-bleed: strands reach the very top and bottom of the
         section so there's no empty band beneath the nav. */
      var y0 = 0;
      var y1 = s.h;
      for (var i = 0; i < helices.length; i++){
        var he = helices[i];
        var cx = he.cxF * s.w;
        // Counter-rotate the second helix (Math.PI offset) for visual
        // variety so the two helices don't appear locked together.
        var phaseShift = frame * 0.012 + i * Math.PI;
        renderHelix(cx, y0, y1, helixW, turns, phaseShift);
        for (var k = 0; k < he.slots.length; k++){
          renderGeneLabel(cx, y0, y1, helixW, turns, phaseShift, he.slots[k]);
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    function start(){ if (rafId === null) tick(); }
    function stop(){
      if (rafId !== null){ cancelAnimationFrame(rafId); rafId = null; }
    }

    resize();
    window.addEventListener('resize', resize);

    /* Pause the animation while #profile-gate is display:none or has
       been scrolled out of view. Resize on visibility-gain so the
       canvas matches the section's measured dimensions on the first
       paint after it becomes visible. */
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        if (entries[0].isIntersecting){
          resize();
          start();
        } else {
          stop();
        }
      }, { threshold: 0 });
      io.observe(canvas);
    } else {
      start();
    }
  })();

/* rs-hero funnel-plot ambient.
       ----------------------------------------------------------------
       Two small funnel plots (the inverted-triangle scatter that
       systematic reviews use to inspect publication bias) drift gently
       behind the Research hero copy. Each funnel has dashed boundary
       lines, a vertical "pooled estimate" axis, and ~50 dots drifting
       inside the cone. Decorative only — the canvas is z-index 0 and
       pointer-events:none, so the search/category bar below is fully
       interactive.

       Tuned to match the v5 mockup defaults:
         SPEED   = 1.0
         OPACITY = 1.0

       Disabled by CSS for prefers-reduced-motion; animation paused via
       IntersectionObserver while the Research view is hidden or
       scrolled offscreen, so the index landing isn't paying for an
       offscreen RAF loop. */
    (function(){
      if (typeof window === 'undefined') return;
      if (window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      var canvas = document.querySelector('.rs-hero .rs-hero-bg');
      if (!canvas) return;
      var ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return;

      var SPEED   = 1.0;
      var OPACITY = 1.0;
      var COLOR   = '25, 152, 126';
      var dpr     = window.devicePixelRatio || 1;

      /* Two funnels positioned to bracket the headline — one left of
         the title block, one right. cx/cy are unit fractions of the
         canvas; scale is a fraction of min(width, height) used to size
         the cone. */
      var funnels = [
        { cx: 0.18, cy: 0.55, scale: 0.30, dots: [] },
        { cx: 0.82, cy: 0.50, scale: 0.32, dots: [] }
      ];

      /* Generate dots biased toward the bottom of the cone (high
         precision = wider scatter). Each dot has its own oscillation
         phase so the cloud doesn't pulse in unison. */
      funnels.forEach(function(f){
        var N = 50;
        for (var i = 0; i < N; i++){
          var yT = Math.pow(Math.random(), 0.7);   // 0=apex, 1=base
          var xSpread = yT * 0.9 * (Math.random() - 0.5);
          f.dots.push({
            x: xSpread,
            y: yT,
            phase: Math.random() * Math.PI * 2,
            speed: 0.005 + Math.random() * 0.01
          });
        }
      });

      function resize(){
        var rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        canvas.width  = Math.round(rect.width  * dpr);
        canvas.height = Math.round(rect.height * dpr);
        canvas.style.width  = rect.width  + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function getSize(){
        return { w: canvas.width / dpr, h: canvas.height / dpr };
      }

      function tick(){
        var s = getSize();
        ctx.clearRect(0, 0, s.w, s.h);

        for (var fi = 0; fi < funnels.length; fi++){
          var f = funnels[fi];
          var cx = f.cx * s.w;
          var cy = f.cy * s.h;
          /* Cone size derived from the smaller hero dimension so the
             funnels stay proportional on short Research heros. */
          var sz = f.scale * Math.min(s.w, s.h);

          /* Dashed funnel boundary — V-shape from apex (top) to base. */
          ctx.setLineDash([3, 4]);
          ctx.strokeStyle = 'rgba(' + COLOR + ',' + (0.10 * OPACITY) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(cx,       cy - sz);
          ctx.lineTo(cx - sz,  cy + sz);
          ctx.moveTo(cx,       cy - sz);
          ctx.lineTo(cx + sz,  cy + sz);
          ctx.stroke();
          ctx.setLineDash([]);

          /* Vertical "pooled estimate" axis. */
          ctx.beginPath();
          ctx.moveTo(cx, cy - sz);
          ctx.lineTo(cx, cy + sz);
          ctx.strokeStyle = 'rgba(' + COLOR + ',' + (0.12 * OPACITY) + ')';
          ctx.lineWidth = 0.6;
          ctx.stroke();

          /* Dots — gently drifting in place via sin/cos jitter. The
             multiplier on phase advance is small (≤0.01 per frame at
             SPEED=1) so the motion reads as ambient, not animated. */
          for (var i = 0; i < f.dots.length; i++){
            var d = f.dots[i];
            d.phase += d.speed * SPEED;
            var x = cx + (d.x + Math.sin(d.phase) * 0.02) * sz * 2;
            var y = cy - sz + d.y * sz * 2 + Math.sin(d.phase * 0.7) * 1;
            ctx.beginPath();
            ctx.arc(x, y, 1.6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + COLOR + ',' + (0.20 * OPACITY) + ')';
            ctx.fill();
          }
        }
        rafId = requestAnimationFrame(tick);
      }

      var rafId = null;
      function start(){ if (rafId === null) tick(); }
      function stop(){
        if (rafId !== null){ cancelAnimationFrame(rafId); rafId = null; }
      }

      resize();
      window.addEventListener('resize', resize);

      /* Pause when the Research view is hidden (it starts display:none
         on the index page) or scrolls offscreen. We watch the canvas
         itself, not the section, so visibility tracks the actual
         rendering state. */
      if ('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(entries){
          if (entries[0].isIntersecting){
            /* Resize on visibility-gain in case the layout changed
               while the view was hidden (e.g. tab switch). */
            resize();
            start();
          } else {
            stop();
          }
        }, { threshold: 0 });
        io.observe(canvas);
      } else {
        start();
      }
    })();
