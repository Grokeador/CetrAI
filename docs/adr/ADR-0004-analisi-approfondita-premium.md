# ADR-0004 — Analisi approfondita: cosa esce dal PC, e cosa può cambiare

- **Stato:** Accettata
- **Data:** 2026-07-27

## Contesto

Il motore locale chiude la maggior parte dei casi da solo, ma ne lascia aperta una fascia di mezzo:
domini che non sono né ufficiali né palesemente fraudolenti, messaggi che usano una sola leva
retorica invece di tre. Il motore lo sa e lo dichiara (`NeedsDeeperAnalysis`), ma non ha modo di
decidere.

È anche la funzione su cui si regge il modello **"Free protegge, Premium risolve"**: il
rilevamento e il blocco restano gratuiti per tutti, e a pagamento c'è lo sguardo più attento
proprio dove serve. Perché quel posizionamento tenga, l'analisi approfondita deve essere un
di più, mai una parte necessaria della protezione.

## Decisione

Un'analisi di secondo livello via API Claude (`claude-opus-5`), con quattro vincoli che contano più
della chiamata in sé.

**1. Esce solo l'ambiguo.** Un verdetto locale conclusivo non viene inviato: non c'è niente da
chiedere, e chiedere costerebbe denaro e riservatezza per una risposta che abbiamo già.

**2. Esce solo ciò che l'utente ha sottoposto.** `AllowedSources` include messaggi PEC, email, SMS e
inserimenti manuali; **esclude la navigazione**. Chi incolla un messaggio sospetto ci ha chiesto di
esaminarlo; chi apre una pagina non ci ha chiesto di raccontarlo a nessuno. Mandare a un servizio
remoto ogni indirizzo ambiguo che una persona visita sarebbe un altro prodotto, non quello descritto
nel README.

**3. La risposta affina, non ribalta.** Si applica solo a un caso che il motore locale ha dichiarato
irrisolto, e il veto del catalogo vale anche qui: una risposta che marca come truffa un ente
verificato viene scartata. Un servizio remoto, per quanto bravo, non può dire che la banca
dell'utente è una truffa, né togliere un blocco locale su cui non gli è stato chiesto nulla.

**4. Il guasto è invisibile.** Chiave assente, rete giù, servizio che declina, budget esaurito: il
verdetto locale resta e l'utente non se ne accorge.

Dettagli implementativi che seguono da questi vincoli:

- Le istruzioni sono un blocco costante, mai interpolato, marcato per la **cache**: una sola data o
  un solo dominio dentro quel blocco invaliderebbe la cache a ogni richiesta e triplicherebbe in
  silenzio il costo della funzione. Il caso da esaminare sta nel turno utente, dopo il confine.
- La risposta è vincolata da uno **schema**: livello, confidenza, spiegazione, consiglio, motivi.
  Tutto il resto è un difetto che possiamo rilevare invece di interpretare.
- **Tetto giornaliero** di analisi: una funzione a pagamento attivabile dall'uso normale ha bisogno
  di un limite che l'utente non possa superare per sbaglio.
- `stop_reason: "refusal"` è una risposta normale, non un'eccezione: i classificatori di sicurezza
  possono declinare, e analizzare contenuti di phishing è materia adiacente. Leggere il contenuto
  senza controllarlo consegnerebbe all'utente un verdetto vuoto.
- La chiave arriva da configurazione o variabile d'ambiente `ANTHROPIC_API_KEY`. Mai nel codice,
  mai nei log, mai in `appsettings.json`.
- Il controllo del piano sta nel servizio, non dentro l'analista: il prodotto gratuito non deve
  nemmeno arrivare alla rete.

## Conseguenze

**Positive**

- La fascia ambigua smette di essere un vicolo cieco, ed è esattamente il valore che giustifica
  l'abbonamento.
- Nessuna dipendenza dalla rete sul percorso critico: la protezione gratuita è invariata.
- Le regole di riservatezza sono nel codice e verificate dai test, non solo in una pagina di
  informativa.

**Negative**

- Una dipendenza esterna a pagamento, con costi che crescono con l'uso. Mitigata da cache, tetto
  giornaliero, soglia di ambiguità e risposta breve.
- Latenza dell'ordine dei secondi sui casi ambigui: accettabile perché sono la minoranza e perché
  il verdetto locale è già stato dato.
- **Non ancora verificata contro il servizio reale**: serve una chiave API. Il codice compila, i
  test coprono le regole che non richiedono rete, ma la chiamata vera non è stata eseguita.

## Alternative scartate

- **Analisi cloud su tutta la navigazione.** Darebbe più segnale, al prezzo di mandare a un terzo la
  cronologia di navigazione dell'utente. Incompatibile con il resto del prodotto.
- **Sostituire il motore locale con il modello.** Costo per ogni verdetto, latenza su ogni pagina, e
  dipendenza dalla rete per una funzione che deve valere anche offline.
- **Chiave incorporata nel prodotto.** Sarebbe estraibile in cinque minuti e addebitata a noi.
