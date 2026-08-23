# ADR-0003 — Blocco di rete a livello di sistema con WFP

- **Stato:** Accettata
- **Data:** 2026-07-26

## Contesto

L'estensione browser ([ADR-0002](ADR-0002-protezione-nel-browser.md)) copre il canale da cui il
phishing arriva quasi sempre, ma non tutto: un link aperto dal client di posta, da una chat, da un
lettore PDF o da uno script non passa da lì. Serve un livello che valga per l'intera macchina.

Le strade praticabili senza driver kernel sono tre:

1. **Windows Filtering Platform in user-mode** — `FwpmFilterAdd0` sul layer `ALE_AUTH_CONNECT`;
2. **regole del firewall di Windows** — persistenti, visibili all'utente, ma lente da modificare e
   soggette a essere sovrascritte da criteri di gruppo;
3. **DNS locale (sinkhole)** — preciso sui nomi, ma richiede di intercettare la configurazione di
   rete del sistema e si rompe con DNS-over-HTTPS, che i browser attivano di loro iniziativa.

## Decisione

Usiamo **WFP dalla user-mode**. Nessun driver kernel: i callout servono solo per la deep packet
inspection, che non facciamo. È la stessa scelta che tiene CetrAI fuori dal percorso di
certificazione WHQL ([ADR-0001](ADR-0001-complementare-a-defender.md)).

Un filtro di rete lavora su **indirizzi**, non su nomi. Da qui derivano tutte le regole di sicurezza
del componente, che contano più della funzione stessa:

- **Sessione dinamica.** Ogni oggetto aggiunto sparisce quando l'handle si chiude, crash compreso.
  Un prodotto di sicurezza che lascia la macchina senza rete dopo essere morto fa più danni della
  minaccia che blocca.
- **Infrastruttura condivisa mai bloccata.** Un dominio di phishing dietro Cloudflare condivide
  l'indirizzo con migliaia di siti legittimi, banca dell'utente inclusa. Se anche un solo indirizzo
  del nome è su un intervallo condiviso noto, il blocco di sistema non viene applicato e agisce solo
  il livello browser, che è preciso perché lavora sul nome.
- **Blocco tutto-o-niente.** Se un nome risolve a più indirizzi e uno solo non è bloccabile, non ne
  blocchiamo nessuno: un blocco parziale fallisce in modo silenzioso e incoerente, e il sito
  funziona o no a seconda dell'indirizzo che il browser sceglie.
- **Rete locale mai bloccata.** Una risposta DNS avvelenata che punta al router diventerebbe
  altrimenti un blocco del servizio che installiamo noi stessi.
- **Soglia alta.** Solo verdetti *pericoloso* con confidenza ≥ 80. Un avviso che l'utente può
  chiudere costa un istante; un blocco che non vede costa fiducia.
- **Tetto di 256 host.** Ogni filtro viene valutato su ogni connessione in uscita: una lista senza
  limite diventerebbe una tassa sull'intero stack di rete della macchina.

Il lavoro passa da una coda dedicata e non blocca la risposta all'analisi: installare un filtro
richiede prima una risoluzione DNS, e farla attendere al chiamante vanificherebbe i 25 ms proprio
sul verdetto in cui la velocità conta di più.

## Conseguenze

**Positive**

- La protezione vale per ogni applicazione, non solo per il browser.
- Nessun driver, nessuna CA installata, nessuna modifica alla configurazione di rete del sistema.
- Senza privilegi di amministratore il componente si dichiara non disponibile e il resto del
  prodotto continua a funzionare: nessun percorso critico dipende da questo livello.

**Negative**

- Servono privilegi di amministratore: la funzione è attiva quando CetrAI gira come servizio
  Windows, non quando lo si avvia da console per sviluppo.
- I blocchi non sopravvivono al riavvio del servizio. È una scelta, non una mancanza — la sessione
  dinamica è ciò che rende il componente sicuro — ma va spiegata.
- Le liste degli intervalli condivisi invecchiano. Un intervallo non aggiornato costa un mancato
  blocco di sistema, mai un blocco sbagliato: un intervallo sconosciuto ricade su "non condiviso"
  solo dopo aver superato le altre regole.

## Alternative scartate

- **Regole del firewall di Windows.** Persistono oltre la vita del processo: proprio ciò che non
  vogliamo. Un blocco rimasto in piedi dopo la disinstallazione è un problema di supporto che non
  possiamo permetterci.
- **DNS sinkhole locale.** Sarebbe preciso sui nomi, ma i browser attivano DNS-over-HTTPS da soli e
  aggirerebbero il sinkhole senza dire nulla: una protezione che smette di funzionare in silenzio è
  peggio di nessuna protezione.
