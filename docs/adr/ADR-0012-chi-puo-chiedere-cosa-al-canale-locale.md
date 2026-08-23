# ADR-0012 — Chi può chiedere cosa al canale locale

- **Stato:** Accettata
- **Data:** 2026-07-28

## Contesto

Il canale locale (una named pipe) è aperto a **tutti gli utenti autenticati** della macchina. È la
scelta giusta per la domanda «questo link è una truffa?»: chiunque usi il computer deve poterla
fare, e la risposta non riguarda i file di nessuno.

Non è la scelta giusta per «rimetti i file com'erano». Il servizio gira come LocalSystem e può
scrivere i documenti di chiunque, e con
[ADR-0011](ADR-0011-di-chi-sono-i-file-che-proteggiamo.md) ha cominciato a tenerne le copie di
**tutti** gli utenti. Messe insieme, le due cose davano a chiunque avesse un account su questa
macchina — o a un programma che gira con quell'account — un modo per sovrascrivere i documenti di
un'altra persona con copie vecchie, **usando il nostro servizio**, che i privilegi per farlo ce li ha.

Il difetto è stato introdotto allargando la protezione. È il costo tipico di una funzione che
diventa più utile: la superficie cresce con lei, e va guardata nello stesso momento.

## Decisione

### 1. L'identità si prende dal canale, non dalla richiesta

Ciò che il client dice di sé è un'affermazione; il token dietro la connessione è un fatto, e lo
tiene Windows. Il servizio impersona il chiamante sulla pipe e ne ricava nome, cartella del profilo
(dal registro, non indovinata dal nome dell'account) e se è amministratore.

### 2. Un ripristino non tocca i file di un altro

La regola è **«non di qualcun altro»**, non «solo miei»:

- file dentro il mio profilo → sì;
- file dentro il profilo di un'altra persona → no;
- file che non stanno nel profilo di nessuno (`D:\Lavoro`) → sì.

L'ultimo punto non è una concessione: le cartelle predefinite non coprono quasi mai dove uno tiene
davvero il lavoro, per questo le cartelle protette si possono configurare. Una regola che ti lascia
copiare `D:\Lavoro` ma mai ripristinarlo sarebbe una copia di sicurezza che non funziona. Una
cartella che non è di nessuno in particolare è stata resa protetta da chi amministra la macchina.

Un amministratore è esente: quei file può già scriverli senza di noi, e rifiutarglielo sarebbe
teatro. Un chiamante che non riusciamo a identificare non ha un profilo, quindi non tocca niente di
nessuno.

Il filtro sta **dentro** il piano di ripristino, non accanto: ciò che il ripristino promette e ciò
che scrive devono essere lo stesso insieme, altrimenti il piano promette file che poi non tocca.

### 3. Chi ha chiesto il ripristino finisce nel registro

Un'operazione che riscrive documenti deve lasciare il nome di chi l'ha chiesta.

### 4. Una correzione appartiene a chi l'ha fatta

Stesso problema, superficie più piccola: `feedback --safe` valeva **per tutta la macchina**, quindi
qualunque utente locale poteva far tacere l'avviso su un dominio per 90 giorni anche per gli altri —
sul computer di famiglia, proprio per la persona che l'avviso doveva proteggere.

Le correzioni sono ora legate al SID di chi le fa: la chiave dell'archivio è (indirizzo, autore).
Una correzione mia non cambia la risposta che riceve un altro, e non è di un altro da rimuovere.
Un'analisi senza nessuno dietro — un controllo di sfondo — riceve l'opinione del prodotto, che è
quella che difenderemmo.

Non c'è migrazione: una correzione di cui non sappiamo l'autore è esattamente ciò che questa tabella
ha smesso di contenere, quindi le vecchie righe si buttano. Il prodotto non è mai stato distribuito,
quindi quelle righe esistono solo sulle macchine di sviluppo.

### 5. Alzare la protezione delle cartelle si può chiedere; abbassarla no

Attivare la protezione delle cartelle personali di Windows richiede i privilegi di amministratore, e
un utente normale non aprirà mai un terminale amministratore per farlo: la funzione esisteva
(`cetrai harden --apply`) e restava spenta proprio sulle macchine per cui è stata scritta. Il
servizio quei privilegi ce li ha già. Spostare quella capacità sul canale locale è la cosa utile e
la cosa pericolosa nello stesso gesto, quindi il canale ne riceve solo un pezzo, tagliato così:

**Il canale non ha la parola per spegnere.** Le richieste possibili sono quattro — leggere, avviare
l'osservazione, attivare il blocco, autorizzare e bloccare — e nessuna abbassa la protezione. Non è
un `if` che rifiuta: è un tipo che non contiene il valore. Un `if` regge finché qualcuno non
aggiunge un ramo.

**Il canale conferma il passo, non lo sceglie.** La richiesta deve coincidere con il passo che
[ADR-0006](ADR-0006-osservare-prima-di-bloccare.md) ha già deciso. Senza questa regola chiunque sulla
macchina potrebbe chiedere il blocco il primo giorno — e il blocco senza l'osservazione ferma i
programmi onesti dell'utente, che è esattamente il danno per cui l'osservazione esiste, e un ottimo
modo per farsi disinstallare. Il rifiuto vale anche per un amministratore: l'attesa non è un
controllo di permessi, e l'elevazione dice chi sei, non che la settimana è passata.

**Un solo passo chiede l'elevazione: quello che concede un permesso.** Avviare l'osservazione e
attivare il blocco *tolgono* capacità — se un malware vuole accendere il nostro scudo, si accomodi.
Autorizzare dei programmi a scrivere nelle cartelle protette invece ne *dà* una, ed è l'unico che un
chiamante non elevato non ottiene. Il cruscotto risponde a quel rifiuto con la richiesta di
amministratore di Windows, non con un modo per aggirarla.

**L'elenco dei programmi da autorizzare non arriva mai nella richiesta.** Lo costruisce il servizio
dal registro eventi di Defender. Un chiamante che potesse nominare i programmi da autorizzare
nominerebbe sé stesso. Prima di applicarlo il cruscotto mostra i percorsi per esteso e chiede
conferma: l'ultimo filtro è una persona che riconosce i nomi.

## Conseguenze

- **Provato dal vivo:** copia di 5 file, tutti rovinati, ripristino chiesto dal canale locale →
  ripristinati, e nel registro «Ripristino dalla copia … chiesto da KONCEPTOR\jorge». Il cruscotto
  continua a funzionare come prima per chi possiede i file. Il giro completo della correzione —
  pericoloso → «non è una truffa» → sicuro → rimossa → pericoloso — funziona come prima per chi la
  fa.
- **Provato dal vivo (cartelle personali):** chiesto al canale il passo sbagliato → rifiutato, con
  scritto quale sarebbe quello giusto; chiesto quello che concede permessi da un chiamante non
  elevato → rifiutato, con `needsElevation`; chiesto il passo giusto → il cancello dice sì e la
  macchina risponde «servono i privilegi di amministratore», perché il servizio girava da console.
  Nel registro resta chi ha chiesto cosa: `KONCEPTOR\jorge`, preso dalla connessione.
- **Provato per sbaglio, e vale la pena scriverlo:** con il servizio installato in esecuzione, una
  seconda copia avviata come utente normale **non riesce a creare lo stesso canale** —
  `UnauthorizedAccessException` da `NamedPipeServerStreamAcl.Create`. La pipe appartiene a
  LocalSystem, e chi non è amministratore non può aggiungere istanze a un canale che non è suo: a
  servizio avviato, il nome non si può rubare. Resta aperta la finestra prima dell'avvio del servizio,
  dove chi arriva primo tiene il nome; è il motivo per cui i client dovranno verificare l'identità del
  server, e non è ancora fatto.
- **Non provato dal vivo:** la modifica che va **a buon fine**. Serve il servizio installato come
  LocalSystem, cioè l'MSI su una macchina vera — lo stesso confine che ADR-0011 aspetta.
- **Non provato dal vivo:** il comportamento verso un **secondo utente** — né il rifiuto del
  ripristino sul profilo altrui né l'isolamento delle correzioni. Questa macchina ha un solo account
  e crearne un altro richiede privilegi che qui non ci sono; entrambe le regole sono coperte dai
  test con i casi che contano, compreso il vicino di casa che si chiama `giovanni` mentre io mi
  chiamo `gio` — un confronto di stringhe fatto senza il separatore basta a scambiarli.
