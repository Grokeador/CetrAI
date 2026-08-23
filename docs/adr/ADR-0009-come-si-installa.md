# ADR-0009 — Come si installa, e cosa l'installazione non deve fare

- **Stato:** Accettata
- **Data:** 2026-07-27

## Contesto

Fino a qui il prodotto si avviava da `dotnet run` su una macchina di sviluppo. Nessuna delle verifiche
che contano — su PC veri, con antivirus veri, con utenti che non sanno cosa sia un terminale — può
cominciare senza un pacchetto che si installa con due clic.

L'installazione di un prodotto di sicurezza è anche il momento in cui si chiedono più privilegi che
in tutto il resto della vita del programma. Vale la pena decidere in anticipo cosa **non** fare con
quei privilegi.

## Decisione

Pacchetto **MSI x64, per macchina**, in `C:\Program Files\CetrAI`. Quattro programmi: il servizio,
l'applicazione con l'icona vicino all'orologio, il comando `cetrai` e il ponte per il browser.

### Il runtime viaggia dentro

Pubblicazione **self-contained**: 163 MB installati, 58 MB di pacchetto. Chiedere a qualcuno che ha
appena preso una truffa di installare prima un runtime .NET è il modo di non farsi installare. I
quattro programmi condividono una sola copia del runtime perché finiscono nella stessa cartella.

La build è **Release**, che è anche ciò che rifiuta la chiamata diretta all'API: una copia distribuita
non può portarsi dietro una chiave, qualunque cosa dica la configurazione
([ADR-0005](ADR-0005-dove-vive-la-chiave-api.md)).

### La configurazione sta dove l'utente non scrive

`appsettings.json` vive in Programmi, scrivibile solo da un amministratore. Una configurazione che
l'utente — o un programma che gira come lui, che è esattamente il caso del ransomware — può riscrivere
è una configurazione con cui si spegne la protezione.

Quella distribuita **non è quella di sviluppo**: piano `Free`, trasporto `Backend`, analisi cloud
spenta finché il backend non esiste. Un pacchetto dimostrativo si costruisce con
`build.ps1 -Plan Premium`, che lo dice a schermo mentre lo fa: un piano a pagamento non deve entrare
di nascosto in un valore predefinito.

### Il ponte si registra da solo

Il manifesto che i browser leggono contiene il **percorso assoluto** dell'eseguibile del ponte.
L'installer non lo scrive: chiama `cetrai-bridge --register`, perché l'eseguibile è l'unica cosa
che sa sempre dove si trova. Un installer che scrive quel percorso da una variabile è un installer che
scrive il percorso sbagliato il giorno che qualcuno cambia cartella.

Se la registrazione fallisce, l'installazione **prosegue**. Un browser che rifiuta è un motivo per
avvisare, mai per annullare l'installazione di un antivirus.

### Installare deve far comparire qualcosa

La prima installazione vera ha trovato quattro difetti in fila, e tutti avevano la stessa forma: il
prodotto funzionava e non si vedeva. Il quinto, trovato al primo riavvio, era peggio: il prodotto non
funzionava affatto.

1. **L'installer non avviava l'applicazione.** Il servizio partiva, ma la sola parte visibile aspettava
   il logon successivo. Installare un antivirus e non vedere niente si legge come «non ha funzionato».
   Ora il pacchetto la avvia alla fine dell'installazione, impersonando chi sta installando: gira come
   la persona che usa il computer, non col token che l'installer ha ricevuto.
2. **L'avvio automatico apriva la finestra ogni mattina.** Mancava `--tray` nel valore di registro.
   L'applicazione, lanciata a mano, mostra il cruscotto — è quello che serve quando la lanci tu, ed è
   esattamente quello che non serve al logon. Un prodotto di sicurezza da chiudere ogni mattina è un
   prodotto di sicurezza che viene disinstallato.
3. **Il lock di istanza singola nascondeva gli aggiornamenti.** L'installer sostituiva tutti i file,
   avviava l'applicazione nuova, e quella trovava il lock in mano alla copia di prima
   dell'aggiornamento: usciva in silenzio, esattamente come era scritta. Chi provava restava davanti a
   una finestra che eseguiva il codice di ieri e concludeva, ragionevolmente, che non era stato
   installato niente — l'abbiamo visto accadere. Ora la copia nuova chiede il posto (un evento con
   nome) e quella vecchia si ritira. Una regola di istanza singola che tiene la copia **più vecchia**
   è una regola che nasconde gli aggiornamenti.
4. **Windows 11 nasconde le icone nuove.** Una icona appena registrata finisce nell'area nascosta
   dietro la freccia, e nessun programma può promuoversi da sé. Non è un difetto nostro ed è comunque
   un problema nostro: un'icona che nessuno trova è la stessa cosa di nessuna icona. Il primo avvio
   silenzioso dice una volta dove guardare, e una volta sola — un messaggio che torna ogni mattina è un
   messaggio che si impara a chiudere.

### Il difetto peggiore: dopo un riavvio, il servizio non c'era

Installato e funzionante, il prodotto non è sopravvissuto al primo riavvio. Il cruscotto diceva
«servizio non in esecuzione», e il registro del servizio non diceva **niente**: non era mai arrivato
alla riga in cui avrebbe scritto qualcosa.

Lo diceva il registro di Windows, non il nostro: eventi **7000 e 7009** — «il servizio non ha risposto
alla richiesta di avvio in modo tempestivo», timeout di 45 secondi. Windows concede quel tempo fra
«parti» e «sono partito», e l'host risponde solo quando **tutti** i servizi in background sono
rientrati da `StartAsync`. Il nostro cane da guardia, come prima cosa, chiedeva a Defender via WMI cosa
stesse proteggendo: su una macchina appena avviata quella singola domanda può costare più dell'intero
budget.

Due correzioni, e la seconda esiste perché la prima non basta mai:

1. **Il lavoro comincia dopo la risposta.** Ogni servizio in background eredita da `BackgroundWork`,
   che cede il controllo all'host prima di fare qualsiasi cosa. Non è una riga da ricordarsi in ogni
   classe: è nel tipo da cui si eredita, così chi aggiungerà il prossimo lavoro non deve conoscere
   questa storia. Un test lo verifica con un lavoro che blocca tre secondi e pretende che l'avvio
   torni entro uno.
2. **Windows lo riavvia se cade.** Riavvio dopo 60 secondi, alla prima, alla seconda e alla terza
   volta, con il contatore che si azzera dopo un giorno. Lo chiede **il servizio a sé stesso a ogni
   avvio**, non l'installer: la tabella dell'installer per farlo è documentata da Microsoft come non
   funzionante come ci si aspetterebbe (WiX lo dice a schermo mentre compila), e farlo da dentro
   raggiunge anche le macchine già installate, che un aggiornamento potrebbe non raggiungere mai. Una
   protezione che resta giù finché qualcuno non se ne accorge non è una protezione.

E, per quando accade comunque: se il servizio non è in esecuzione, il pulsante del cruscotto smette di
dire SCANSIONA e dice **AVVIA LA PROTEZIONE**. Prova prima senza privilegi e, solo se Windows rifiuta,
chiede l'autorizzazione di amministratore.

### La finestra dice quale build è

Subito dopo, la domanda che segue: *ho davvero installato la versione nuova?* Due build di `0.1.0`
sono la stessa riga in «App installate», e chi prova deve fidarsi della parola di qualcuno — mentre la
prima cosa che fa, se un pulsante nuovo non c'è, è dubitare dell'aggiornamento. È l'istinto giusto, e
non deve richiedere un terminale.

Nell'intestazione del cruscotto, accanto al nome, c'è **versione e data di compilazione**
(`0.1.0 · 29/07 18:27`). Il timbro lo mette la build in `Directory.Build.props`, quindi non si può
dimenticare di aggiornarlo. Lo stampa anche `cetrai status`, prima di tutto il resto.

### Quello che la disinstallazione non tocca

`%ProgramData%\CetrAI` resta: dentro ci sono le copie di sicurezza dei file personali e lo
storico. (Era `%LOCALAPPDATA%\CetrAI` finché [ADR-0011](ADR-0011-di-chi-sono-i-file-che-proteggiamo.md)
non ha scoperto che per il servizio quella cartella sta dentro Windows, sotto un account che non è
nessuno.) Potrebbero essere l'unica copia rimasta dei documenti di qualcuno. Cancellare i backup
durante una disinstallazione sarebbe la cosa più dannosa che questo installer potrebbe fare, ed è
proprio ciò che farebbe la scelta "pulita" e distratta.

## Conseguenze e limiti dichiarati

- **Non è firmato.** Finché non c'è un certificato EV, SmartScreen avvisa al primo avvio — e fa bene:
  un installer non firmato di un prodotto di sicurezza è esattamente la cosa davanti a cui una
  persona prudente si ferma. Il certificato è tra le voci "in pausa" del tracker, non tra quelle
  dimenticate.
- **Non c'è ancora una procedura guidata.** Il pacchetto installa con la sola barra di avanzamento.
  Le finestre di benvenuto e di fine arrivano insieme al testo di licenza, che è un documento legale
  da scrivere, non da inventare.
- **Reinstallare mentre il cruscotto è aperto.** Il pacchetto ferma il servizio, non l'applicazione:
  se il cruscotto è in esecuzione, Windows Installer chiede di chiuderlo o programma un riavvio.
  Chiuderlo prima (`taskkill /IM CetrAI.Tray.exe`) evita entrambe le cose. Farlo fare
  all'installer richiede l'estensione Util di WiX, che è una dipendenza in più per un problema che si
  presenta solo a chi reinstalla.
- **Installato per la prima volta il 29 luglio 2026**, sulla macchina di sviluppo: servizio in
  esecuzione come LocalSystem, cruscotto in esecuzione, e i tre difetti di visibilità qui sopra. Su una
  macchina **pulita** — senza .NET, senza le cartelle di sviluppo, con un altro antivirus — non è
  ancora stato installato, e resta la verifica che conta di più.
- **`cetrai` non finisce nel PATH.** Modificare il PATH di sistema per comodità di uno strumento
  diagnostico non vale il rischio di rompere l'ambiente di qualcun altro.
- Il servizio gira come **LocalSystem** e parte da solo: gli servono WFP, WMI e le interfacce di
  Defender. Viene fermato durante gli aggiornamenti, perché i suoi file non si sostituiscono mentre
  è in esecuzione.

## Alternative scartate

- **WiX v6 o v7.** Da v6 richiedono l'accettazione dell'*Open Source Maintenance Fee*, cioè una quota
  annuale per l'uso commerciale. È una decisione economica, non tecnica, e non è mia: il progetto usa
  **WiX v5**, gratuito anche per uso commerciale. Se un domani si vuole passare a v7, si paga
  consapevolmente.
- **Pubblicazione dipendente dal framework.** Pacchetto molto più piccolo, e un prerequisito da
  installare prima. Il prerequisito è dove si perde l'utente.
- **Installazione per utente, senza privilegi.** Eviterebbe la richiesta di amministratore e
  renderebbe impossibile il servizio di sistema, il blocco di rete e la protezione delle cartelle:
  resterebbe un'estensione del browser con un nome ambizioso.
- **Cancellare tutto alla disinstallazione.** Vedi sopra: sarebbe l'unico modo in cui questo prodotto
  può distruggere i dati che dice di proteggere.
- **Uno script PowerShell al posto del pacchetto.** Funziona per lo sviluppo ed è già lì
  (`tools/install-bridge.ps1`). Non è ciò che si manda a un'azienda, e non compare in "App installate"
  quando qualcuno vuole disinstallarlo — che è la prima cosa che un utente deve poter fare.
