
// Tiny markdown to HTML (basic: headings, lists, code, paragraphs)
function mdToHtml(md) {
  const esc = (s) => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  let html = md
    .replace(/\r\n/g, '\n')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/```([\s\S]*?)```/g, (m, p1)=>'<pre><code>'+esc(p1)+'</code></pre>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n{2,}/g, '</p><p>')
  ;
  html = '<p>'+html+'</p>';
  html = html.replace(/<p><li>/g,'<ul><li>').replace(/<\/li><\/p>/g,'</li></ul>');
  return html;
}

// Build search index from tips.json + file contents
async function buildIndex() {
  const res = await fetch('tips.json');
  const tips = await res.json();
  const builder = new lunr.Builder();
  builder.ref('id');
  builder.field('title');
  builder.field('body');
  for (let i=0;i<tips.length;i++) {
    const t = tips[i];
    let body = '';
    try {
      body = await fetch(t.path).then(r=>r.text());
    } catch(e) {}
    builder.add({ id: t.id, title: t.title, body });
  }
  return { idx: builder.build(), tips };
}

async function searchTips(query) {
  if (!window.__IDX__) window.__IDX__ = await buildIndex();
  const { idx, tips } = window.__IDX__;
  if (!query) return tips;
  const results = idx.search(query);
  const ids = results.map(r=>r.ref);
  const byId = Object.fromEntries(tips.map(t=>[String(t.id), t]));
  return ids.map(id=>byId[String(id)]).filter(Boolean);
}

function $(sel, root=document){ return root.querySelector(sel); }
function el(tag, attrs={}, children=[]) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k==='class') e.className=v;
    else if (k==='html') e.innerHTML=v;
    else e.setAttribute(k,v);
  });
  children.forEach(c=>e.appendChild(c));
  return e;
}

// Render search results
async function renderSearch() {
  const q = ($('#q')?.value||'').trim();
  const list = $('#results');
  list.innerHTML = '';
  const items = await searchTips(q);
  if (!items.length) {
    list.appendChild(el('div',{class:'card small',html:'No results yet. Try “regulator” or “cooling”.'}));
    return;
  }
  items.forEach(t=>{
    const card = el('div', {class:'card'});
    const title = el('div',{html:`<a class="button primary" href="article.html?id=${encodeURIComponent(t.id)}">Open</a>`});
    const h = el('h3',{html:t.title});
    const meta = el('div',{class:'meta',html:(t.tags||[]).map(x=>`<span class="badge">${x}</span>`).join(' ')});
    card.appendChild(h);
    card.appendChild(meta);
    card.appendChild(el('div',{class:'hr'}));
    card.appendChild(title);
    list.appendChild(card);
  });
}

// Article loader
async function renderArticle() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) return;
  if (!window.__IDX__) window.__IDX__ = await buildIndex();
  const tips = window.__IDX__.tips;
  const tip = tips.find(t=>String(t.id)===String(id));
  if (!tip) { $('#article').innerHTML = '<div class="card">Not found.</div>'; return; }
  const md = await fetch(tip.path).then(r=>r.text());
  $('#title').textContent = tip.title;
  $('#meta').innerHTML = (tip.tags||[]).map(x=>`<span class="badge">${x}</span>`).join(' ');
  $('#article').innerHTML = '<div class="card article">'+mdToHtml(md)+'</div>';
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

window.RN = { renderSearch, renderArticle };
