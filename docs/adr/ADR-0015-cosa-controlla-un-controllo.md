# ADR-0015 — Cosa controlla un controllo, in un prodotto che non scansiona i file

- **Stato:** Accettata
- **Data:** 2026-07-29

## Contesto

La prima persona che ha installato il prodotto ha aperto il cruscotto e ha cercato il pulsante della
scansione. Non c'era.

Non c'era per una ragione difendibile: i file sono il mestiere di Defender, e
[ADR-0001](ADR-0001-complementare-a-defender.md) dice di non rifarlo. Il prodotto guarda le truffe, e
lo fa in tempo reale — l'estensione del browser, il blocco di rete, la sorveglianza delle cartelle.
Tutto vero, e tutto invisibile.

Solo che «non ne ha bisogno» è la risposta giusta alla domanda sbagliata. Chi apre un prodotto di
sicurezza cerca qualcosa da premere, e uno schermo che si limita a raccontare uno stato viene letto
come uno schermo che non sta facendo niente. Il pulsante non serve al PC: serve a rendere visibile un
lavoro che c'è.

La tentazione, in questi casi, è la barra di avanzamento che striscia sulle cartelle per arrivare a
una conclusione già scritta. È teatro, e in un prodotto di sicurezza il teatro è una bugia: insegna a
fidarsi di un'animazione invece che di una difesa.

## Decisione

Un pulsante, **«Controlla ora»**, che guarda le tre cose che nessun altro guarda su quel PC.

### 1. Gli indirizzi dove il computer è stato davvero

La cronologia dei browser passata al motore di rilevamento. Non è una scansione finta: sono gli
indirizzi che quella persona ha aperto, giudicati dallo stesso motore che giudica i link in tempo
reale. Ed è la parte differenziante — l'antivirus guarda i file che arrivano, questo guarda i posti
dove si è già stati.

Chromium (Chrome, Edge, Brave, Vivaldi, Opera) e Firefox tengono la cronologia in database SQLite. Il
database viene **copiato prima di essere letto**: un browser aperto tiene un log di scrittura, e un
lettore che apre il file vivo o perde le visite più recenti o — peggio — scrive in un file che non è
suo.

### 2. Le protezioni spente

Le stesse lacune che il cruscotto già mostra, raccolte nel risultato del controllo. Costano una
domanda a Defender e sono la metà dei problemi veri di una macchina consumer.

### 3. Se i file si possono rimettere a posto

Esiste una copia da cui ripartire, oppure no. Su piano Free non esiste, e il controllo lo dice invece
di tacerlo.

### Il controllo racconta, non agisce

Mille indirizzi degli ultimi due mesi non sono mille decisioni da prendere adesso. Bloccarli in blocco
trasformerebbe un solo falso positivo in un sito che la persona non raggiunge più, per una pagina che
aveva aperto settimane fa. Vale qui la stessa regola di
[ADR-0006](ADR-0006-osservare-prima-di-bloccare.md): prima si guarda, poi si blocca — e chi blocca è
il tempo reale, non il riepilogo.

Nel registro delle analisi finisce **solo ciò che è stato trovato**. Registrare mille indirizzi
ordinari significherebbe tenere l'elenco di tutti i posti dove quel computer è stato: un archivio che
nessuno ci ha chiesto di costruire, e che seppellirebbe le poche righe che contano.

### La cronologia è di chi la chiede

Il servizio gira come LocalSystem e può leggere il profilo di ogni account della macchina. La cartella
che ha il permesso di leggere non gliela dice la richiesta: gliela dice la **connessione**, come per il
ripristino ([ADR-0011](ADR-0011-di-chi-sono-i-file-che-proteggiamo.md)) e per le cartelle protette
([ADR-0012](ADR-0012-chi-puo-chiedere-cosa-al-canale-locale.md)). Una richiesta che potesse nominare
la cartella sarebbe il modo di farsi consegnare la cronologia di qualcun altro dal nostro servizio.

### Nessuna richiesta esce dal PC

Il controllo analizza in **locale**, senza le interrogazioni di rete che il motore fa su un singolo
indirizzo. Mille interrogazioni al registro di qualcun altro non sono un controllo, sono un piccolo
attacco — e direbbero a quel registro esattamente dove è stato questo computer. Il flag che le
disattiva lo mette il codice che esegue il controllo, mai un chiamante: una richiesta capace di
spegnere i controlli di rete sarebbe una richiesta capace di indebolire il motore.

### Un sito visitato mille volte è un sito

Il budget di indirizzi non si spende in ordine di cronologia. Le regole, misurabili senza browser:
gli indirizzi più recenti prima, la query string ignorata (la stessa pagina si nasconde dietro cento
indirizzi diversi), e **al massimo sei indirizzi per sito**. Senza quest'ultima, tutto il budget va al
sito che quella persona legge ogni mattina, e l'indirizzo aperto una volta sola da un SMS — quello che
conta — non viene mai guardato.

## Conseguenze e limiti dichiarati

- **Misurato su questa macchina** (29 luglio 2026): 3 profili di browser leggibili, 2.148 indirizzi
  negli ultimi 60 giorni, **494 scelti** dalle regole qui sopra, analizzati in **43 ms**. Un
  pericoloso zero, un «da verificare» (un dominio brasiliano di servizio). Il controllo è quindi
  praticamente istantaneo: il tempo che l'utente aspetta è quello della domanda a Defender.
- **Il numero grande non è il numero vero.** 2.148 diventa 494 perché il resto sono duplicati, pagine
  interne dello stesso sito e indirizzi che non possono essere una truffa. Mostrare 2.148 sarebbe più
  impressionante e meno onesto.
- **Non guarda i file.** Se qualcuno cerca qui una scansione antivirus, non la trova, e il testo del
  comando lo dice: «Non cerca virus nei file: quello lo fa Defender».
- **Non guarda i preferiti.** Un segnalibro a una truffa è raro ma possibile; la cronologia era la
  prima metà del lavoro.
- **Sessanta giorni.** Prima è archeologia: un dominio di truffa vive giorni, e un verdetto su un sito
  spento da mesi è rumore.
- **Il registro dice chi ha chiesto il controllo, quanti indirizzi e cosa è uscito.** Non gli
  indirizzi.

## Alternative scartate

- **La scansione dei file.** Duplicare Defender con meno firme, meno storia e meno risorse. Il modo
  più rapido di essere peggio del prodotto già installato.
- **Una barra di avanzamento sulle cartelle.** Il teatro di cui sopra. Se il controllo dura 43 ms,
  farlo durare tre minuti per sembrare serio è mentire sul lavoro svolto.
- **Bloccare quello che il controllo trova.** Vedi sopra: un falso positivo su un indirizzo vecchio
  diventa un sito irraggiungibile, e la persona non collega la causa all'effetto.
- **Leggere la cronologia dal cruscotto invece che dal servizio.** Il cruscotto gira come l'utente, e
  sarebbe la scelta più semplice. Ma il motore, le correzioni dell'utente e lo stato di Defender stanno
  nel servizio: metà del controllo sarebbe finita dove non c'è niente con cui farlo.
- **Interrogare la rete su ogni indirizzo.** Mille query RDAP per un pulsante. Lento, maleducato verso
  chi offre quel servizio gratis, e un elenco della navigazione di qualcuno spedito fuori dal PC.
