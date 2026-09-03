// Misurazione della pagina: Google Analytics 4, consenso e revoca.
//
// Sta in un file separato invece che dentro l'HTML perche' le pagine sono piu' di una e
// questo codice e' lungo: duplicarlo vorrebbe dire correggerlo ogni volta in tutti i posti,
// e prima o poi una delle copie resta indietro.

(function () {
  'use strict';

  var ID = 'G-JZZBCT8QJM';
  var CHIAVE = 'cetrai-consenso';        // 'si' | 'no', in localStorage
  var PRIVACY = 'privacy.html';

  function leggi() {
    try { return localStorage.getItem(CHIAVE); } catch (e) { return null; }   // finestra privata
  }
  function scrivi(v) {
    try { localStorage.setItem(CHIAVE, v); } catch (e) { /* niente da fare */ }
  }

  // ---------- gtag ----------
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  // Il default e' "negato" e viene dichiarato PRIMA di caricare gtag.js: e' l'ordine che
  // rende valido il Consent Mode. Con il consenso negato Analytics manda comunque un ping
  // senza cookie, quindi il conteggio grezzo delle visite non si perde.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  if (leggi() === 'si') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);

  gtag('js', new Date());
  gtag('config', ID);

  // ---------- eventi ----------
  function suClick(el, nome, dati) {
    if (!el) { return; }
    el.addEventListener('click', function () { gtag('event', nome, dati); });
  }

  function eventi() {
    // I tre pulsanti "Scarica" puntano allo stesso file. Senza un evento esplicito diventano
    // tre uscite anonime identiche e non si capisce quale pezzo di pagina convince davvero.
    // Serve anche per un secondo motivo: GA4 riconosce da solo i download di .exe e .zip,
    // ma non di .msi, quindi senza questo evento il download non verrebbe contato affatto.
    var punti = { 'nav-dl': 'barra', 'dl': 'hero', 'dl2': 'fondo-pagina' };
    Object.keys(punti).forEach(function (id) {
      suClick(document.getElementById(id), 'download', {
        posizione: punti[id],
        file_name: 'CetrAI-Setup-x64.msi'
      });
    });

    // Chi clicca qui invece di scaricare sta ancora valutando: e' il segnale che la pagina
    // non ha convinto al primo colpo, e vale la pena tenerlo separato dal download.
    suClick(document.querySelector('a.btn.ghost[href="#cosa-fa"]'), 'esplora',
            { posizione: 'hero' });

    // I documenti sono file .md serviti grezzi: non sono pagine HTML, quindi non generano
    // un page_view. Senza questo evento le aperture della documentazione sono invisibili.
    Array.prototype.forEach.call(
      document.querySelectorAll('a[href$=".md"]'),
      function (a) {
        suClick(a, 'documento', { link_url: a.getAttribute('href') });
      }
    );
  }

  // ---------- banner e revoca ----------
  function pulisciCookie() {
    // Rifiutare deve anche ripulire: se uno aveva accettato e poi cambia idea, lasciargli
    // addosso i cookie gia' scritti renderebbe il "Rifiuta" una bugia.
    var host = location.hostname;
    var domini = ['', host, '.' + host];
    var punto = host.indexOf('.');
    if (punto > -1) { domini.push('.' + host.slice(punto + 1)); }

    document.cookie.split('; ').forEach(function (c) {
      var nome = c.split('=')[0];
      if (nome.indexOf('_ga') !== 0) { return; }
      domini.forEach(function (d) {
        document.cookie = nome + '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT' +
                          (d ? '; domain=' + d : '');
      });
    });
  }

  function decide(risposta) {
    scrivi(risposta);
    if (risposta === 'si') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    } else {
      gtag('consent', 'update', { analytics_storage: 'denied' });
      pulisciCookie();
    }
    var b = document.getElementById('cookie-banner');
    if (b) { b.remove(); }
  }

  var css = document.createElement('style');
  css.textContent = [
    '#cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;',
    'max-width:640px;margin:0 auto;background:#141b26;color:#eaf0f8;border:1px solid #212c3d;',
    'border-radius:12px;padding:18px 20px;box-shadow:0 10px 40px rgba(0,0,0,.45);',
    'font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
    'display:flex;gap:16px;align-items:center;flex-wrap:wrap}',
    '#cookie-banner p{margin:0;flex:1 1 260px;color:#93a3ba}',
    '#cookie-banner a{color:#3ddc97}',
    '#cookie-banner .cb-azioni{display:flex;gap:10px;flex:0 0 auto}',
    '#cookie-banner button{font:inherit;font-weight:700;border-radius:8px;padding:10px 18px;',
    'border:0;cursor:pointer}',
    '#cb-si{background:#3ddc97;color:#04160e}',
    '#cb-no{background:transparent;color:#93a3ba;border:1px solid #212c3d}',
    '#cookie-banner button:hover{filter:brightness(1.08)}',
    '.cb-revoca{cursor:pointer;background:none;border:0;padding:0;font:inherit;',
    'color:inherit;opacity:.75;text-decoration:underline}'
  ].join('');
  document.head.appendChild(css);

  function mostraBanner() {
    if (document.getElementById('cookie-banner')) { return; }

    var box = document.createElement('div');
    box.id = 'cookie-banner';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Consenso alle statistiche');
    box.innerHTML =
      '<p>Usiamo Google Analytics per contare le visite e capire cosa funziona. ' +
      'Nessuna pubblicit&agrave;, nessun dato rivenduto. Se rifiuti, il conteggio resta anonimo ' +
      'e senza cookie. <a href="' + PRIVACY + '">Dettagli</a>.</p>' +
      '<div class="cb-azioni">' +
        '<button type="button" id="cb-no">Rifiuta</button>' +
        '<button type="button" id="cb-si">Accetta</button>' +
      '</div>';

    document.body.appendChild(box);
    document.getElementById('cb-si').addEventListener('click', function () { decide('si'); });
    document.getElementById('cb-no').addEventListener('click', function () { decide('no'); });
  }

  function riapri() {
    try { localStorage.removeItem(CHIAVE); } catch (e) { /* niente da fare */ }
    mostraBanner();
  }

  // L'informativa ha un suo collegamento dentro il testo: gli serve questa funzione, altrimenti
  // dovrebbe reimplementare la stessa logica e le due copie divergerebbero.
  window.cetraiConsenso = { riapri: riapri };

  // Revocare deve costare quanto acconsentire, altrimenti il consenso non e' libero:
  // questo collegamento in fondo alla pagina riapre lo stesso banner e permette di cambiare idea.
  function linkRevoca() {
    var piede = document.querySelector('footer .wrap') || document.querySelector('footer');
    if (!piede) { return; }

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cb-revoca';
    b.textContent = 'Cookie e statistiche';
    b.addEventListener('click', riapri);

    if (piede.tagName === 'FOOTER') {
      var p = document.createElement('p');
      p.style.marginTop = '6px';
      p.appendChild(b);
      piede.appendChild(p);
    } else {
      piede.appendChild(b);
    }
  }

  function avvia() {
    eventi();
    linkRevoca();
    var scelto = leggi();
    if (scelto !== 'si' && scelto !== 'no') { mostraBanner(); }
  }

  if (document.body) { avvia(); }
  else { document.addEventListener('DOMContentLoaded', avvia); }
})();
