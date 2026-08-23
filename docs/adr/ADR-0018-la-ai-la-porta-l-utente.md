# ADR-0018 — L'AI la porta l'utente

- **Stato:** Accettata — **sostituisce [ADR-0017](ADR-0017-chi-sceglie-il-modello.md)**
- **Data:** 2026-08-17

## Contesto

ADR-0017, di poche ore prima, dava all'utente una tendina fra due modelli nostri. Reggeva su una
premessa che il prodotto non ha più: che l'analisi approfondita la paghiamo noi, con la nostra
chiave, dietro un abbonamento. La decisione di tenere CetrAI **interamente gratuito** finché non ha
utenti toglie quella premessa. Con il backend che paga, ogni persona che preme SCANSIONA è una voce
sulla nostra fattura, e una funzione così si accende solo dietro un abbonamento che ancora non
esiste — cioè non si accende per nessuno.

C'è anche una ragione che non è di cassa: **molte persone hanno già un'AI di fiducia.** Il prodotto
non ha nessun motivo per impedirgliene l'uso, e ne ha uno per permetterlo — chi sceglie dove va il
proprio messaggio sta scegliendo consapevolmente, che è l'opposto di quello che fa un prodotto che
manda i dati dove pare a lui.

Un equivoco da togliere subito, perché è il primo che viene in mente a chiunque: **l'abbonamento alla
chat non serve.** ChatGPT Plus, Claude Pro, Gemini Advanced non danno accesso a un programma. Quello
che un programma può usare è una **chiave API**, che è un conto a consumo separato. La schermata non
può quindi essere «accedi con il tuo account»: è «incolla la tua chiave», e chi ha solo
l'abbonamento alla chat non ha ancora quello che serve. Fingere il contrario vorrebbe dire pilotare
di nascosto un sito web, in violazione delle condizioni di tutti e con una funzione che si rompe alla
prima modifica di quella pagina.

## Decisione

La tendina accanto a SCANSIONA elenca **destinazioni**, non profondità:

| | chi paga | cosa esce dal PC |
|---|---|---|
| **Solo su questo PC** | nessuno | niente |
| **Un modello sul mio PC** (Ollama) | nessuno | niente |
| **Claude, ChatGPT, DeepSeek, Qwen** | l'utente, al suo fornitore | il caso dubbio |
| **Abbonamento CetrAI** | noi | il caso dubbio |

Il predefinito di un'installazione nuova è **Solo su questo PC**: niente esce da un computer finché
qualcuno non dice dove deve andare, e un file di scelta illeggibile o assente vale lo stesso.

### 1. La scelta può solo restringere — la regola di ADR-0017, e sopravvive intera

Nominare una destinazione che non ha una chiave cambia una parola in un file e **non manda niente**.
Non ripiega su un'altra, non fallisce in modo che qualcuno debba occuparsene. Al canale locale parla
qualsiasi processo dell'utente, quindi la domanda non è se la tendina funziona ma qual è il peggio
che ci si fa: far mandare fuori **meno**.

Il difetto vero è stato trovato dal test che conta le chiamate. `Solo su questo PC` è una scelta che
*funziona* — non fallisce mai, quindi sta nell'elenco delle utilizzabili — e la prima versione della
guardia lesse quello come permesso di inviare. Un test sul verdetto sarebbe passato mentre ogni caso
usciva.

### 2. Nessuna richiesta può nominare un indirizzo

Sul filo passa un valore di `AiChoice`. Gli indirizzi stanno in `AiProviders`, una tabella compilata
dentro il prodotto, una riga per valore. Se un chiamante potesse mandare un indirizzo, questa
impostazione sarebbe il modo di far recapitare i messaggi sospetti di qualcun altro a una macchina
scelta da lui.

### 3. La chiave dell'utente non è la nostra chiave

[ADR-0005](ADR-0005-dove-vive-la-chiave-api.md) vietava di spedire *la nostra* chiave: sarebbe stata
una fattura illimitata a nome nostro, fermabile solo tagliando fuori tutti i clienti insieme. La
chiave dell'utente è il suo conto, con il suo tetto, revocabile da lui in un clic. **Il divieto resta
ma cambia oggetto:** il prodotto può usare solo una chiave che la persona ha inserito
dall'interfaccia. Mai una dal pacchetto, mai una da `appsettings.json`, mai una da un argomento della
riga di comando — che finirebbe nell'elenco dei processi e nella cronologia della shell, ed è per
questo che `cetrai scelta` non ha un'opzione per metterla.

Dove finisce, e cosa la protegge davvero: `%ProgramData%\CetrAI\chiavi.dat`, sigillato con DPAPI a
livello macchina — su un altro computer non si apre — e con i permessi ridotti a SYSTEM e agli
amministratori. **A proteggerla è la cartella, non la parola «cifrato»**: quello che il servizio sa
aprire per usarlo, lo sa aprire anche un amministratore di quella macchina. È la stessa struttura del
problema descritta in ADR-0005, e la finestra lo dice a chi sta per incollare la chiave.

La chiave viaggia **solo in entrata**. Nessuna operazione del canale locale ne restituisce una: uno
stato che le contenesse sarebbe un modo di raccoglierle più comodo che cercare il file.

### 4. Due protocolli, non sei

Anthropic ha il suo, già scritto e già provato. OpenAI, DeepSeek, Qwen e un modello sotto Ollama
parlano tutti il protocollo chat di OpenAI: un adattatore solo, quattro righe di tabella.

### 5. Quello che si è rotto misurandolo, e sarebbe uscito rotto

Due difetti, trovati eseguendo contro un Ollama vero su questa macchina.

- **La forma della risposta.** Solo ad Anthropic si consegna uno schema da rispettare. A tutti gli
  altri si chiede «un oggetto JSON», che è una promessa sulla sintassi e non sui nomi. Il primo
  modello locale interrogato ha risposto benissimo, con i campi `giudizio` e `motivazione`: il
  prodotto avrebbe buttato via **ogni singola risposta**. Ora la forma è scritta a parole nel
  messaggio di sistema di quel percorso, e c'è un test che tiene legati i nomi chiesti a quelli letti.
- **Il tempo.** Trenta secondi vanno bene per un fornitore con un data center dietro. Sulla macchina
  di prova, con un modello da quattro giga: **346 secondi a freddo**, mentre i pesi venivano caricati,
  e **137 a caldo**. Con il timeout configurato la voce locale avrebbe fallito sempre, e nel modo in
  cui questo prodotto fallisce apposta — in silenzio, lasciando il verdetto locale, senza dirlo a
  nessuno. La sua pazienza ora è cinque minuti, e la finestra avverte che la prima risposta è lenta.

Ne segue una terza cosa: **la prova che si fa in fase di configurazione deve leggere la risposta**,
non contarla. Una prova ferma a «è arrivato del JSON» avrebbe detto «funziona» proprio al modello che
rispondeva con i nomi sbagliati.

### 6. Il nome del modello locale non lo scriviamo noi

La macchina di prova aveva quindici modelli installati e nessuno si chiamava come il nome che stava
per essere scritto qui. Il nome si chiede a Ollama, saltando quelli che servono a fare embedding e
non saprebbero rispondere; se non ce n'è nessuno, la voce non è utilizzabile e lo dice.

## Conseguenze

- Il prodotto gratuito ha un'analisi approfondita che **funziona davvero**, invece di una spenta in
  attesa di un abbonamento e di un hosting.
- La porta «un indirizzo pubblico dove sta il backend» smette di bloccare questa funzione. Resta
  aperta per l'abbonamento e per l'esperienza condivisa.
- L'attrito si sposta sull'utente: aprire un conto a consumo presso un fornitore. È reale ed è la
  ragione per cui ADR-0005 aveva scartato questa strada. Con il prodotto gratuito il conto è che senza
  di essa l'analisi approfondita non esiste per nessuno, e la voce «un modello sul mio PC» è l'unica
  senza attrito e senza costo.
- **Quanti utenti italiani non tecnici abbiano una chiave API non è misurato**, e la cifra decide se
  questa funzione serve a molti o a pochi. Il prodotto senza AI resta identico, quindi il rischio è
  che la funzione valga poco, non che faccia danno.
- **Non è stata eseguita la catena che parte dal cruscotto:** sostituire il servizio installato con
  quello nuovo richiede una finestra da amministratore. Provati dal vivo il protocollo, il modello
  locale, la forma della risposta e i tempi.

## Alternative scartate

- **Il login con l'abbonamento alla chat.** Non esiste come interfaccia per un programma; farlo
  comunque significa pilotare un sito, contro le condizioni d'uso, con una funzione che si rompe da
  sola.
- **Un campo dove scrivere l'indirizzo del proprio servizio.** Comodo per chi ha un server suo, e
  sarebbe il modo di far recapitare i messaggi di qualcun altro dove si vuole. La tabella compilata
  dentro è il rifiuto.
- **Tenere la chiave con DPAPI dell'utente.** Più stretto, e inutilizzabile: il servizio gira come
  LocalSystem e non potrebbe aprirla, e il servizio è ciò che fa la chiamata.
- **Fidarsi di `response_format: json_object`.** Misurato e falso: garantisce la sintassi, non i nomi.
