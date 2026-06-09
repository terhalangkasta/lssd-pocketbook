/* ===== LSSD Pocketbook — app logic ===== */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const data = window.POCKETBOOK;
  const nav = $("#nav");
  const root = $("#contentInner");

  /* ---------- Build sidebar nav (grouped) ---------- */
  const groups = [];
  data.sections.forEach((s) => {
    let g = groups.find((x) => x.name === s.group);
    if (!g) { g = { name: s.group, items: [] }; groups.push(g); }
    g.items.push(s);
  });

  groups.forEach((g) => {
    const gEl = el("div", "nav-group");
    gEl.dataset.group = g.name;
    const title = el("div", "nav-group-title", esc(g.name));
    title.addEventListener("click", () => gEl.classList.toggle("collapsed"));
    gEl.appendChild(title);
    g.items.forEach((s) => {
      const a = el("a", "nav-link");
      a.href = "#" + s.id;
      a.dataset.target = s.id;
      a.innerHTML = `<span class="ic">${esc(s.icon)}</span><span class="lbl">${esc(s.title)}</span>`;
      gEl.appendChild(a);
    });
    nav.appendChild(gEl);
  });

  /* ---------- Hero ---------- */
  const totalCodes = (() => {
    const sec = data.sections.find((s) => s.id === "ten-codes");
    const t = sec && sec.blocks.find((b) => b.type === "table");
    return t ? t.rows.length : 0;
  })();

  const hero = el("div", "hero");
  hero.innerHTML = `
    <span class="hero-tag">LSSD · INTERNAL</span>
    <h1>${esc(data.meta.title)}</h1>
    <p>${esc(data.meta.subtitle)}</p>
    <div class="hero-stats">
      <div class="hero-stat"><div class="n">${data.sections.length}</div><div class="l">Bagian</div></div>
      <div class="hero-stat"><div class="n">${totalCodes}</div><div class="l">Ten Codes</div></div>
      <div class="hero-stat"><div class="n">${groups.length}</div><div class="l">Kategori</div></div>
    </div>`;
  root.appendChild(hero);

  /* ---------- Block renderers ---------- */
  const renderers = {
    intro: (b) => el("p", "block intro", esc(b.text)),

    note: (b) => {
      const c = el("div", "block card note");
      if (b.title) c.appendChild(el("div", "card-title", esc(b.title)));
      c.appendChild(el("p", null, esc(b.text)));
      return c;
    },
    example: (b) => {
      const c = el("div", "block card example");
      if (b.title) c.appendChild(el("div", "card-title", esc(b.title)));
      c.appendChild(el("p", null, esc(b.text)));
      return c;
    },
    callout: (b) => el("div", "block callout", esc(b.text)),

    ranks: (b) => {
      const rankColors = {
        "Sheriff": "#3b82f6", "Undersheriff": "#3b82f6", "Assistant Sheriff": "#3b82f6",
        "Division Chief": "#22c55e", "Area Commander": "#22c55e", "Captain": "#22c55e",
        "Lieutenant": "#ef4444", "Sergeant": "#ef4444",
        "Deputy Sheriff 2": "#eab308", "Deputy Sheriff 1": "#eab308", "Deputy Sheriff": "#eab308", "Deputy Sheriff Trainee": "#eab308",
        "Academy Recruit": "#9ca3af",
      };
      const wrap = el("div", "block ranks");
      b.items.forEach((r, i) => {
        const row = el("div", "rank");
        const c = rankColors[r] || "#eab308";
        row.innerHTML = `<span class="num" style="color:${c}">${String(i + 1).padStart(2, "0")}</span><span style="color:${c}">${esc(r)}</span>`;
        wrap.appendChild(row);
      });
      return wrap;
    },

    legend: (b) => {
      const wrap = el("div", "block");
      if (b.title) wrap.appendChild(el("div", "card-title", esc(b.title)));
      const grid = el("div", "legend");
      b.items.forEach((it) => {
        const row = el("div", "legend-item");
        row.innerHTML = `<span class="swatch" style="background:${esc(it.color)}"></span><div><b>${esc(it.label)}</b> — <span>${esc(it.desc)}</span></div>`;
        grid.appendChild(row);
      });
      wrap.appendChild(grid);
      return wrap;
    },

    tree: (b) => {
      const wrap = el("div", "block tree");
      b.items.forEach((node) => {
        const n = el("div", "tree-node");
        n.appendChild(el("div", "parent", esc(node.name)));
        const ul = el("ul", "tree-children");
        node.children.forEach((c) => ul.appendChild(el("li", null, esc(c))));
        n.appendChild(ul);
        wrap.appendChild(n);
      });
      return wrap;
    },

    table: (b) => {
      const wrap = el("div", "block table-wrap");
      const thead = `<thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      wrap.innerHTML = `<table>${thead}${tbody}</table>`;
      return wrap;
    },

    deflist: (b) => {
      const wrap = el("div", "block");
      if (b.title) wrap.appendChild(el("div", "card-title", esc(b.title)));
      const dl = el("dl", "deflist");
      b.items.forEach((it) => {
        const d = el("div", "def");
        if (it.color) d.style.borderLeft = `3px solid ${it.color}`;
        d.innerHTML = `<dt${it.color ? ` style="color:${esc(it.color)}"` : ""}>${esc(it.term)}</dt><dd>${esc(it.desc)}</dd>`;
        dl.appendChild(d);
      });
      wrap.appendChild(dl);
      return wrap;
    },

    steps: (b) => {
      const wrap = el("div", "block");
      if (b.title) wrap.appendChild(el("div", "steps-title", esc(b.title)));
      const list = el("div", "steps");
      b.items.forEach((s) => {
        const step = el("div", "step");
        step.appendChild(el("p", null, esc(s)));
        list.appendChild(step);
      });
      wrap.appendChild(list);
      return wrap;
    },

    bullets: (b) => {
      const ul = el("ul", "block bullets");
      b.items.forEach((it) => ul.appendChild(el("li", null, esc(it))));
      return ul;
    },

    radio: (b) => {
      const c = el("div", "block radio-card");
      c.innerHTML = `
        <h4>${esc(b.title)}</h4>
        <div class="radio-fmt">${esc(b.format)}</div>
        <div class="radio-ex">
          <div class="ex"><span class="lang en">EN</span><p>${esc(b.example_en)}</p></div>
          <div class="ex"><span class="lang id">ID</span><p>${esc(b.example_id)}</p></div>
        </div>`;
      return c;
    },

    weapons: (b) => {
      const wrap = el("div", "block weapons" + (b.variant === "illegal" ? " illegal" : ""));
      b.classes.forEach((cl) => {
        const card = el("div", "wclass");
        const ol = cl.items.map((i) => `<li>${esc(i)}</li>`).join("");
        card.innerHTML = `<h4>${esc(cl.name)}</h4><ol>${ol}</ol>`;
        wrap.appendChild(card);
      });
      return wrap;
    },

    penal: (b) => {
      const c = el("div", "block penal-card");
      const charges = b.charges.map((ch) => `<li>${esc(ch)}</li>`).join("");
      c.innerHTML = `
        <h4>${esc(b.title)}</h4>
        <span class="main">${esc(b.main)}</span>
        <ul class="penal-charges">${charges}</ul>`;
      return c;
    },

    quote: (b) => {
      const c = el("div", "block quote");
      if (b.title) c.appendChild(el("div", "card-title", esc(b.title)));
      c.appendChild(el("p", null, "&ldquo;" + esc(b.text) + "&rdquo;"));
      return c;
    },

    "patrol-form": () => {
      const wrap = el("div", "block patrol-form");
      wrap.innerHTML = `
        <div class="pf-grid">
          <div class="pf-card"><h4>Deputy Information</h4>
            <label>Name<input id="pfName" placeholder="Full name"></label>
            <label>Station<input id="pfStation" placeholder="Station"></label>
            <label>Rank<input id="pfRank" placeholder="Rank"></label>
            <label>Badge<input id="pfBadge" placeholder="Badge number"></label>
          </div>
        </div>
        <div class="pf-grid pf-grid-2">
          <div class="pf-card"><h4>First Report</h4>
            <label>Title<input id="pf1Title" placeholder="Report title"></label>
            <label>Date<input type="date" id="pf1Date"></label>
            <label>Details<textarea id="pf1Details" rows="6" placeholder="Write details..."></textarea></label>
            <div class="pf-ev-wrap" id="pf1EvWrap"><label>Evidence<input placeholder="https://..." class="pf-ev"></label></div>
            <button class="pf-btn-sm" id="pf1AddEv">+ Evidence</button>
          </div>
          <div class="pf-card"><h4>Second Report</h4>
            <label>Title<input id="pf2Title" placeholder="Report title"></label>
            <label>Date<input type="date" id="pf2Date"></label>
            <label>Details<textarea id="pf2Details" rows="6" placeholder="Write details..."></textarea></label>
            <div class="pf-ev-wrap" id="pf2EvWrap"><label>Evidence<input placeholder="https://..." class="pf-ev"></label></div>
            <button class="pf-btn-sm" id="pf2AddEv">+ Evidence</button>
          </div>
        </div>
        <div class="pf-actions">
          <button class="pf-btn pf-primary" id="pfGenerate">Generate</button>
          <button class="pf-btn pf-secondary" id="pfCopy">Copy</button>
          <button class="pf-btn pf-secondary" id="pfClear">Clear</button>
        </div>
        <textarea id="pfOutput" class="pf-output" rows="14" readonly placeholder="Output will appear here..."></textarea>
        <div class="pf-preview-title">Preview</div>
        <div id="pfPreview" class="pf-preview"></div>`;

      setTimeout(() => {
        const v = (id, fb="Answer") => (document.getElementById(id).value.trim() || fb);
        const fmtDate = id => { const d=document.getElementById(id).value; if(!d)return"-"; const[y,m,dd]=d.split("-"); return `${dd}/${m}/${y}`; };

        // Dynamic evidence
        const addEv = (wrapId) => {
          const lbl = document.createElement("label");
          lbl.textContent = "Evidence";
          const inp = document.createElement("input");
          inp.placeholder = "https://...";
          inp.className = "pf-ev";
          lbl.appendChild(inp);
          document.getElementById(wrapId).appendChild(lbl);
        };
        document.getElementById("pf1AddEv").onclick = () => addEv("pf1EvWrap");
        document.getElementById("pf2AddEv").onclick = () => addEv("pf2EvWrap");

        const getEvidence = (wrapId) => {
          const links = Array.from(document.getElementById(wrapId).querySelectorAll(".pf-ev")).map(i=>i.value.trim()).filter(Boolean).map(l=>`[spoiler][img]${l}[/img][/spoiler]`);
          return links.length ? links.join("\n") : "-";
        };

        function bbToHtml(bb) {
          // Handle nested divbox by repeatedly replacing innermost
          let html = bb;
          while (/\[divbox=([^\]]+)\]((?:(?!\[divbox)[\s\S])*?)\[\/divbox\]/gi.test(html)) {
            html = html.replace(/\[divbox=([^\]]+)\]((?:(?!\[divbox)[\s\S])*?)\[\/divbox\]/gi, (_, c, content) => {
              const bg = c === 'white' ? 'var(--surface-2)' : c;
              return `<div style="background:${bg};border:1px solid var(--border);border-radius:6px;padding:10px;margin:6px 0">${content}</div>`;
            });
          }
          return html
            .replace(/\[b\]([\s\S]*?)\[\/b\]/gi,'<b>$1</b>')
            .replace(/\[i\]([\s\S]*?)\[\/i\]/gi,'<i>$1</i>')
            .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi,'<span style="color:$1">$2</span>')
            .replace(/\[center\]([\s\S]*?)\[\/center\]/gi,'<div style="text-align:center">$1</div>')
            .replace(/\[img\]([\s\S]*?)\[\/img\]/gi,'<img src="$1" style="max-width:100%;border-radius:4px;margin:4px 0">')
            .replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,'<details><summary>Spoiler</summary>$1</details>')
            .replace(/\n/g,'<br>');
        }

        function autoBold(text) {
          if(!text||text==="-") return text;
          const ph=[]; const pr=v=>{const t=`@@B${ph.length}@@`;ph.push(v);return t;};
          let f=text.replace(/\[b\][\s\S]*?\[\/b\]/gi,pr);
          [/\b\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,/\b(?:pukul|jam|time)\s*\d{1,2}[:.]\d{2}\b/gi,/\b\d{1,2}[:.]\d{2}\b/g,/\b(?:Deputy|Officer|Sheriff|Sergeant|Corporal|Lieutenant|Detective)\s+[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*\b/g,/\b(?:suspect|witness|korban|pelaku|saksi)\b/gi,/\b[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Station)\b/g,/\b(?:lokasi|location|area)\b/gi,/\b(?:perampokan bersenjata|armed robbery|robbery|shooting|pursuit|traffic stop|patroli|pemeriksaan|kejadian|incident|violation)\b/gi,/\b(?:kendaraan\s+berjenis|vehicle\s+model|model)\s+[A-Za-z0-9\s-]+?(?=\s+(?:berwarna|dengan|with)|[,.]|$)/gi,/\b(?:berwarna|warna|color(?:ed)?)\s+[A-Za-z]+\b/gi,/\b(?:Plate(?:\s+Nomor)?|License\s+Plate|Plat(?:e)?(?:\s+Nomor)?)\s*[:#-]?\s*[A-Z0-9-]{2,}\b/gi,/\b(?:karena|because|reason|alasan|mengapa|kenapa)\b/gi].forEach(p=>{f=f.replace(p,m=>pr(`[b]${m}[/b]`));});
          return ph.reduce((r,val,i)=>r.replace(`@@B${i}@@`,val),f);
        }

        const buildReport=(label,tId,dId,dtId,evWrapId)=>`[divbox=white]\n[b]${label} - ${v(tId,"<Insert Report Title>")}[/b]\n\n[b]Date:[/b]\n[divbox=white] ${fmtDate(dId)} [/divbox]\n\n[b]Details:[/b]\n[divbox=white] ${autoBold(v(dtId,"-"))} [/divbox]\n\n[b]Evidence:[/b]\n[divbox=white] \n${getEvidence(evWrapId)}\n[/divbox]\n\n[/divbox]`;

        document.getElementById("pfGenerate").onclick=()=>{
          const bb=`[divbox=white]\n[center][img]https://imagizer.imageshack.com/v2/200x200q70/924/Rs1Hi8.png[/img][/center]\n[/divbox]\n[divbox=#008040]\n[center][b][color=#FFFFFF]Los Santos Sheriff Department[/color][/b][/center]\n[/divbox]\n\n[divbox=white]\n[center][b]Patrol Report[/b][/center]\n[divbox=white]\n[b]Name:[/b] ${v("pfName")}\n[b]Station:[/b] ${v("pfStation")}\n[b]Rank:[/b] ${v("pfRank")}\n[b]Badge:[/b] ${v("pfBadge")}\n[/divbox]\n\n${buildReport("First Report","pf1Title","pf1Date","pf1Details","pf1EvWrap")}\n\n${buildReport("Second Report","pf2Title","pf2Date","pf2Details","pf2EvWrap")}\n[/divbox]`;
          document.getElementById("pfOutput").value=bb;
          document.getElementById("pfPreview").innerHTML=bbToHtml(bb);
        };
        document.getElementById("pfCopy").onclick=()=>navigator.clipboard.writeText(document.getElementById("pfOutput").value);
        document.getElementById("pfClear").onclick=()=>{wrap.querySelectorAll("input,textarea").forEach(i=>i.value="");document.getElementById("pfPreview").innerHTML="";};
      }, 0);

      return wrap;
    },
  };

  /* ---------- Render sections ---------- */
  data.sections.forEach((s, idx) => {
    const sec = el("section", "section");
    sec.id = s.id;
    sec.style.animationDelay = Math.min(idx * 0.04, 0.4) + "s";

    const head = el("div", "section-head");
    head.innerHTML = `
      <div class="section-icon">${esc(s.icon)}</div>
      <div>
        <div class="grp">${esc(s.group)}</div>
        <h2>${esc(s.title)}</h2>
      </div>`;
    sec.appendChild(head);

    s.blocks.forEach((b) => {
      const fn = renderers[b.type];
      if (fn) sec.appendChild(fn(b));
    });

    // searchable text cache
    sec.dataset.search = JSON.stringify(s).toLowerCase();
    root.appendChild(sec);
  });

  /* ---------- Active nav on scroll ---------- */
  const links = Array.from(document.querySelectorAll(".nav-link"));
  const sections = Array.from(document.querySelectorAll(".section"));
  const linkFor = (id) => links.find((l) => l.dataset.target === id);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.remove("active"));
          const l = linkFor(e.target.id);
          if (l) l.classList.add("active");
        }
      });
    },
    { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
  );
  sections.forEach((s) => io.observe(s));

  /* ---------- Search ---------- */
  const search = $("#search");
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let anyVisible = false;

    sections.forEach((sec) => {
      const match = !q || sec.dataset.search.includes(q);
      sec.style.display = match ? "" : "none";
      if (match) anyVisible = true;
    });

    links.forEach((l) => {
      const sec = document.getElementById(l.dataset.target);
      l.classList.toggle("hidden", q && sec.style.display === "none");
    });
    document.querySelectorAll(".nav-group").forEach((g) => {
      const visible = g.querySelectorAll(".nav-link:not(.hidden)").length > 0;
      g.classList.toggle("hidden", !visible);
    });

    let nr = $("#noResults");
    if (!anyVisible) {
      if (!nr) {
        nr = el("div", "no-results");
        nr.id = "noResults";
        nr.innerHTML = `<div class="big">🔍</div><p>Tidak ada hasil untuk "<b>${esc(q)}</b>"</p>`;
        root.appendChild(nr);
      } else {
        nr.querySelector("b").textContent = q;
        nr.style.display = "";
      }
    } else if (nr) {
      nr.style.display = "none";
    }
    // hide hero while searching
    hero.style.display = q ? "none" : "";
  });

  // "/" focuses search
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== search) {
      e.preventDefault();
      search.focus();
    }
    if (e.key === "Escape" && document.activeElement === search) {
      search.value = "";
      search.dispatchEvent(new Event("input"));
      search.blur();
    }
  });

  /* ---------- Theme ---------- */
  const html = document.documentElement;
  const stored = localStorage.getItem("lssd-theme");
  if (stored) html.setAttribute("data-theme", stored);

  function toggleTheme() {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("lssd-theme", next);
  }
  $("#themeToggle").addEventListener("click", toggleTheme);

  /* ---------- Mobile sidebar ---------- */
  const sidebar = $("#sidebar");
  const overlay = $("#overlay");
  const openMenu = () => { sidebar.classList.add("open"); overlay.classList.add("show"); };
  const closeMenu = () => { sidebar.classList.remove("open"); overlay.classList.remove("show"); };

  $("#menuToggle").addEventListener("click", () =>
    sidebar.classList.contains("open") ? closeMenu() : openMenu()
  );
  overlay.addEventListener("click", closeMenu);
  links.forEach((l) =>
    l.addEventListener("click", () => { if (window.innerWidth <= 900) closeMenu(); })
  );

  /* ---------- Back to top ---------- */
  const toTop = $("#toTop");
  window.addEventListener("scroll", () => {
    toTop.classList.toggle("show", window.scrollY > 600);
  });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();
