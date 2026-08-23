# ADR-0002 — Protezione nel browser: estensione MV3 con host nativo

- **Stato:** Accettata
- **Data:** 2026-07-26

## Contesto

Il phishing arriva quasi sempre dentro il browser. SmartScreen offre l'anti-phishing completo
**solo dentro Edge**, mentre in Italia la quota d'uso è dominata da Chrome: è la lacuna più diretta
fra quelle che CetrAI esiste per colmare.

Manifest V3 ha rimosso il `webRequest` bloccante, quindi l'approccio storico — intercettare la
richiesta, decidere, poi lasciarla passare — non è più disponibile. Restano tre strade:

1. `declarativeNetRequest` con regole statiche: blocca prima della richiesta, ma le regole devono
   essere note in anticipo;
2. controllo alla navigazione (`webNavigation`) e redirezione della scheda: funziona su indirizzi
   mai visti, ma agisce **dopo** che la richiesta è partita;
3. proxy locale o intercettazione TLS: copre tutto, ma richiede di installare una CA nel sistema.

## Decisione

Combiniamo le prime due, in quest'ordine:

- **primo incontro** → controllo alla navigazione; il verdetto arriva in decine di millisecondi e,
  se è "pericoloso", la scheda va alla pagina di avviso;
- **da lì in poi** → una regola dinamica `declarativeNetRequest` per quell'host; la pagina non viene
  più nemmeno caricata.

L'estensione non parla con un server: si collega a un **host di native messaging** locale
(`CetrAI.BrowserBridge`), che a sua volta interroga il servizio sulla stessa macchina. Se il
servizio non è in esecuzione, l'host analizza da solo.

**Dal browser escono solo schema, dominio e percorso.** Query e frammento non vengono mai letti, e
gli indirizzi locali o di rete privata sono ignorati del tutto. Il filtro è applicato due volte,
nell'estensione e nell'host: un host non si fida del proprio chiamante.

L'identità dell'estensione è fissata da una chiave pubblica inserita in `manifest.json`, così l'id
è stabile su ogni macchina e l'host può autorizzare esattamente quell'id. La chiave privata resta
fuori dal repository.

## Conseguenze

**Positive**

- Funziona su Chrome ed Edge con lo stesso codice, senza CA installate né intercettazione TLS.
- Permessi minimi: niente `history`, `cookies`, `notifications` né lettura del contenuto delle
  pagine. Per un prodotto di sicurezza la lista dei permessi è essa stessa un argomento di vendita.
- Nessun indirizzo visitato lascia la macchina.
- I verdetti stanno in `chrome.storage.session`: non toccano il disco e spariscono con il browser.

**Negative**

- La primissima richiesta verso un host sconosciuto parte comunque. Per il phishing è accettabile —
  quello che conta è che l'utente non inserisca i dati — ma è una lacuna reale, che chiude il blocco
  a livello di sistema (WFP) previsto in fase 2.
- Le regole dinamiche `declarativeNetRequest` hanno un tetto per estensione: la lista degli host
  bloccati andrà gestita a finestra scorrevole quando crescerà.
- Firefox richiede manifest e registrazione diversi: previsto, non ancora verificato.

## Alternative scartate

- **Proxy locale con intercettazione TLS.** Copre ogni applicazione, non solo il browser, ma impone
  di installare una CA nel sistema. Su un prodotto consumer di sicurezza è esattamente la mossa che
  fa perdere fiducia — ed è quella che è costata la reputazione ad altri antivirus.
- **Sole regole statiche `declarativeNetRequest`.** Bloccano solo ciò che è già in lista: inutili
  contro un dominio registrato quel giorno, che è il caso normale nel phishing.
