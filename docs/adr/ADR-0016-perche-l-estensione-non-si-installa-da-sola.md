# ADR-0016 — Perché l'estensione non si installa da sola, e cosa fa invece l'installazione

- **Stato:** Accettata
- **Data:** 2026-07-30

## Contesto

La richiesta è ragionevole e arriva da chi il prodotto lo userà: *installo CetrAI, e l'estensione
deve comparire da sola in tutti i browser che ho*. È anche la cosa giusta da volere — l'estensione è
il posto dove la truffa arriva davvero, e ogni passo lasciato all'utente è un passo che una parte
degli utenti non farà.

Il problema è che quella cosa, sui browser di oggi, si può fare **solo con il meccanismo dei
programmi indesiderati**.

## Cosa consente ciascun browser

- **Chrome ed Edge su Windows** accettano un'estensione esterna solo se è **pubblicata nel loro
  store**: si scrive una voce di registro con l'identificatore e l'indirizzo di aggiornamento dello
  store, il browser la scarica al riavvio e **chiede conferma all'utente una volta**. L'installazione
  da file locale è stata chiusa nel 2014, proprio perché era il canale preferito di adware e barre
  degli strumenti.
- **Firefox** ha rimosso l'installazione da registro nella versione 74 (2020). Restano lo store
  (addons.mozilla.org) e le policy aziendali.
- **Le policy aziendali** (`ExtensionInstallForcelist`, `ExtensionSettings`) installano davvero in
  silenzio e senza conferma. Marcano però il browser come **«gestito dalla tua organizzazione»**,
  sono pensate per macchine aziendali amministrate, e sono esattamente ciò che gli antivirus — noi
  compresi — segnalano quando le trova un programma qualunque sul PC di una persona.

## Decisione

**Non usiamo le policy.** Un prodotto che si difende dai programmi indesiderati non può installarsi
come uno di loro; e la prima azienda a cui mostreremo questo codice riconoscerebbe il meccanismo prima
di finire la pagina.

Quello che l'installazione fa, e che è automatico davvero:

1. **Il ponte nativo si registra da solo** per Chrome, Edge e Firefox (già così da
   [ADR-0009](ADR-0009-come-si-installa.md)): la metà del collegamento che dipende da noi è pronta
   prima che l'utente apra il browser.
2. **I browser vengono contati.** Il servizio sa quali sono installati su quella macchina e quali
   possono raggiungerci, e il cruscotto lo mostra.
3. **L'estensione viene offerta dai browser stessi**, appena sarà pubblicata: l'installer scrive la
   voce di registro con l'identificatore dello store, e Chrome ed Edge la propongono al riavvio con
   una conferma sola. Il codice c'è (`StoreOffer`), gli identificatori sono vuoti, e con identificatori
   vuoti non scrive niente — una voce che punta a un'estensione inesistente farebbe interrogare lo
   store ogni giorno per sempre.

### Quello che il cruscotto dice, e quello che non dice

Due fatti diversi, tenuti separati:

- **«Il browser può raggiungerci»** è una voce di registro scritta dall'installazione. È verificabile,
  ed è un punto verde.
- **«Sei protetto mentre navighi»** dipende dall'estensione, che non possiamo installare né vedere
  dall'esterno. Quindi non viene affermato: viene **misurato**. Quando un'estensione ci chiede di un
  indirizzo, quella domanda è la prova che esiste e funziona, e il cruscotto dice quando è arrivata
  l'ultima. Se non è mai arrivata, lo dice.

## Conseguenze e limiti dichiarati

- **Finché l'estensione non è nello store, il passo resta manuale**, e il cruscotto lo dichiara invece
  di far finta. Pubblicarla richiede tre account (Chrome Web Store, Edge Add-ons, addons.mozilla.org),
  una revisione, e per Chrome una quota una tantum: decisioni di chi possiede il prodotto, come la
  chiave di firma e il posto dove pubblicare gli aggiornamenti ([ADR-0013](ADR-0013-come-si-aggiorna-il-prodotto.md)).
- **Anche dopo la pubblicazione resta una conferma dell'utente.** È una conferma sola, al riavvio del
  browser, ed è la stessa che chiedono Bitdefender e Avast: nessuno la evita, e chi la evita lo fa con
  le policy.
- **Non sappiamo in quale browser l'estensione sia attiva**, solo che una lo è: il ponte nativo riceve
  la stessa identità da Chrome, Edge e da ogni altro Chromium. Dire «attiva su Chrome» sarebbe una
  supposizione.
- **La misura si azzera a ogni riavvio del servizio.** È voluto: è un'affermazione su ciò che abbiamo
  visto, non su ciò che qualcuno ha installato una volta.

## Alternative scartate

- **Policy di installazione forzata.** Vedi sopra: funziona, ed è il motivo per cui non si usa.
- **Scrivere l'estensione nel profilo del browser a mano** (copiare i file in `Extensions/`). I
  browser firmano e verificano il contenuto del profilo: l'estensione verrebbe disabilitata al primo
  avvio, e nel frattempo avremmo scritto dentro i dati di qualcun altro.
- **Aprire lo store al primo avvio, senza chiedere.** Una finestra che si apre da sola dopo
  un'installazione è la cosa che le persone chiudono senza leggere — e la seconda volta la chiudono
  più in fretta.
