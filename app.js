/* ============================================================
   Ta Vie en Semaines — logique
   100% client-side. Aucune donnée envoyée.
   Espérance de vie par défaut : INSEE 2024
   (femmes 85,6 ans / hommes 80,0 ans).
   ============================================================ */
(function () {
  "use strict";

  var WEEKS_PER_YEAR = 365.25 / 7;   // 52.17857...
  var MS_PER_DAY = 86400000;

  // Espérance de vie INSEE 2024 (arrondie pour le curseur entier)
  var DEFAULT_AGE = { female: 86, male: 80, custom: 86 };

  // Palette (doit refléter styles.css pour l'export image)
  var COLORS = {
    bg1: "#151823", bg2: "#0e1016",
    future: "#232838", lived: "#4b5675",
    now: "#ff5a5f", text: "#eef1f7", muted: "#9aa3b8",
    p1: "#6ee7b7", p2: "#38bdf8", p3: "#a78bfa",
    p4: "#f472b6", p5: "#fbbf24", p6: "#fb7185"
  };

  // Étapes de vie (bornes en années) — repères INDICATIFS
  var PHASES = [
    { from: 0,  to: 3,   cls: "p1", key: "p1", label: "Petite enfance" },
    { from: 3,  to: 12,  cls: "p2", key: "p2", label: "Enfance" },
    { from: 12, to: 18,  cls: "p3", key: "p3", label: "Adolescence" },
    { from: 18, to: 25,  cls: "p4", key: "p4", label: "Études & jeunesse" },
    { from: 25, to: 64,  cls: "p5", key: "p5", label: "Vie active" },
    { from: 64, to: 200, cls: "p6", key: "p6", label: "Après 64 ans" }
  ];

  function phaseForAge(age) {
    for (var i = 0; i < PHASES.length; i++) {
      if (age >= PHASES[i].from && age < PHASES[i].to) return PHASES[i];
    }
    return PHASES[PHASES.length - 1];
  }

  // ---------- Éléments ----------
  var $ = function (id) { return document.getElementById(id); };
  var birthdateEl = $("birthdate");
  var sexEl = $("sex");
  var targetEl = $("target-age");
  var targetOut = $("target-age-out");
  var showPhasesEl = $("show-phases");
  var segBtns = document.querySelectorAll(".seg-btn");

  var statsEl = $("stats");
  var statLived = $("stat-lived");
  var statLeft = $("stat-left");
  var statPct = $("stat-pct");
  var statSummers = $("stat-summers");
  var messageEl = $("message");
  var legendEl = $("legend");
  var gridFrame = $("grid-frame");
  var gridEl = $("grid");
  var gridColsLabel = $("grid-cols-label");
  var emptyEl = $("empty");
  var actionsEl = $("actions");
  var peakCtaEl = $("peak-cta");
  var peakCtaText = $("peak-cta-text");

  var mode = "weeks";

  // borne max de la date = aujourd'hui
  (function setMaxDate() {
    var t = new Date();
    var iso = t.getFullYear() + "-" +
      String(t.getMonth() + 1).padStart(2, "0") + "-" +
      String(t.getDate()).padStart(2, "0");
    birthdateEl.max = iso;
    birthdateEl.min = "1900-01-01";
  })();

  function fmt(n) { return Math.round(n).toLocaleString("fr-FR"); }

  // ---------- Calcul principal ----------
  function compute() {
    var val = birthdateEl.value;
    var target = parseInt(targetEl.value, 10) || 86;

    if (!val) return null;
    var birth = new Date(val + "T00:00:00");
    if (isNaN(birth.getTime())) return null;

    var now = new Date();
    var ageMs = now - birth;
    var ageYears = ageMs / (365.25 * MS_PER_DAY);

    var future = ageMs < 0;
    var weeksLived = future ? 0 : Math.floor(ageMs / MS_PER_DAY / 7);
    var pct = Math.max(0, Math.min(100, (ageYears / target) * 100));
    var weeksLeft = Math.max(0, Math.round((target - ageYears) * WEEKS_PER_YEAR));
    var summersLeft = Math.max(0, Math.round(target - ageYears));

    return {
      birth: birth, ageYears: ageYears, target: target, future: future,
      weeksLived: weeksLived, weeksLeft: weeksLeft, pct: pct, summersLeft: summersLeft
    };
  }

  // grille : rows, cols, nowIndex selon le mode
  function gridSpec(d) {
    var target = d.target;
    var cols, rows, nowIndex, unitYears;
    var completed = Math.max(0, Math.floor(d.ageYears));
    var frac = Math.max(0, d.ageYears - completed);

    if (mode === "weeks") {
      cols = 52; rows = target; unitYears = 1 / 52;
      nowIndex = completed * 52 + Math.min(51, Math.floor(frac * 52));
    } else if (mode === "months") {
      cols = 12; rows = target; unitYears = 1 / 12;
      nowIndex = completed * 12 + Math.min(11, Math.floor(frac * 12));
    } else { // years
      cols = 10; rows = Math.ceil(target / 10); unitYears = 1;
      nowIndex = completed;
    }
    if (d.future) nowIndex = -1;
    return { cols: cols, rows: rows, total: cols * rows, nowIndex: nowIndex, unitYears: unitYears };
  }

  // ---------- Rendu DOM ----------
  function render() {
    var d = compute();

    if (!d) {
      statsEl.hidden = true; messageEl.hidden = true; legendEl.hidden = true;
      gridFrame.hidden = true; actionsEl.hidden = true; emptyEl.style.display = "";
      if (peakCtaEl) peakCtaEl.hidden = true;
      return;
    }
    emptyEl.style.display = "none";
    statsEl.hidden = false; actionsEl.hidden = false;

    // CTA pic émotionnel (abonnement chaîne) — révélé une fois la grille calculée
    if (peakCtaEl) {
      peakCtaEl.hidden = d.future ? true : false;
      if (!d.future && peakCtaText) {
        if (d.weeksLeft < 2000) {
          peakCtaEl.classList.add("is-urgent");
          peakCtaText.textContent = "Il te reste moins de 2 000 semaines. Chacune compte vraiment — autant les passer à devenir qui tu veux être.";
        } else {
          peakCtaEl.classList.remove("is-urgent");
          peakCtaText.textContent = "Tu viens de voir tes semaines. La vraie question, c'est ce que tu fais des prochaines.";
        }
      }
    }

    // stats
    statLived.textContent = d.future ? "0" : fmt(d.weeksLived);
    statLeft.textContent = fmt(d.weeksLeft);
    statPct.textContent = d.pct.toFixed(1).replace(".", ",") + " %";
    statSummers.textContent = fmt(d.summersLeft);

    // message
    messageEl.hidden = false;
    messageEl.textContent = buildMessage(d);

    // légende
    if (showPhasesEl.checked) {
      legendEl.hidden = false;
      legendEl.innerHTML = "";
      PHASES.forEach(function (p) {
        var item = document.createElement("span");
        item.className = "legend-item";
        var sw = document.createElement("span");
        sw.className = "legend-swatch";
        sw.style.background = COLORS[p.key];
        item.appendChild(sw);
        item.appendChild(document.createTextNode(p.label));
        legendEl.appendChild(item);
      });
    } else {
      legendEl.hidden = true;
    }

    // grille
    var g = gridSpec(d);
    gridColsLabel.textContent =
      (mode === "weeks" ? "52 semaines / ligne" :
       mode === "months" ? "12 mois / ligne" : "10 ans / ligne");

    gridEl.style.gridTemplateColumns = "repeat(" + g.cols + ", 1fr)";
    var frag = document.createDocumentFragment();
    for (var i = 0; i < g.total; i++) {
      var cell = document.createElement("div");
      cell.className = "cell";
      var cellAge = i * g.unitYears;
      cell.dataset.i = i;
      if (i === g.nowIndex) {
        cell.className += " now";
      } else if (i < g.nowIndex) {
        if (showPhasesEl.checked) {
          cell.className += " " + phaseForAge(cellAge).cls;
        } else {
          cell.className += " lived";
        }
      }
      frag.appendChild(cell);
    }
    gridEl.innerHTML = "";
    gridEl.appendChild(frag);
    gridFrame.hidden = false;

    lastData = d; lastGrid = g;
  }

  function buildMessage(d) {
    if (d.future) {
      return "Cette date est dans le futur — vérifie ta date de naissance.";
    }
    if (d.ageYears >= d.target) {
      return "Tu as dépassé l'espérance de vie de référence. Chaque semaine est désormais du bonus pur — savoure-les pleinement.";
    }
    var left = fmt(d.weeksLeft);
    if (d.pct < 25) {
      return "Il te reste environ " + left + " semaines. Une fortune de temps devant toi — mais elle se dépense, que tu le décides ou non.";
    } else if (d.pct < 50) {
      return "Il te reste environ " + left + " semaines. Tu n'as pas encore atteint la moitié : le plus gros est encore à écrire.";
    } else if (d.pct < 75) {
      return "Il te reste environ " + left + " semaines. La deuxième moitié a commencé — c'est le moment de choisir ce qui compte vraiment.";
    }
    return "Il te reste environ " + left + " semaines. Précieuses. La meilleure réponse à ce chiffre, c'est ce que tu fais cette semaine.";
  }

  // ---------- Tooltip (desktop) ----------
  var tip = document.createElement("div");
  tip.style.cssText = "position:fixed;z-index:90;pointer-events:none;background:#0e1016;border:1px solid #2a3042;color:#eef1f7;font-size:.78rem;padding:5px 9px;border-radius:8px;opacity:0;transition:opacity .1s;white-space:nowrap;";
  document.body.appendChild(tip);

  gridEl.addEventListener("mouseover", function (e) {
    var c = e.target;
    if (!c.classList || !c.classList.contains("cell") || !lastGrid) return;
    var i = parseInt(c.dataset.i, 10);
    var age = Math.floor(i * lastGrid.unitYears);
    var label;
    if (mode === "weeks") label = "Semaine " + ((i % 52) + 1) + " · " + (age) + " ans";
    else if (mode === "months") label = "Mois " + ((i % 12) + 1) + " · " + (age) + " ans";
    else label = age + " ans";
    if (i === lastGrid.nowIndex) label = "👉 Tu es ici · " + label;
    tip.textContent = label;
    tip.style.opacity = "1";
  });
  gridEl.addEventListener("mousemove", function (e) {
    tip.style.left = (e.clientX + 14) + "px";
    tip.style.top = (e.clientY - 8) + "px";
  });
  gridEl.addEventListener("mouseout", function () { tip.style.opacity = "0"; });

  // ---------- Export image (canvas) ----------
  function exportImage() {
    if (!lastData || !lastGrid) return;
    var d = lastData, g = lastGrid;
    var W = 1080, H = 1350;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d");

    // fond
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1b2030"); grad.addColorStop(1, COLORS.bg2);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // titre
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.text;
    ctx.font = "700 64px Inter, sans-serif";
    ctx.fillText("Ma vie en semaines", W / 2, 110);

    ctx.fillStyle = COLORS.muted;
    ctx.font = "500 30px Inter, sans-serif";
    ctx.fillText(
      fmt(d.weeksLived) + " vécues   ·   " + fmt(d.weeksLeft) + " restantes   ·   " +
      d.pct.toFixed(0) + " % écoulé",
      W / 2, 158
    );

    // zone grille
    var areaX = 70, areaY = 210, areaW = W - 140, areaH = 980;
    var gap = mode === "weeks" ? 3 : (mode === "months" ? 5 : 8);
    var cell = (areaW - (g.cols - 1) * gap) / g.cols;
    var maxCell = (areaH - (g.rows - 1) * gap) / g.rows;
    if (cell > maxCell) cell = maxCell;
    var gridW = g.cols * cell + (g.cols - 1) * gap;
    var startX = (W - gridW) / 2;
    var startY = areaY;

    for (var i = 0; i < g.total; i++) {
      var col = i % g.cols, row = Math.floor(i / g.cols);
      var x = startX + col * (cell + gap);
      var y = startY + row * (cell + gap);
      var age = i * g.unitYears;
      var color;
      if (i === g.nowIndex) color = COLORS.now;
      else if (i < g.nowIndex) color = showPhasesEl.checked ? COLORS[phaseForAge(age).key] : COLORS.lived;
      else color = COLORS.future;
      ctx.fillStyle = color;
      roundRect(ctx, x, y, cell, cell, Math.min(3, cell / 3));
      ctx.fill();
    }

    // pied
    ctx.fillStyle = COLORS.muted;
    ctx.font = "600 28px Inter, sans-serif";
    ctx.fillText("ta-vie-en-semaines  ·  Mindset Brut", W / 2, H - 50);

    var url = cv.toDataURL("image/png");
    var a = document.createElement("a");
    a.href = url; a.download = "ma-vie-en-semaines.png";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    feedback($("share-feedback"), "Image téléchargée ✓");
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- Partage ----------
  function share() {
    var url = "https://itachiuchiha976.github.io/ta-vie-en-semaines/";
    var text = "J'ai visualisé ma vie en semaines. Regarde combien il t'en reste :";
    if (navigator.share) {
      navigator.share({ title: "Ta Vie en Semaines", text: text, url: url })
        .then(function () { feedback($("share-feedback"), "Merci du partage !"); })
        .catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        feedback($("share-feedback"), "Lien copié ✓");
      });
    } else {
      feedback($("share-feedback"), url);
    }
  }

  function feedback(el, msg) {
    el.textContent = msg;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.textContent = ""; }, 3500);
  }

  // ---------- Email (Web3Forms, AJAX) ----------
  var emailForm = $("email-form");
  emailForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("email").value.trim();
    if (!email || email.indexOf("@") < 1) {
      feedback($("email-feedback"), "Entre une adresse email valide.");
      return;
    }
    var btn = emailForm.querySelector("button[type=submit]");
    if (btn) { btn.disabled = true; }
    feedback($("email-feedback"), "Envoi en cours…");

    fetch(emailForm.action, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: new FormData(emailForm)
    })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, body: j }; }); })
      .then(function (r) {
        if (r.ok && r.body && r.body.success) {
          // succès : on cache le form et on affiche un message inline
          emailForm.style.display = "none";
          var fb = $("email-feedback");
          fb.innerHTML = "Merci ! Tu es sur la liste.<br><a href=\"guides/plan-30-jours.html\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-block;margin-top:10px;font-weight:600;color:inherit;\">📖 Accède à ton plan 30 jours maintenant →</a>";
          clearTimeout(fb._t);
        } else {
          if (btn) { btn.disabled = false; }
          feedback($("email-feedback"), "Oups, un souci est survenu. Réessaie dans un instant.");
        }
      })
      .catch(function () {
        if (btn) { btn.disabled = false; }
        feedback($("email-feedback"), "Connexion impossible. Vérifie ta connexion et réessaie.");
      });
  });

  // ---------- Sync curseur / sexe ----------
  function syncTargetOut() { targetOut.textContent = targetEl.value + " ans"; }

  sexEl.addEventListener("change", function () {
    if (sexEl.value !== "custom") {
      targetEl.value = DEFAULT_AGE[sexEl.value];
      syncTargetOut();
    }
    render();
  });
  targetEl.addEventListener("input", function () {
    syncTargetOut();
    if (sexEl.value !== "custom") sexEl.value = "custom";
    render();
  });
  birthdateEl.addEventListener("input", render);
  showPhasesEl.addEventListener("change", render);

  segBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      segBtns.forEach(function (x) { x.classList.remove("is-active"); });
      b.classList.add("is-active");
      mode = b.dataset.mode;
      render();
    });
  });

  $("btn-image").addEventListener("click", exportImage);
  $("btn-share").addEventListener("click", share);

  // état
  var lastData = null, lastGrid = null;

  // init
  targetEl.value = DEFAULT_AGE[sexEl.value] || 86;
  syncTargetOut();
  render();
})();
