/* Preview-only rotation for the ten homepage hero mockups.
   Not loaded by the live site. */
(function () {
  var ARTICLES = [
    { title: "The 10 Most Dangerous Supplements (Still Legally Sold)", dek: "Documented liver failure, kidney damage, cancer, or deaths. Several of these are still legally sold in the United States — including one that's just an FDA warning away from a recall.", when: "May 9, 2026", mins: 4, date: 20260509, href: "/a/the-10-most-dangerous-supplements-still-legally-sold.html", stat: "10", statNote: "Still legally sold, with documented liver failure, kidney damage, cancer, or deaths." },
    { title: "Supplements to Preserve Muscle on Ozempic", dek: "Up to 40% of the weight lost on a GLP-1 drug can be muscle. Protein and resistance training do the heavy lifting — here's exactly where creatine, HMB, vitamin D and omega-3 fit, and what to skip.", when: "Jun 6, 2026", mins: 7, date: 20260606, href: "/a/supplements-to-preserve-muscle-on-glp-1-drugs.html", stat: "40%", statNote: "Of the weight lost on a GLP-1 drug can be muscle." },
    { title: "Supplements for Kids in Competitive Sports", dek: "For most young athletes, food, sleep and training beat anything in a tub — and the real risks are contamination and stimulants. What's safe, what's hype, and the straight answer on creatine for teens.", when: "Jun 6, 2026", mins: 8, date: 20260606, href: "/a/supplements-for-kids-in-competitive-sports.html", stat: "Food, sleep, training", statNote: "For most young athletes, those beat anything in a tub." },
    { title: "Why “Detox” Supplements Are a $3 Billion Scam", dek: "Your liver and kidneys already detoxify you. No supplement can improve on millions of years of evolution — but the industry banks on you not knowing that.", when: "Mar 29, 2026", mins: 6, date: 20260329, updated: true, href: "/a/why-detox-supplements-are-a-3-billion-scam.html", stat: "$3 billion", statNote: "The size of a category your liver and kidneys already cover." },
    { title: "Berberine: Is It Really Nature’s Ozempic?", dek: "Berberine does lower blood sugar — but comparing it to GLP-1 receptor agonists misrepresents both the mechanism and the evidence. Here's what a 500mg dose actually does, and what it doesn't.", when: "Mar 8, 2026", mins: 7, date: 20260308, updated: true, href: "/a/berberine-is-it-really-nature-s-ozempic.html", stat: "500 mg", statNote: "What that dose of berberine actually does, and what it does not." },
    { title: "The 10 Most Overhyped Supplements of 2026", dek: "The TikTok-to-trial-data gap, in 10 entries. Sea moss, turkesterone, NMN, lion's mane and more — supplements with huge marketing budgets and shockingly thin clinical evidence.", when: "May 12, 2026", mins: 4, date: 20260512, href: "/a/the-10-most-overhyped-supplements-of-2026.html", stat: "10", statNote: "Entries in the gap between marketing budgets and clinical evidence." },
    { title: "CDC Warning: Kava Poisoning Calls Have Climbed Sharply — Here's What the Data Actually Says", dek: "The April 2026 CDC MMWR reviewed 1,955 kava calls to U.S. poison centers. Serious outcomes peaked at 39% in 2024. Kratom co-use is driving the worst cases.", when: "Apr 24, 2026", mins: 6, date: 20260424, updated: true, href: "/index.html#article-4", stat: "1,955", statNote: "Kava calls to U.S. poison centers in the April 2026 CDC review. Serious outcomes peaked at 39% in 2024." },
    { title: "The Cheapest Effective Supplements vs the Priciest Hyped Ones", dek: "$5 of creatine has more clinical evidence behind it than every $1,500-a-month NAD+ IV combined. Price ≠ evidence — here's the full split between the cheap proven workhorses and the premium-priced lab toys.", when: "May 9, 2026", mins: 4, date: 20260509, href: "/a/the-cheapest-effective-supplements-vs-the-priciest-hyped-ones.html", stat: "$5", statNote: "Of creatine, set against a $1,500-a-month NAD+ IV." },
    { title: "NAD+ Precursors: Separating Hype from Longevity Evidence", dek: "NMN and NR are sold as anti-aging miracles. The mouse data is compelling — but human trials tell a much more nuanced story. Here's what's real.", when: "Apr 11, 2026", mins: 9, date: 20260411, updated: true, href: "/a/nmn-and-nad-why-raising-a-biomarker-isn-t-the-same-as-slowing-aging.html", stat: "NMN", statNote: "Sold as an anti-aging miracle. Human trials are more nuanced than the mouse data." },
    { title: "Turmeric & Liver: When an Anti-Inflammatory Becomes the Inflammation", dek: "High-dose turmeric extracts have triggered over 30 cases of severe hepatotoxicity. We break down who's at risk, what dose is safe, and which forms to avoid.", when: "Apr 9, 2026", mins: 6, date: 20260409, updated: true, href: "/a/turmeric-vs-curcumin-why-the-supplement-industry-misleads-you.html", stat: "30+", statNote: "Cases of severe hepatotoxicity tied to high-dose turmeric extracts." },
    { title: "12 Supplement Mistakes You Should Literally Never Make", dek: "Pediatric melatonin ER visits rose 530% from 2012–21. St. John's Wort + SSRIs. Kava + alcohol. Twelve mistakes with documented hospital outcomes — and the people who keep making them.", when: "May 9, 2026", mins: 5, date: 20260509, href: "/a/12-supplement-mistakes-you-should-literally-never-make.html", stat: "530%", statNote: "Rise in pediatric melatonin ER visits from 2012 to 2021." },
    { title: "Why Most Probiotic Supplements Don't Actually Work", dek: "The $61B probiotic market sells you billions of CFUs that mostly die in stomach acid before they reach your gut. Here's which strains have the trials to back them up — and which are pure marketing.", when: "Apr 14, 2026", mins: 8, date: 20260414, updated: true, href: "/a/the-science-of-gut-health-beyond-probiotics.html", stat: "$61B", statNote: "A market selling CFUs that mostly die in stomach acid." },
    { title: "Collagen Peptides: Are You Paying $40 for Gelatin?", dek: "The skin and joint claims have more marketing than evidence behind them. Here's what hydrolyzed collagen actually does — and a cheaper alternative that works just as well.", when: "Apr 2, 2026", mins: 7, date: 20260402, updated: true, href: "/a/the-truth-about-collagen-supplements-what-13-clinical-trials-actually-show.html", stat: "$40", statNote: "What the skin and joint claims ask you to pay, versus the evidence." },
    { title: "Green Tea Extract: When ‘Healthy’ Damages Your Liver", dek: "Published case series tie high-dose EGCG extracts to acute liver injury and transplant. Brewed green tea is safe — but the concentrated capsules are a very different story.", when: "Apr 30, 2026", mins: 7, date: 20260430, updated: true, href: "/a/green-tea-extract-and-liver-failure-what-you-need-to-know.html", stat: "EGCG", statNote: "High-dose extracts are tied to acute liver injury. Brewed tea is a different story." },
    { title: "Psyllium Husk: 100+ Clinical Trials and an FDA Health Claim for Cholesterol Reduction", dek: "More high-quality trial evidence than almost any supplement on the market — yet wellness culture ignores it. LDL down 15 mg/dL. HbA1c down 0.4%. FDA-approved heart health claim since 1998. Here is why nobody is talking about it.", when: "Apr 17, 2026", mins: 11, date: 20260417, updated: true, href: "/index.html#article-92", stat: "100+", statNote: "Clinical trials, and an FDA health claim for cholesterol since 1998." },
    { title: "Creatine for Brain Health: What the New Meta-Analyses Actually Show", dek: "Two new meta-analyses (Prokopidis 2023, Xu 2024) confirm creatine improves memory and cognition in healthy adults — not just athletes. The effect is real, but smaller than the marketing claims.", when: "Apr 24, 2026", mins: 7, date: 20260424, updated: true, href: "/a/creatine-for-brain-health-what-the-new-meta-analyses-actually-show.html", stat: "2", statNote: "Meta-analyses on memory and cognition in healthy adults." },
    { title: "10 Supplements That Interact With the Most Prescription Drugs", dek: "St. John's Wort, berberine, magnesium, melatonin — the supplements that interact with the most prescription drug classes. The list that should be taped to every medicine cabinet.", when: "May 9, 2026", mins: 4, date: 20260509, href: "/a/10-supplements-that-interact-with-the-most-prescription-drugs.html", stat: "10", statNote: "Supplements that interact with the most prescription drug classes." },
    { title: "Magnesium Forms Explained: Glycinate vs Citrate vs Threonate vs Oxide", dek: "The only magnesium form proven to cross the blood-brain barrier in animal studies. But do the human trials actually back up the cognitive claims? We dig into all four studies.", when: "Apr 8, 2026", mins: 8, date: 20260408, updated: true, href: "/a/magnesium-forms-explained-glycinate-vs-citrate-vs-threonate-vs-oxide.html", stat: "4", statNote: "Forms compared: glycinate, citrate, threonate, and oxide." },
    { title: "The 10 Supplements People Are Actually Deficient In", dek: "95% of U.S. adults fall short on fibre. 90% on choline. 90% on omega-3. The 10 nutrients where pills genuinely fill a population-wide gap — not the trendy ones.", when: "May 9, 2026", mins: 4, date: 20260509, href: "/a/the-10-supplements-people-are-actually-deficient-in.html", stat: "95%", statNote: "Of U.S. adults fall short on fibre." },
    { title: "LMNT vs Liquid IV vs DIY: The Electrolyte Price War", dek: "Electrolyte mixes have gone mainstream. We compare sodium-to-sugar ratios, cost per serving, and whether you can make the same thing at home for a fraction of the price.", when: "Apr 10, 2026", mins: 6, date: 20260410, updated: true, href: "/a/electrolytes-for-athletes-science-vs-marketing.html", stat: "DIY", statNote: "The same mix, compared with LMNT and Liquid IV on cost per serving." }
  ];

  var carousel = ARTICLES.map(function (_, i) { return i; });
  var latest = carousel.slice().sort(function (a, b) {
    return ARTICLES[b].date - ARTICLES[a].date || a - b;
  });

  function orderOf(name) { return name === "latest" ? latest : carousel; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function meta(a) { return a.mins + " min read · " + (a.updated ? "Updated " : "") + a.when; }
  function shortMeta(a) { return (a.updated ? "Updated " : "") + a.when + " · " + a.mins + " min"; }

  function at(shot, offset) {
    var order = orderOf(shot.dataset.order);
    var i = (Number(shot.dataset.i) + offset) % order.length;
    return { article: ARTICLES[order[i]], pos: i, slot: order[i] };
  }

  function pager(shot) {
    var n = orderOf(shot.dataset.order).length;
    var i = Number(shot.dataset.i);
    var label = "Showing " + (i + 1) + " of " + n + ". " + at(shot, 0).article.title;
    return '<div class="pager" role="group" aria-label="Article rotation">'
      + '<button type="button" class="pager-btn" data-dir="-1" aria-label="Previous article">Previous</button>'
      + '<span class="pager-count">' + (i + 1) + " of " + n + "</span>"
      + '<button type="button" class="pager-btn" data-dir="1" aria-label="Next article">Next</button>'
      + '<p class="sr" aria-live="polite">' + esc(label) + "</p>"
      + "</div>";
  }

  function read(a, cls) {
    return '<a class="' + (cls || "read") + '" href="' + esc(a.href) + '">Read article</a>';
  }

  function dots(slot) {
    var html = '<div class="dots" aria-hidden="true">';
    for (var i = 0; i < ARTICLES.length; i++) html += '<i' + (i === slot ? ' class="on"' : "") + "></i>";
    return html + "</div>";
  }

  var views = {
    text: function (shot) {
      var a = at(shot, 0).article;
      return '<article class="h1 on-teal"><div><h3>' + esc(a.title) + "</h3><p>" + esc(a.dek) + "</p></div>"
        + '<div><div class="h1-foot"><span class="meta">' + esc(meta(a)) + "</span>" + read(a) + "</div>"
        + pager(shot) + "</div></article>";
    },
    split: function (shot) {
      var a = at(shot, 0).article;
      var long = a.stat.length > 5 ? " long" : "";
      return '<article class="h2"><a class="h2-fig" href="' + esc(a.href) + '"><div class="h2-num' + long + '">'
        + esc(a.stat) + "</div><p>" + esc(a.statNote) + "</p></a><div class=\"h2-copy\"><h3>"
        + esc(a.title) + '</h3><p class="dek">' + esc(a.dek) + '</p><div class="h2-foot"><span class="meta">'
        + esc(meta(a)) + "</span>" + read(a) + "</div>" + pager(shot) + "</div></article>";
    },
    list: function (shot) {
      var rows = "";
      for (var k = 0; k < 3; k++) {
        var a = at(shot, k).article;
        rows += '<a class="row" href="' + esc(a.href) + '"><span class="when">' + esc(a.when) + "</span><h3>"
          + esc(a.title) + '</h3><span class="mins">' + a.mins + " min</span></a>";
      }
      return '<section class="h3" aria-label="Latest articles"><div class="h3-head"><span class="kicker">Latest</span>'
        + '<a class="read" href="/index.html#research">All articles</a></div>' + rows + pager(shot) + "</section>";
    },
    dots: function (shot) {
      var hit = at(shot, 0);
      var a = hit.article;
      return '<article class="h4"><h3>' + esc(a.title) + '</h3><p class="dek">' + esc(a.dek)
        + '</p><div class="h4-foot"><span class="meta">' + esc(meta(a)) + "</span>" + read(a) + "</div>"
        + pager(shot) + dots(hit.slot) + "</article>";
    },
    strip: function (shot) {
      var cards = "";
      for (var k = 0; k < 4; k++) {
        var a = at(shot, k).article;
        cards += '<a href="' + esc(a.href) + '"><span class="meta">' + esc(shortMeta(a)) + "</span><h3>"
          + esc(a.title) + '</h3><span class="read">Read article</span></a>';
      }
      return '<div class="h5-block">' + pager(shot) + '<div class="h5-clip"><div class="h5">' + cards + "</div></div></div>";
    },
    magazine: function (shot) {
      var lead = at(shot, 0).article;
      var side = "";
      for (var k = 1; k <= 2; k++) {
        var a = at(shot, k).article;
        side += '<a href="' + esc(a.href) + '"><span class="meta">' + esc(shortMeta(a)) + "</span><h3>" + esc(a.title) + "</h3></a>";
      }
      return '<div class="h6"><a class="h6-lead" href="' + esc(lead.href) + '"><span class="kicker">Lead</span><h3>'
        + esc(lead.title) + '</h3><p class="dek">' + esc(lead.dek) + '</p></a><div class="h6-side">'
        + side + '</div><div class="h6-pager">' + pager(shot) + "</div></div>";
    },
    index: function (shot) {
      var order = orderOf(shot.dataset.order);
      var i = Number(shot.dataset.i);
      var start = Math.min(Math.max(i - 2, 0), order.length - 6);
      var rail = "";
      for (var k = 0; k < 6; k++) {
        var pos = start + k;
        var a = ARTICLES[order[pos]];
        var on = pos === i;
        rail += '<button type="button" data-at="' + pos + '"' + (on ? ' class="on" aria-current="true"' : "") + ">"
          + '<span class="n">' + pad(order[pos] + 1) + "</span><strong>" + esc(a.title) + "</strong></button>";
      }
      var cur = at(shot, 0).article;
      return '<div class="h7"><div class="h7-rail" role="list" aria-label="Articles">' + rail
        + '</div><div class="h7-feature"><span class="meta">' + esc(meta(cur)) + "</span><h3>" + esc(cur.title)
        + '</h3><p class="dek">' + esc(cur.dek) + '</p><div class="h7-end">' + read(cur) + pager(shot) + "</div></div></div>";
    },
    mast: function (shot) {
      var a = at(shot, 0).article;
      return '<article class="h8"><div class="kicker">Editor’s pick</div><h3>' + esc(a.title)
        + '</h3><p class="dek">' + esc(a.dek) + '</p><div class="h8-rule"></div><div class="h8-foot"><span class="meta">'
        + esc(meta(a)) + "</span>" + read(a) + "</div>" + pager(shot) + "</article>";
    },
    pair: function (shot) {
      var cols = "";
      for (var k = 0; k < 2; k++) {
        var a = at(shot, k).article;
        cols += '<a href="' + esc(a.href) + '"><span class="meta">' + esc(shortMeta(a)) + "</span><h3>"
          + esc(a.title) + '</h3><p class="dek">' + esc(a.dek) + '</p><span class="read">Read article</span></a>';
      }
      return '<div class="h9"><div class="h9-cols">' + cols + "</div>" + pager(shot) + "</div>";
    },
    lead: function (shot) {
      var lead = at(shot, 0);
      var next = "";
      for (var k = 1; k <= 3; k++) {
        var hit = at(shot, k);
        next += '<a href="' + esc(hit.article.href) + '"><span class="ord">' + pad(hit.slot + 1) + "</span><strong>"
          + esc(hit.article.title) + "</strong></a>";
      }
      return '<div class="h10"><a class="h10-lead on-teal" href="' + esc(lead.article.href) + '"><div><div class="eyebrow">Now reading</div><h3>'
        + esc(lead.article.title) + '</h3></div><span class="read">Read article</span></a><div class="h10-pager">'
        + pager(shot) + '</div><div class="h10-next">' + next + "</div></div>";
    }
  };

  function render(shot) {
    var focusDir = null;
    var active = document.activeElement;
    if (active && shot.contains(active) && active.getAttribute("data-dir")) focusDir = active.getAttribute("data-dir");
    shot.innerHTML = views[shot.dataset.kind](shot);
    if (focusDir) {
      var btn = shot.querySelector('.pager-btn[data-dir="' + focusDir + '"]');
      if (btn) btn.focus();
    }
  }

  function step(shot, dir) {
    var n = orderOf(shot.dataset.order).length;
    var i = (Number(shot.dataset.i) + dir + n) % n;
    shot.dataset.i = String(i);
    render(shot);
  }

  document.querySelectorAll("[data-rot]").forEach(render);

  document.addEventListener("click", function (e) {
    var atBtn = e.target.closest("[data-at]");
    if (atBtn) {
      var shot = atBtn.closest("[data-rot]");
      shot.dataset.i = atBtn.getAttribute("data-at");
      render(shot);
      var again = shot.querySelector('[data-at="' + atBtn.getAttribute("data-at") + '"]');
      if (again) again.focus();
      return;
    }
    var btn = e.target.closest(".pager-btn");
    if (!btn) return;
    step(btn.closest("[data-rot]"), Number(btn.getAttribute("data-dir")));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    var shot = e.target.closest && e.target.closest("[data-rot]");
    if (!shot || e.target.closest("input, textarea")) return;
    e.preventDefault();
    step(shot, e.key === "ArrowRight" ? 1 : -1);
  });

  var swipe = null;
  var suppressClick = false;
  var lastStepAt = 0;
  function beginSwipe(shot, x, y, id) {
    swipe = shot ? { x: x, y: y, shot: shot, id: id } : null;
  }
  function endSwipe(x, y, id) {
    if (!swipe || (id != null && swipe.id != null && id !== swipe.id)) return;
    var dx = x - swipe.x;
    var dy = y - swipe.y;
    var shot = swipe.shot;
    swipe = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    var now = Date.now();
    if (now - lastStepAt < 350) return;
    lastStepAt = now;
    suppressClick = true;
    step(shot, dx < 0 ? 1 : -1);
  }
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var shot = e.target.closest("[data-rot]");
    if (!shot || e.target.closest("button")) { swipe = null; return; }
    beginSwipe(shot, e.clientX, e.clientY, e.pointerId);
  });
  document.addEventListener("pointerup", function (e) {
    endSwipe(e.clientX, e.clientY, e.pointerId);
  });
  document.addEventListener("touchstart", function (e) {
    var shot = e.target.closest("[data-rot]");
    if (!shot || e.target.closest("button")) { swipe = null; return; }
    var t = e.changedTouches[0];
    beginSwipe(shot, t.clientX, t.clientY, null);
  }, { passive: true });
  document.addEventListener("touchend", function (e) {
    var t = e.changedTouches[0];
    endSwipe(t.clientX, t.clientY, null);
  }, { passive: true });
  document.addEventListener("click", function (e) {
    if (!suppressClick) return;
    suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
})();
