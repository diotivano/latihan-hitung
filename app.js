(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s) };
  var KEY = "hitung-dasar-v2";
  var OPS = [["+", "Tambah"], ["−", "Kurang"], ["×", "Kali"], ["÷", "Bagi"]];
  var VALID_OPS = { "+": 1, "−": 1, "×": 1, "÷": 1 };
  var NAME = { "+": "Tambah", "−": "Kurang", "×": "Kali", "÷": "Bagi" };
  var TITLE = { "+": "+ Penjumlahan", "−": "− Pengurangan", "×": "× Perkalian", "÷": "÷ Pembagian" };
  var ALL_TABLES = [2, 3, 4, 5, 6, 7, 8, 9];
  var LOW_TABLES = [2, 3, 4, 5];
  var HIGH_TABLES = [6, 7, 8, 9];
  var HARD_FACTORS = [12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29];
  var VALID_COUNTS = [10, 20, 30];
  var VALID_TMODES = { low: 1, high: 1, all: 1, hard: 1, custom: 1 };
  var RNG = { 1: [2, 10], 2: [11, 99], 3: [100, 999] };
  var MAX_Q_MS = 120000;
  var MAX_DIGITS = 5;

  function now() { return (window.performance && performance.now) ? performance.now() : Date.now() }
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }
  function pick(a) { return a[rnd(0, a.length - 1)] }
  function shuffle(a) {
    for (var k = a.length - 1; k > 0; k--) { var j = rnd(0, k), t = a[k]; a[k] = a[j]; a[j] = t }
    return a;
  }
  function mk(op, a, b) { return { op: op, a: a, b: b } }

  /* --- Generator soal & validasi kecocokan tingkat --- */
  function gAdd(d) {
    var r = RNG[d] || RNG[1];
    return mk("+", rnd(r[0], r[1]), rnd(r[0], r[1]));
  }
  function gSub(d) {
    var r = d == 1 ? [3, 20] : (RNG[d] || RNG[1]);
    var a = rnd(r[0], r[1]), b = rnd(r[0], r[1]), t;
    if (b > a) { t = a; a = b; b = t }
    if (a === b) { if (b > r[0]) b--; else a++ }
    return mk("−", a, b);
  }
  function tablesForMode(c) {
    return c.tMode === "low" ? LOW_TABLES
      : c.tMode === "high" ? HIGH_TABLES
        : c.tMode === "all" ? ALL_TABLES
          : c.tables;
  }
  function gMul(c) {
    if (c.tMode === "hard") return mk("×", pick(HARD_FACTORS), rnd(3, 9));
    var a = pick(tablesForMode(c));
    var b = c.tMode === "high" ? rnd(3, 9) : rnd(2, 9);
    return Math.random() < .5 ? mk("×", a, b) : mk("×", b, a);
  }
  function gDiv(c) {
    if (c.tMode === "hard") {
      var d = rnd(3, 9), q = pick(HARD_FACTORS);
      return mk("÷", d * q, d);
    }
    var t = pick(tablesForMode(c));
    var r = c.tMode === "high" ? rnd(3, 9) : rnd(2, 9);
    return mk("÷", t * r, t);
  }
  function gen(c) {
    var op = pick(c.ops);
    if (op === "+") return gAdd(c.digits);
    if (op === "−") return gSub(c.digits);
    if (op === "×") return gMul(c);
    return gDiv(c);
  }
  function fits(q, c) {
    if (!q || c.ops.indexOf(q.op) < 0) return false;
    var m = Math.max(q.a, q.b);
    if (q.op === "+" || q.op === "−") {
      var d = c.digits;
      return d == 1 ? m <= 20 : d == 2 ? (m >= 11 && m <= 99) : (m >= 100 && m <= 999);
    }
    if (q.op === "×") {
      var hi = Math.max(q.a, q.b), lo = Math.min(q.a, q.b);
      if (c.tMode === "hard") return hi >= 12 && hi <= 29 && hi % 10 !== 0 && lo >= 3 && lo <= 9;
      if (hi > 9 || lo < 2) return false;
      var tb = tablesForMode(c);
      if (c.tMode === "high" && lo < 3) return false;
      return tb.indexOf(q.a) >= 0 || tb.indexOf(q.b) >= 0;
    }
    var res = q.a / q.b;
    if (c.tMode === "hard") return res >= 12 && res <= 29 && res % 10 !== 0 && q.b >= 3 && q.b <= 9;
    if (res > 9 || q.b > 9 || res < 2) return false;
    var dtb = tablesForMode(c);
    if (c.tMode === "high" && res < 3) return false;
    return dtb.indexOf(q.b) >= 0;
  }
  function ans(q) { return q.op === "+" ? q.a + q.b : q.op === "−" ? q.a - q.b : q.op === "×" ? q.a * q.b : q.a / q.b }
  function key(q) { return q.op + q.a + "_" + q.b }

  /* --- Penjelasan trik hitung cepat --- */
  function tip(q) {
    var a = q.a, b = q.b, r = ans(q), t, h, rem;
    if (q.op === "+") {
      if (b >= 100) {
        h = b - b % 100; rem = b % 100;
        if (rem) return "Pecah ratusannya dulu: " + a + " + " + h + " = " + (a + h) + ", lalu + " + rem + " = " + r + ".";
        return "Tambahkan ratusannya langsung: " + a + " + " + b + " = " + r + ".";
      }
      if (b >= 10 && b % 10) {
        t = b - b % 10;
        return "Pecah angkanya: " + a + " + " + t + " = " + (a + t) + ", lalu + " + (b % 10) + " = " + r + ".";
      }
      if (b >= 10) {
        var aTen = a - a % 10;
        if (aTen > 0) return "Tambahkan puluhannya: " + aTen + " + " + b + " = " + (aTen + b) + (a % 10 ? ", lalu + " + (a % 10) + " = " + r + "." : ".");
        return "Mulai dari " + b + ", lalu tambah " + a + " = " + r + ".";
      }
      if (a + b > 10 && a < 10 && b < 10) {
        return "Genapkan ke 10 dulu: " + a + " + " + (10 - a) + " = 10, lalu 10 + " + (b - (10 - a)) + " = " + r + ".";
      }
      return "Jumlahkan langsung: " + a + " + " + b + " = " + r + ".";
    }
    if (q.op === "−") {
      if (b >= 100) {
        h = b - b % 100; rem = b % 100;
        if (rem) return "Kurangi ratusannya dulu: " + a + " − " + h + " = " + (a - h) + ", lalu − " + rem + " = " + r + ".";
        return "Kurangi ratusannya langsung: " + a + " − " + b + " = " + r + ".";
      }
      if (b >= 10 && b % 10) {
        t = b - b % 10;
        return "Kurangi puluhan dulu: " + a + " − " + t + " = " + (a - t) + ", lalu − " + (b % 10) + " = " + r + ".";
      }
      if (b >= 10) {
        var aT = a - a % 10;
        return "Kurangi puluhannya: " + aT + " − " + b + " = " + (aT - b) + (a % 10 ? ", lalu + " + (a % 10) + " = " + r + "." : ".");
      }
      if (a > 10 && a < 20 && b > a % 10) {
        var s = a - 10;
        return "Turun ke 10 dulu: " + a + " − " + s + " = 10, lalu 10 − " + (b - s) + " = " + r + ".";
      }
      if (a === 20 && b < 10) {
        return "Karena 10 − " + b + " = " + (10 - b) + ", maka 20 − " + b + " = 10 + " + (10 - b) + " = " + r + ".";
      }
      if (a > 10 && b <= a % 10) {
        return "Kurangi satuannya saja: " + (a % 10) + " − " + b + " = " + (a % 10 - b) + ", jadi " + a + " − " + b + " = " + r + ".";
      }
      return "Cari selisihnya: " + b + " + " + r + " = " + a + ", jadi " + a + " − " + b + " = " + r + ".";
    }
    if (q.op === "×") {
      var big = Math.max(a, b), sm = Math.min(a, b);
      if (big >= 12) {
        if (big % 10 === 9) {
          var up = big + 1;
          return "Bulatkan ke " + up + ": " + up + " × " + sm + " = " + (up * sm) + ", lalu kurangi " + sm + " = " + r + ".";
        }
        var ten = big - big % 10, one = big % 10;
        if (one) return "Pecah puluhan & satuan: " + ten + " × " + sm + " = " + (ten * sm) + ", lalu " + one + " × " + sm + " = " + (one * sm) + ", jumlahkan = " + r + ".";
        return "Kalikan puluhannya langsung: " + big + " × " + sm + " = " + r + ".";
      }
      if (a === 9 || b === 9) {
        var oth = a === 9 ? b : a;
        return "Trik × 9: " + oth + " × 10 = " + (oth * 10) + ", lalu kurangi " + oth + " = " + r + ".";
      }
      if (a === 5 || b === 5) {
        var o5 = a === 5 ? b : a;
        if (o5 % 2 === 0) return "Trik × 5: setengah dari " + o5 + " adalah " + (o5 / 2) + ", lalu × 10 = " + r + ".";
        return "Trik × 5: " + (o5 - 1) + " × 5 = " + ((o5 - 1) * 5) + ", lalu + 5 = " + r + ".";
      }
      if (sm === 2) return "Gandakan angkanya: " + big + " + " + big + " = " + r + ".";
      if (sm === 4) return "Gandakan dua kali: " + big + " × 2 = " + (big * 2) + ", lalu × 2 lagi = " + r + ".";
      if (sm === 3) return "Gunakan × 2 lalu tambah sendiri: " + big + " × 2 = " + (big * 2) + ", lalu + " + big + " = " + r + ".";
      return "Pecah dari × 5: " + big + " × 5 = " + (big * 5) + ", lalu " + big + " × " + (sm - 5) + " = " + (big * (sm - 5)) + ", jumlahkan = " + r + ".";
    }
    if (r >= 12 && r % 10) {
      var tenQ = r - r % 10, oneQ = r % 10, part = tenQ * b, sisa = a - part;
      return "Ambil kelipatan " + tenQ + " dulu: " + part + " ÷ " + b + " = " + tenQ + ", sisa " + sisa + " ÷ " + b + " = " + oneQ + ", hasil = " + r + ".";
    }
    return "Balik jadi perkalian: " + b + " × " + r + " = " + a + ".";
  }

  /* --- Penyimpanan lokal & sanitasi data --- */
  function defaultData() {
    return {
      cfg: { ops: ["+"], digits: "1", tMode: "low", tables: [2, 3, 4, 5], count: 10, useBank: true },
      bank: {},
      stats: {}
    };
  }
  function isObj(x) { return x && typeof x === "object" && !Array.isArray(x) }
  function toggle(arr, v) { var i = arr.indexOf(v); i < 0 ? arr.push(v) : arr.splice(i, 1) }
  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    for (var j = 0; j < a.length; j++) { if (b.indexOf(a[j]) < 0) return false }
    return true;
  }
  function orderedOps(list) {
    return OPS.map(function (o) { return o[0] }).filter(function (op) { return list.indexOf(op) >= 0 });
  }

  function sanitize(raw) {
    var base = defaultData();
    if (!isObj(raw)) return base;
    if (isObj(raw.cfg)) {
      var c = raw.cfg;
      if (Array.isArray(c.ops)) {
        var ops = [];
        c.ops.forEach(function (o) { if (VALID_OPS[o] && ops.indexOf(o) < 0) ops.push(o) });
        if (ops.length) base.cfg.ops = ops;
      }
      if (c.digits === "1" || c.digits === "2" || c.digits === "3" || c.digits === 1 || c.digits === 2 || c.digits === 3) {
        base.cfg.digits = String(c.digits);
      }
      if (Array.isArray(c.tables)) {
        var tb = [];
        c.tables.forEach(function (n) { var v = +n; if (ALL_TABLES.indexOf(v) >= 0 && tb.indexOf(v) < 0) tb.push(v) });
        tb.sort(function (x, y) { return x - y });
        if (tb.length) base.cfg.tables = tb;
      }
      if (VALID_TMODES[c.tMode]) {
        base.cfg.tMode = c.tMode;
      } else if (sameSet(base.cfg.tables, ALL_TABLES)) {
        base.cfg.tMode = "all";
      } else if (sameSet(base.cfg.tables, HIGH_TABLES)) {
        base.cfg.tMode = "high";
      } else if (sameSet(base.cfg.tables, LOW_TABLES)) {
        base.cfg.tMode = "low";
      } else {
        base.cfg.tMode = "custom";
      }
      if (VALID_COUNTS.indexOf(+c.count) >= 0) base.cfg.count = +c.count;
      else if (+c.count > 30) base.cfg.count = 30;
    }
    if (isObj(raw.bank)) {
      Object.keys(raw.bank).forEach(function (k) {
        var item = raw.bank[k];
        if (isObj(item) && isObj(item.q) && VALID_OPS[item.q.op]) {
          var a = +item.q.a, b = +item.q.b, need = +item.need;
          if (Number.isInteger(a) && Number.isInteger(b) && a > 0 && b > 0 && Number.isInteger(need) && need > 0 && need <= 3) {
            var q = mk(item.q.op, a, b);
            if (q.op !== "÷" || a % b === 0) base.bank[key(q)] = { q: q, need: need };
          }
        }
      });
    }
    if (isObj(raw.stats)) {
      Object.keys(raw.stats).forEach(function (op) {
        if (!VALID_OPS[op]) return;
        var s = raw.stats[op];
        if (isObj(s) && isFinite(s.c) && isFinite(s.t) && isFinite(s.ms) && s.t >= 0 && s.c >= 0 && s.ms >= 0) {
          base.stats[op] = { c: Math.floor(s.c), t: Math.floor(s.t), ms: s.ms };
        }
      });
    }
    return base;
  }

  function load() {
    try {
      var s = localStorage.getItem(KEY);
      if (s) return sanitize(JSON.parse(s));
    } catch (e) { }
    return defaultData();
  }
  var data = load();
  var cfg = data.cfg;
  cfg.useBank = true;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)) } catch (e) { } }

  /* --- Navigasi & layar pengaturan --- */
  function show(id) {
    ["home", "setup", "quiz", "result"].forEach(function (s) { $("#" + s).hidden = s !== id });
    if (id === "home") $("#homeTitle").focus();
    else if (id === "setup") $("#setupTitle").focus();
    else if (id === "result") $("#resTitle").focus();
  }

  var setupMode = "single"; // "single" | "mix"
  var lastSessionMode = "normal"; // "normal" | "bank"

  function needDigits() { return cfg.ops.indexOf("+") >= 0 || cfg.ops.indexOf("−") >= 0 }
  function needTables() { return cfg.ops.indexOf("×") >= 0 || cfg.ops.indexOf("÷") >= 0 }

  function refreshSetup() {
    var isMix = setupMode === "mix";
    var hasD = needDigits(), hasT = needTables();
    $("#mixBox").hidden = !isMix;
    $("#digitsBox").hidden = !hasD;
    $("#tablesBox").hidden = !hasT;

    $("#digitsLabel").textContent = hasT ? "Tingkat tambah & kurang" : "Pilih tingkat";
    $("#tablesLabel").textContent = hasD ? "Tingkat kali & bagi" : "Pilih tingkat";

    var subOnly = cfg.ops.indexOf("−") >= 0 && cfg.ops.indexOf("+") < 0;
    $("#exD1").textContent = subOnly ? "15 − 6" : "8 + 7";
    $("#exD2").textContent = subOnly ? "45 − 18" : "45 + 28";
    $("#exD3").textContent = subOnly ? "340 − 125" : "240 + 135";

    var divOnly = cfg.ops.indexOf("÷") >= 0 && cfg.ops.indexOf("×") < 0;
    $("#exT1").textContent = divOnly ? "28 ÷ 4" : "4 × 7";
    $("#exT2").textContent = divOnly ? "56 ÷ 7" : "7 × 8";
    $("#exT3").textContent = divOnly ? "84 ÷ 6" : "16 × 7";
    $("#descT3").textContent = divOnly ? "Hasil belasan–puluhan" : "2 digit × 1 digit";

    document.querySelectorAll("#ops .chip").forEach(function (b) {
      b.setAttribute("aria-pressed", cfg.ops.indexOf(b.dataset.v) >= 0 ? "true" : "false");
    });
    document.querySelectorAll("#digits .level").forEach(function (b) {
      b.setAttribute("aria-checked", b.dataset.v === cfg.digits ? "true" : "false");
    });
    document.querySelectorAll("#tLevels .level").forEach(function (b) {
      b.setAttribute("aria-checked", b.dataset.v === cfg.tMode ? "true" : "false");
    });
    var activeTables = cfg.tMode === "hard" ? [] : tablesForMode(cfg);
    document.querySelectorAll("#tables .chip").forEach(function (b) {
      b.setAttribute("aria-pressed", activeTables.indexOf(+b.dataset.v) >= 0 ? "true" : "false");
    });
    $("#customTablesSummary").textContent = cfg.tMode === "custom" && cfg.tables.length
      ? "Angka dipilih: " + cfg.tables.join(", ")
      : "Pilih angka tertentu saja (2–9)";

    document.querySelectorAll("#count .cnt").forEach(function (b) {
      b.setAttribute("aria-checked", +b.dataset.v === cfg.count ? "true" : "false");
    });

    var noOps = !cfg.ops.length;
    var noTables = hasT && cfg.tMode === "custom" && !cfg.tables.length;
    $("#start").disabled = noOps || noTables;
    var hint = $("#startHint");
    if (noOps) { hint.textContent = "Pilih minimal satu jenis hitungan."; hint.hidden = false }
    else if (noTables) { hint.textContent = "Pilih minimal satu angka di bawah."; hint.hidden = false }
    else { hint.textContent = ""; hint.hidden = true }
  }

  function openSetup(mode) {
    if (mode === "mix") {
      setupMode = "mix";
      if (cfg.ops.length < 2) cfg.ops = ["+", "−"];
      $("#setupTitle").textContent = "Latihan Campuran";
    } else {
      setupMode = "single";
      cfg.ops = [mode];
      $("#setupTitle").textContent = TITLE[mode] || "Atur Latihan";
    }
    if (cfg.tMode === "custom" && !cfg.tables.length) { cfg.tMode = "low"; cfg.tables = LOW_TABLES.slice() }
    $("#customTablesAcc").open = cfg.tMode === "custom";
    save();
    try { history.pushState({ view: "setup" }, "") } catch (e) { }
    refreshSetup();
    show("setup");
  }

  $("#topics").addEventListener("click", function (e) {
    var b = e.target.closest("button.topic");
    if (b) openSetup(b.dataset.mode);
  });
  $("#openMix").onclick = function () { openSetup("mix") };
  $("#backHome").onclick = renderHome;

  OPS.forEach(function (o) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.v = o[0];
    var sy = document.createElement("span"); sy.className = "sym"; sy.textContent = o[0];
    b.appendChild(sy);
    b.appendChild(document.createTextNode(o[1]));
    b.onclick = function () { toggle(cfg.ops, o[0]); refreshSetup(); save() };
    $("#ops").appendChild(b);
  });

  $("#digits").addEventListener("click", function (e) {
    var b = e.target.closest("button.level");
    if (!b) return;
    cfg.digits = b.dataset.v;
    refreshSetup(); save();
  });

  $("#tLevels").addEventListener("click", function (e) {
    var b = e.target.closest("button.level");
    if (!b) return;
    cfg.tMode = b.dataset.v;
    if (cfg.tMode === "low") cfg.tables = LOW_TABLES.slice();
    else if (cfg.tMode === "high") cfg.tables = HIGH_TABLES.slice();
    else if (cfg.tMode === "all") cfg.tables = ALL_TABLES.slice();
    $("#customTablesAcc").open = false;
    refreshSetup(); save();
  });

  ALL_TABLES.forEach(function (n) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.v = String(n);
    b.textContent = String(n);
    b.setAttribute("aria-label", "Angka " + n);
    b.onclick = function () {
      if (cfg.tMode === "low") cfg.tables = LOW_TABLES.slice();
      else if (cfg.tMode === "high") cfg.tables = HIGH_TABLES.slice();
      else if (cfg.tMode === "all") cfg.tables = ALL_TABLES.slice();
      else if (cfg.tMode === "hard") cfg.tables = [];
      toggle(cfg.tables, n);
      cfg.tables.sort(function (x, y) { return x - y });
      cfg.tMode = "custom";
      refreshSetup(); save();
    };
    $("#tables").appendChild(b);
  });

  $("#count").addEventListener("click", function (e) {
    var b = e.target.closest("button.cnt");
    if (!b) return;
    cfg.count = +b.dataset.v;
    refreshSetup(); save();
  });

  /* --- State sesi kuis & hasil --- */
  var run = null, qs = [], i = 0, score = 0, wrong = [], locked = false, ended = false;
  var qStart = 0, qElapsed = 0, tSum = 0, lockedAt = 0;

  function renderHome() {
    ended = true; locked = false; qStart = 0;
    var ul = $("#stats"), any = false;
    ul.innerHTML = "";
    OPS.forEach(function (o) {
      var s = data.stats[o[0]];
      if (s && s.t) {
        any = true;
        var li = document.createElement("li");
        li.textContent = o[1] + ": " + Math.round(s.c / s.t * 100) + "% benar dari " + s.t + " soal, rata-rata " + (s.ms / s.t / 1000).toFixed(1) + " detik.";
        ul.appendChild(li);
      }
    });
    var bn = Object.keys(data.bank).length;
    $("#bankCard").hidden = !bn;
    if (bn) {
      $("#bankCardSub").textContent = "Ada " + bn + " soal yang perlu dilatih lagi";
    }
    $("#bankInfo").textContent = bn ? "Soal salah yang menunggu diulang: " + bn + "." : "";
    $("#statsBox").hidden = !(any || bn);
    if (!(any || bn)) $("#statsBox").open = false;
    var rs = $("#reset");
    rs.textContent = "Hapus catatan dan soal salah";
    rs.dataset.sure = "";
    show("home");
  }

  function build(c) {
    var out = [], used = {};
    var pool = Object.keys(data.bank)
      .map(function (k) { var q = data.bank[k].q; return mk(q.op, q.a, q.b) })
      .filter(function (q) { return fits(q, c) });
    shuffle(pool).slice(0, 3).forEach(function (q) { out.push(q); used[key(q)] = 1 });
    var n = 0;
    while (out.length < c.count && n++ < 250) {
      var q = gen(c);
      if (!used[key(q)]) { used[key(q)] = 1; out.push(q) }
    }
    var tries = 0;
    while (out.length < c.count) {
      var q2 = gen(c);
      if (out.length && key(out[out.length - 1]) === key(q2) && tries++ < 20) continue;
      tries = 0; out.push(q2);
    }
    return shuffle(out);
  }

  function setPadDisabled(off) {
    document.querySelectorAll("#pad .key[data-k]").forEach(function (b) { b.disabled = off });
  }

  function beginSession(questions, label, replaceHist) {
    qs = questions;
    i = 0; score = 0; wrong = []; tSum = 0; ended = false; locked = false;
    $("#stname").textContent = label;
    try {
      if (replaceHist) history.replaceState({ view: "quiz" }, "");
      else history.pushState({ view: "quiz" }, "");
    } catch (e) { }
    show("quiz");
    ask();
  }

  function start(fromRetry) {
    save();
    lastSessionMode = "normal";
    run = JSON.parse(JSON.stringify(cfg));
    var label = orderedOps(run.ops).map(function (o) { return NAME[o] }).join(" & ");
    beginSession(build(run), label, fromRetry);
  }

  function startBank(replaceHist) {
    var list = Object.keys(data.bank).map(function (k) { var q = data.bank[k].q; return mk(q.op, q.a, q.b) });
    if (!list.length) { renderHome(); return }
    lastSessionMode = "bank";
    beginSession(shuffle(list).slice(0, 10), "Ulangi soal yang pernah salah", replaceHist);
  }

  function uniqueWrong() {
    var seen = {}, out = [];
    wrong.forEach(function (w) {
      var k = key(w.q);
      if (!seen[k]) { seen[k] = 1; out.push(mk(w.q.op, w.q.a, w.q.b)) }
    });
    return out;
  }

  function startWrongOnly() {
    var list = uniqueWrong();
    if (!list.length) return;
    beginSession(shuffle(list), "Ulangi soal yang salah", true);
  }

  function ask() {
    locked = false;
    var q = qs[i];
    $("#num").textContent = "Soal " + (i + 1) + " dari " + qs.length;
    $("#pbar").style.width = (i / qs.length * 100) + "%";
    $("#question").textContent = q.a + " " + q.op + " " + q.b + " = ?";
    var a = $("#answer");
    a.value = "";
    a.classList.remove("locked");
    setPadDisabled(false);
    $("#check").textContent = "Jawab";
    var f = $("#fb"); f.className = "fb"; f.textContent = "";
    qElapsed = 0; qStart = now();
  }

  function addDigit(d) {
    if (locked || ended) return;
    var a = $("#answer");
    if (a.value.length >= MAX_DIGITS) return;
    a.value = a.value === "0" ? d : (a.value + d);
    var f = $("#fb");
    if (f.classList.contains("warn")) { f.className = "fb"; f.textContent = "" }
  }

  function delDigit() {
    if (locked || ended) return;
    var a = $("#answer");
    if (a.value.length) a.value = a.value.slice(0, -1);
  }

  function submit() {
    if (ended) return;
    if (locked) { next(); return }
    var v = $("#answer").value.trim();
    if (!/^\d+$/.test(v)) {
      var fw = $("#fb");
      fw.className = "fb warn";
      fw.textContent = "Ketuk angka dulu untuk menjawab.";
      return;
    }
    var dt = qElapsed + (qStart ? now() - qStart : 0);
    qStart = 0;
    dt = Math.min(Math.max(0, dt), MAX_Q_MS);
    tSum += dt;

    var q = qs[i], r = ans(q), f = $("#fb"), k = key(q);
    var st = data.stats[q.op] || (data.stats[q.op] = { c: 0, t: 0, ms: 0 });
    locked = true;
    lockedAt = now();
    $("#answer").classList.add("locked");
    setPadDisabled(true);
    st.t++; st.ms += dt;

    if (+v === r) {
      score++; st.c++;
      f.className = "fb ok";
      f.textContent = "Benar! " + q.a + " " + q.op + " " + q.b + " = " + r;
      if (data.bank[k]) { data.bank[k].need--; if (data.bank[k].need <= 0) delete data.bank[k] }
      save();
    } else {
      wrong.push({ q: q, got: v });
      data.bank[k] = { q: mk(q.op, q.a, q.b), need: 3 };
      save();
      f.className = "fb no";
      f.textContent = "Belum tepat. " + q.a + " " + q.op + " " + q.b + " = " + r + " (jawabanmu " + v + ")\n" + tip(q);
    }
    $("#check").textContent = "Lanjut";
  }

  function next() {
    if (!locked || ended) return;
    locked = false;
    i++;
    if (i >= qs.length) finish(i);
    else ask();
  }

  function finish(done) {
    if (ended) return;
    ended = true; locked = false; qStart = 0;
    var total = done, p = total ? score / total : 0, avg = total ? (tSum / total / 1000) : 0;
    $("#pbar").style.width = "100%";
    $("#final").textContent = score + " / " + total;
    $("#meta").textContent = total ? "Akurasi " + Math.round(p * 100) + "% · Rata-rata " + avg.toFixed(1) + " detik per soal." : "";
    $("#msg").textContent = !total ? "Belum ada soal yang dijawab."
      : p === 1 ? "Sempurna! Semua jawabanmu benar."
        : p >= .8 ? "Bagus sekali, tinggal sedikit lagi."
          : p >= .5 ? "Cukup baik. Ulangi lagi supaya refleks makin cepat."
            : "Tidak apa-apa. Pelan-pelan dulu, utamakan ketepatan sebelum kecepatan.";
    var tb = $("#targetBox");
    if (total > 0) {
      tb.hidden = false;
      if (p >= .9 && avg <= 5) {
        tb.className = "target-box ready";
        tb.textContent = "Target tercapai (akurasi ≥ 90% dan ≤ 5 detik/soal). Siap naik tingkat!";
      } else if (p >= .9) {
        tb.className = "target-box";
        tb.textContent = "Akurasi sudah ≥ 90%. Latih rutin agar kecepatan turun di bawah 5 detik/soal.";
      } else {
        tb.className = "target-box";
        tb.textContent = "Target naik tingkat: akurasi ≥ 90% dengan rata-rata di bawah 5 detik/soal.";
      }
    } else {
      tb.hidden = true;
    }
    var ul = $("#wrongList"); ul.innerHTML = "";
    wrong.forEach(function (w) {
      var li = document.createElement("li");
      li.textContent = w.q.a + " " + w.q.op + " " + w.q.b + " = " + ans(w.q) + " (jawabanmu " + w.got + ")";
      ul.appendChild(li);
    });
    $("#wrongBox").hidden = !wrong.length;
    var rw = $("#retryWrong"), uw = uniqueWrong().length;
    rw.hidden = !uw;
    if (uw) rw.textContent = "Ulangi " + uw + " soal salah";
    var canRetry = lastSessionMode === "bank" ? Object.keys(data.bank).length > 0 : true;
    $("#retry").hidden = !canRetry;
    show("result");
  }

  /* --- Event listeners --- */
  $("#pad").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.id === "check") { submit(); return }
    var k = b.dataset.k;
    if (k === "del") delDigit();
    else if (k !== undefined) addDigit(k);
  });

  document.addEventListener("keydown", function (e) {
    if ($("#quiz").hidden || ended) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault(); addDigit(e.key); return;
    }
    if (e.key === "Backspace") {
      e.preventDefault(); delDigit(); return;
    }
    if (e.key === "Escape" && !locked) {
      e.preventDefault(); $("#answer").value = ""; return;
    }
    if (e.key === "Enter") {
      if (e.target && e.target.id === "quit") return;
      e.preventDefault();
      if (!locked) submit();
      else if (now() - lockedAt > 250) next();
    }
  });

  document.addEventListener("visibilitychange", function () {
    if ($("#quiz").hidden || locked || ended) return;
    if (document.hidden) {
      if (qStart) { qElapsed += now() - qStart; qStart = 0 }
    } else {
      if (!qStart) qStart = now();
    }
  });

  window.addEventListener("popstate", function () {
    if (!$("#quiz").hidden && !ended) {
      var answered = locked ? i + 1 : i;
      if (answered > 0) finish(answered);
      else renderHome();
    } else if (!$("#setup").hidden || !$("#result").hidden) {
      renderHome();
    }
  });

  $("#bankCard").onclick = function () { startBank(false) };
  $("#start").onclick = function () { start(false) };
  $("#quit").onclick = function () { finish(locked ? i + 1 : i) };
  $("#toHome").onclick = renderHome;
  $("#retry").onclick = function () {
    if (lastSessionMode === "bank") startBank(true);
    else start(true);
  };
  $("#retryWrong").onclick = startWrongOnly;
  $("#reset").onclick = function () {
    var b = $("#reset");
    if (b.dataset.sure) { data.bank = {}; data.stats = {}; save(); renderHome() }
    else { b.dataset.sure = "1"; b.textContent = "Yakin? Klik sekali lagi untuk menghapus" }
  };

  renderHome();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(function () { });
    });
  }
})();
