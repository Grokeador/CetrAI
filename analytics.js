// Misurazione della pagina: Google Analytics 4 + banner di consenso.
//
// Sta in un file separato invece che dentro l'HTML perche' le pagine sono due e il
// banner e' lungo: duplicarlo vorrebbe dire correggerlo due volte ogni volta, e prima
// o poi una delle due copie resta indietro.

(function () {
  'use strict';

  var ID = 'G-JZZBCT8QJM';
  var CHIAVE = 'cetrai-consenso';   // 'si' | 'no', in localStorage

  // ---------- gtag ----------
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  // Il default e' "negato" e viene dichiarato PRIMA di caricare gtag.js: e' l'ordine che
  // rende il Consent Mode valido. Con il consenso negato Analytics manda comunque un ping
  // senza cookie, quindi il conteggio grezzo delle visite non si perde.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  var scelto = null;
  try { scelto = localStorage.getItem(CHIAVE); } catch (e) { /* modalita' privata */ }

  if (scelto === 'si') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);

  gtag('js', new Date());
  gtag('config', ID);

  // ---------- evento di download ----------
  // I tre pulsanti "Scarica" puntano allo stesso file. Senza un evento esplicito diventano
  // tre uscite anonime identiche e non si capisce quale pezzo di pagina convince davvero.
  var punti = { 'nav-dl': 'barra', 'dl': 'hero', 'dl2': 'fondo-pagina' };

  Object.keys(punti).forEach(function (id) {
    var a = document.getElementById(id);
    if (!a) { return; }   // stato.html non ha i pulsanti: nessun errore, semplicemente salta
    a.addEventListener('click', function () {
      gtag('event', 'download', {
        posizione: punti[id],
        file_name: 'CetrAI-Setup-x64.msi'
      });
    });
  });

  // ---------- banner ----------
  if (scelto === 'si' || scelto === 'no') { return; }

  // Rifiutare deve anche ripulire: se uno aveva accettato e poi cambia idea, lasciargli
  // addosso i cookie gia' scritti renderebbe il "Rifiuta" una bugia.
  function pulisciCookie() {
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
    try { localStorage.setItem(CHIAVE, risposta); } catch (e) { /* niente da fare */ }
    if (risposta === 'si') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    } else {
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
    '#cookie-banner .cb-azioni{display:flex;gap:10px;flex:0 0 auto}',
    '#cookie-banner button{font:inherit;font-weight:700;border-radius:8px;padding:10px 18px;',
    'border:0;cursor:pointer}',
    '#cb-si{background:#3ddc97;color:#04160e}',
    '#cb-no{background:transparent;color:#93a3ba;border:1px solid #212c3d}',
    '#cookie-banner button:hover{filter:brightness(1.08)}'
  ].join('');
  document.head.appendChild(css);

  var box = document.createElement('div');
  box.id = 'cookie-banner';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Consenso alle statistiche');
  box.innerHTML =
    '<p>Usiamo Google Analytics per contare le visite e capire cosa funziona. ' +
    'Nessuna pubblicit&agrave;, nessun dato rivenduto. Se rifiuti, il conteggio resta anonimo ' +
    'e senza cookie.</p>' +
    '<div class="cb-azioni">' +
      '<button type="button" id="cb-no">Rifiuta</button>' +
      '<button type="button" id="cb-si">Accetta</button>' +
    '</div>';

  function mostra() {
    document.body.appendChild(box);
    document.getElementById('cb-si').addEventListener('click', function () { decide('si'); });
    document.getElementById('cb-no').addEventListener('click', function () { decide('no'); });
  }

  if (document.body) { mostra(); }
  else { document.addEventListener('DOMContentLoaded', mostra); }
})();
