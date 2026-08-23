# Modello di minaccia

- **Aggiornato:** 28 luglio 2026
- **Ambito:** il prodotto CetrAI installato su un PC Windows di casa, più il backend che ne
  custodisce la chiave.

Due domande, tenute separate perché si rispondono in modo diverso: **da chi difendiamo l'utente**, e
**cosa può fare un attaccante contro di noi**. La seconda è quella che di solito non viene scritta.

## 1. Da chi difendiamo l'utente

L'avversario è **chi fa truffe di massa in Italia**: campagne SMS e PEC che si fingono Agenzia delle
Entrate, INPS, PagoPA, Poste, le grandi banche; kit di phishing ospitati su domini che richiamano un
marchio; ransomware che cifra le cartelle personali di chi ha aperto l'allegato sbagliato.

Ha risorse limitate e lavora sui numeri: manda un milione di messaggi perché mille persone
abbocchino. **Non** è un avversario che studia il singolo bersaglio, non ha uno zero-day, non compra
un certificato di firma per ingannare noi.

Chi è preso di mira da uno stato o da un avversario dedicato ha bisogno di altro, e dirglielo è più
utile che promettergli di proteggerlo.

## 2. Cosa il prodotto non è

- **Non è un antivirus.** Windows Defender ha il motore, il driver e gli aggiornamenti delle firme.
  Duplicarlo sarebbe una cattiva copia di una cosa gratuita ([ADR-0001](adr/ADR-0001-complementare-a-defender.md)).
- **Non ferma exploit né codice che gira già con privilegi di amministratore.** Chi è
  amministratore può fermare il servizio: un prodotto che non si può disinstallare è malware.
- **Non protegge da chi ha accesso fisico** e non cifra niente.
- **Non decide al posto dell'utente.** Blocca, avvisa, e lascia una via d'uscita che scade.

## 3. La superficie del prodotto stesso

Il servizio gira come **LocalSystem**: è il conto da cui parte ogni ragionamento qui sotto. Un
difetto sfruttabile nel servizio è una compromissione completa della macchina, quindi tutto ciò che
il servizio accetta dall'esterno va guardato una volta di più.

| Via d'ingresso | Cosa potrebbe farci un attaccante | Cosa lo ferma oggi |
|---|---|---|
| **Canale locale** (named pipe) | Farsi riscrivere i file di un altro utente; spegnere gli avvisi per tutti; leggere cosa hanno guardato gli altri | Nessuna esposizione di rete. Identità presa dalla connessione, non dalla richiesta. Ripristino limitato a chi non è di qualcun altro, correzioni e cronologia legate al SID di chi le fa ([ADR-0012](adr/ADR-0012-chi-puo-chiedere-cosa-al-canale-locale.md)). Messaggi con tetto di dimensione, solo JSON |
| **Canale locale → cartelle protette** | Usare il nostro servizio, che è LocalSystem, per **spegnere** la protezione di Windows senza essere amministratore; oppure **accenderla di colpo** per fermare i programmi dell'utente; oppure farsi autorizzare a scrivere nelle cartelle protette | Il canale non ha la parola per spegnere: le richieste possibili non contengono un valore che abbassi la protezione. La richiesta deve coincidere col passo che la politica ha già deciso, quindi il blocco non si può anticipare. L'unico passo che *concede* un permesso richiede l'elevazione, e l'elenco dei programmi lo costruisce il servizio dal registro di Defender — non arriva mai nella richiesta ([ADR-0012](adr/ADR-0012-chi-puo-chiedere-cosa-al-canale-locale.md) §5) |
| **Canale locale → cronologia dei browser** | Farsi consegnare dal nostro servizio LocalSystem la cronologia di un altro account; oppure far uscire dal PC l'elenco dei siti visitati sotto forma di mille interrogazioni di rete | La cartella da leggere la decide la **connessione**: la richiesta non contiene percorsi, quindi non può nominare il profilo di qualcun altro. L'analisi è locale e forzata tale dal codice del controllo, non da un campo della richiesta. Nel risultato tornano solo gli indirizzi trovati sospetti, e nel registro non torna nessun indirizzo ([ADR-0015](adr/ADR-0015-cosa-controlla-un-controllo.md)) |
| **Estensione + ponte nativo** | Far analizzare tutta la navigazione; far uscire dal PC indirizzi privati o token nelle query | Il manifesto ammette **una sola** estensione; dal browser escono solo dominio e percorso, mai query, token o reti private; la navigazione non esce mai verso il cloud ([ADR-0004](adr/ADR-0004-analisi-approfondita-premium.md)) |
| **Archivio delle copie** | Cancellare i backup prima di cifrare; leggere i documenti degli altri utenti | Permessi espliciti applicati **dal servizio a ogni avvio**: solo SYSTEM e gli amministratori, nemmeno in lettura. Ferma il ransomware non elevato, che è quasi tutto ([ADR-0008](adr/ADR-0008-copie-che-sopravvivono-all-attacco.md)) |
| **Configurazione** | Spegnere la protezione scrivendo un file | Sta in `Programmi`, dove scrive solo un amministratore. Il piano ricade su Free se manca o è scritto male ([ADR-0009](adr/ADR-0009-come-si-installa.md)) |
| **Liste esterne di domini** | Una riga avvelenata con `poste.it` taglierebbe fuori un paese dalla propria banca | Il catalogo degli enti verificati ha il **veto**: una lista può aggiungere pericoli, mai togliere fiducia. E le liste sono spente di default |
| **Analisi approfondita** | Farsi mandare i contenuti di qualcuno; far spendere a nostro nome | Escono solo i casi che il motore locale dichiara irrisolti e solo i contenuti sottoposti dall'utente. La chiave non è mai sul PC del cliente: token di licenza revocabile, con quota e limite di frequenza ([ADR-0005](adr/ADR-0005-dove-vive-la-chiave-api.md), [ADR-0010](adr/ADR-0010-il-backend-che-tiene-la-chiave.md)) |
| **Correzioni dell'utente** | Marcare come sicuro un dominio di truffa, per tutti e per sempre | Solo da un processo su questa macchina, solo per chi la fa, e scade dopo 90 giorni |
| **Risposta al ransomware** | Far congelare al servizio, che è LocalSystem, un programma che serve a Windows — o il servizio stesso | Si congela solo con il quadro completo di un attacco, solo un programma non di sistema, solo se è l'unico, e mai noi. Congelato, non ucciso: `cetrai resume --pid` funziona senza servizio e senza amministratore ([ADR-0014](adr/ADR-0014-fermare-chi-sta-cifrando.md)) |
| **Backend** | Usare una licenza rubata; leggere i casi analizzati; rubare la chiave | Del token conserviamo solo l'impronta; quota e limite di frequenza per licenza; revoca immediata; il caso non entra mai in un registro; si rifiuta di partire in chiaro fuori da localhost |
| **Esperienza condivisa** | Vedere cosa fa una persona; far concludere «sicuro» su una campagna vera; impedire a tutti di imparare | Vedi sotto — è l'unica cosa in questo prodotto che parte accesa e manda qualcosa fuori, quindi ha il suo paragrafo |

### L'unica cosa che esce

Tutto il resto di questa tabella riguarda cose che **entrano**. L'esperienza condivisa esce, parte
accesa, e l'installazione la chiede prima — quindi è quella che merita il conto più lungo.

**Cosa passa sul filo.** Una fascia di punteggio e un elenco di sigle: `9|MSG_CREDENTIAL_REQUEST`.
Non c'è un indirizzo, un messaggio, un nome o un dato ricavato dalla macchina, e non perché
promettiamo di non metterceli: perché la grammatica in `SharedExperience` non li ammette e un
rapporto che ne contenesse uno viene **rifiutato invece che ripulito**. Non è un dato reso anonimo,
è un dato che non ha mai riguardato nessuno. Il controllo gira su tutte e due le estremità — in
uscita perché un difetto nostro non diventi una fuga, in entrata perché un server che si fida dei
propri client è il modo in cui una lista condivisa diventa un attacco a chi la legge.

**Il numero di installazione.** Un GUID casuale in un file di `ProgramData`, cancellabile, non
derivato da hardware, account o licenza. Serve a una cosa sola: che una macchina che ripete la
stessa conclusione venti volte non sembri venti macchine d'accordo. E **costa zero fabbricarne
diecimila** — è il fatto da cui discende tutto il resto di questo paragrafo.

| Chi ha identità gratuite può | Cosa lo ferma |
|---|---|
| Far concludere **«sicuro»** su una campagna vera, e far chiudere il dubbio in verde a tutte le installazioni | Una conclusione `Safe` **non attraversa il filo**, in nessuna direzione: `SharedExperience.MayTravel` la scarta in uscita e `LessonBook.Adopt` la scarta di nuovo in entrata. Il peggio che un voto vinto ottiene è un **falso allarme** su una forma — rumoroso, misurabile contro il corpus dei legittimi, e correggibile da chi lo subisce. Il silenzio non si sceglie: un falso negativo somiglia a una giornata tranquilla |
| **Impedire di imparare**: una richiesta con un'identità inventata contraddiceva una forma e la spegneva per tutta la flotta — l'attacco più economico dei due | Convincere e squalificare costano lo stesso: la conclusione regge quando chi la sostiene è almeno *N* **e** supera chi la contraddice di altrettanto. Il costo dell'attacco diventa proporzionale al numero di identità, invece che pari a uno |
| Votare su tutto in una volta, da una sola identità | Cento forme per scambio: sopra qualunque cosa sia stata misurata (una passata completa sul corpus ne produce sei), sotto la capienza del libro. Le eccedenti si tagliano e si scrive che è successo, invece di rifiutare un rapporto che potrebbe essere onesto |
| Aspettare che il parco cresca, quando «due d'accordo» non vuol più dire niente | Il minimo sale da solo con le installazioni, fino a venticinque. La configurazione resta un pavimento: si può chiedere più prudenza, mai meno |
| Leggere il traffico in transito | Niente token, niente segreto e niente di personale nel corpo, che è la ragione per cui questo endpoint può stare in chiaro su una rete di casa mentre quello delle licenze si rifiuta di partire |

**E chi controlla il raccoglitore.** Può rispondere quello che vuole. Ciò che lo limita non sta
dalla sua parte: ciò che torna è adottato come lezione ordinaria, **mai come seme**, non sovrascrive
mai una forma che questa macchina conosce già, scade dopo novanta giorni e **muore alla prima
contraddizione di un'opinione pagata qui**. La prova locale batte la folla, perché la folla non può
vedere la banca di questa persona. E un raccoglitore spento non degrada niente: il prodotto ha
imparato da solo prima che esistesse.

### Quando qualcosa va storto

Le decisioni prese in questi punti hanno tutte la stessa forma: **fallire chiuso**. La licenza che
non riusciamo a identificare non spende; il chiamante che non riusciamo a identificare non ripristina
niente e non corregge niente; il piano che non riusciamo a leggere è Free; il trasporto che non
possiamo verificare non parte. Nessuna di queste è una scelta comoda, e tutte costano al massimo una
chiamata all'assistenza — mentre l'errore opposto costa i documenti di qualcuno.

## 4. Quello che manca

In ordine di gravità, non di difficoltà.

1. **L'aggiornamento c'è ma è spento**, perché mancano una chiave di firma e un posto dove
   pubblicare — decisioni, non codice ([ADR-0013](adr/ADR-0013-come-si-aggiorna-il-prodotto.md)).
   Finché è spento, un difetto trovato dopo l'installazione resta sulla macchina del cliente per
   sempre. La parte pericolosa è già scritta e provata: il canale di aggiornamento è il modo più
   efficiente per compromettere in blocco i clienti di un prodotto di sicurezza, quindi un manifesto
   non firmato da noi non viene accettato nemmeno se arriva da un nostro indirizzo.
2. **Il codice non è firmato.** SmartScreen avvisa, e fa bene. Serve un certificato EV, che è una
   spesa e una decisione dell'utente, non tecnica.
3. **Installato una volta, e non su una macchina pulita.** Il 29 luglio l'MSI è entrato per la prima
   volta su una macchina vera — quella di sviluppo — e ha trovato subito tre difetti: il prodotto
   funzionava e non si vedeva (nessun avvio del cruscotto, finestra aperta a ogni logon, icona
   nell'area nascosta di Windows 11). Restano da provare una macchina **pulita**, senza .NET e con un
   altro antivirus, e il cambio di account: tre difetti gravi di questo mese si vedevano **solo**
   cambiando account.
4. **Nessuna prova con un secondo utente.** Isolamento di cronologia, correzioni e ripristino è
   coperto dai test ma mai eseguito con due account veri: questa macchina ne ha uno solo.
5. **Nessun modello locale — e ora sappiamo dove serve.** Misurato sul corpus: il motore locale
   lascia incerte **2 truffe su 38 fra gli indirizzi (5,3%)** e **5 messaggi su 10**. Sugli
   indirizzi il piano gratuito è solido; sul **testo** no. Un modello locale, quando si farà, deve
   essere un lettore di italiano, non un altro giudice di nomi a dominio — e gli manca la materia
   prima: un corpus vero di messaggi di truffa italiani. Un modello addestrato e misurato sugli
   stessi dieci esempi darebbe un numero che mente.
6. **Il colpevole lo riconosciamo solo se ha ancora un file aperto.** Ora lo chiediamo al Restart
   Manager e, quando è l'unico programma non di sistema, lo **congeliamo**: provato su un attacco
   inscenato, fermato al quinto file ([ADR-0014](adr/ADR-0014-fermare-chi-sta-cifrando.md)). Ma
   vediamo solo chi tiene un file aperto nell'istante in cui chiediamo: un ransomware abbastanza
   veloce sfugge, e quanta parte delle famiglie reali sfugga non lo sappiamo — il finto ransomware
   si comporta come si comporta perché l'abbiamo scritto noi. La certezza richiede ancora ETW
   kernel-file o un minifiltro firmato.
7. **Un'identità nell'esperienza condivisa costa ancora zero.** Le difese descritte sopra limitano il
   **danno** di un voto vinto — non possono più far tacere il prodotto, solo farlo gridare a torto —
   e rendono l'attacco proporzionale invece che costante. Nessuna di esse impedisce di fabbricare
   identità, e non c'è modo di impedirlo senza legare un'installazione a qualcosa che la identifica,
   che è esattamente ciò che questo prodotto ha deciso di non fare. Resta aperto e va detto: con
   abbastanza identità inventate si mette in stallo una forma, e con molte di più si promuove un
   falso allarme. Quello che *non* si ottiene, per costruzione, è il silenzio.
8. **Il backend gira in un'istanza sola, con archivi su file**, e le licenze si emettono a mano.
9. ~~**Il nome del canale locale, prima che il servizio parta.**~~ **Chiuso.** A servizio avviato la
   pipe è sua e non si può rubare: provato involontariamente il 29 luglio, una seconda copia avviata
   come utente normale viene respinta da Windows perché il canale appartiene a LocalSystem. Ma chi
   arriva **prima** teneva il nome, e i nostri client si fidavano di trovare noi dall'altra parte.
   Ora il client controlla **chi possiede la pipe** prima di mandare un solo byte, e pretende
   LocalSystem o il gruppo amministratori: non il nome del processo né il suo percorso, che un
   impostore sceglie, ma il proprietario dell'oggetto, che Windows scrive dall'account che l'ha
   creato e che un utente normale non può falsificare. Provato in tutti e due i versi — una pipe
   creata dall'utente che esegue i test viene rifiutata, e il `cetrai` appena compilato parla senza
   problemi col servizio installato davvero.

## 5. Come teniamo onesto questo elenco

Tre difetti importanti di questo mese sono passati sotto una suite verde: il pacchetto che non si
avviava, la protezione che sorvegliava una cartella vuota, la revoca che non revocava. Nessuno era
visibile leggendo il codice o guardando i test — si vedevano **eseguendo**, attraverso il confine
vero: un altro processo, un altro account, un'altra macchina.

La risposta al ransomware è l'esempio più netto. Aveva i suoi test, tutti verdi, e non funzionava:
chiedeva a Windows dei file appena cambiati, che per definizione nessuno tiene più aperti. E il
rimedio tentato — misurare quanti byte scrive ogni programma — alla prima prova ha congelato Chrome.
Nessuna delle due cose era visibile senza inscenare un attacco.

Da qui la regola che governa il tracker del progetto: una funzione è verde solo se è stata eseguita
dove deve vivere. L'installer è giallo perché non è mai stato installato, l'estensione perché non è
mai stata caricata in un browser, il blocco di rete perché un filtro vero non è mai stato inserito.
Un 84% che regge una domanda vale più di un 87% che non la regge.
