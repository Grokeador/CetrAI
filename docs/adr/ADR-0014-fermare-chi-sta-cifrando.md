# ADR-0014 — Fermare chi sta cifrando, senza un driver

- **Stato:** Accettata
- **Data:** 2026-07-28

## Contesto

La protezione ransomware riconosceva l'attacco, scriveva un avviso e indicava da quale copia
recuperare. Tutto vero, e tutto **dopo**: mentre l'utente legge, la cifratura continua. Un
rilevamento che non ferma niente è metà prodotto, e la metà meno utile.

Il [modello di minaccia](../modello-di-minaccia.md) diceva perché non era stato fatto: *«non sappiamo
quale programma sta cifrando»*. In modalità utente Windows dice che un file è cambiato, non chi
l'ha cambiato. Per saperlo servono una sessione ETW sul kernel o un minifiltro, e un minifiltro
richiede un driver firmato WHQL: fuori portata oggi.

## Decisione

### 1. Lo chiediamo al Restart Manager — ma sui file sbagliati non funziona

C'è una terza strada che non richiede alcun driver: il **Restart Manager**, il servizio che gli
installatori usano per chiedere *«quale programma devo chiudere prima di poter sostituire questo
file?»*. Risponde con i processi che hanno il file aperto in quel momento. È un'API documentata,
stabile, presente su ogni Windows, e non chiede privilegi speciali.

La prima versione chiedeva dei **file appena cambiati**. Non ha mai identificato nessuno. Il motivo
si è visto solo inscenando un attacco vero, e vale più di tutto il resto di questo documento:

> Windows dice che un file è cambiato **dopo** che chi l'ha cambiato l'ha chiuso. Ogni file di cui
> veniamo informati è, per costruzione, un file che nessuno tiene più aperto.

Quindi chiediamo dei file che **non** sono ancora cambiati: gli altri documenti nelle cartelle che
stanno venendo attraversate. Quelli sono i prossimi bersagli, e uno di loro è aperto **adesso**. Con
questo cambio, l'attacco inscenato è stato attribuito al processo giusto in un secondo.

**Cosa resta fuori:** vediamo un processo solo mentre tiene un file aperto. Qualcosa di abbastanza
veloce, o che proceda in un ordine che non campioniamo, ci sfugge. La risposta è un indizio forte,
non una prova.

### 2. Congelare, mai uccidere

Uccidere il programma che sta cifrando distrugge la sua memoria, e la sua memoria contiene la chiave
di cifratura — a volte l'unica copia rimasta al mondo. Un processo congelato smette di scrivere
immediatamente, **si porta dietro la chiave**, e si rimette in moto con un comando se abbiamo
sbagliato bersaglio.

Fra un'azione irreversibile e una reversibile, un prodotto che gira come LocalSystem sul computer di
qualcun altro prende quella reversibile.

Il congelamento sospende i thread uno per uno: Windows non ha una chiamata documentata che sospenda
un processo. Ce n'è una non documentata; un prodotto di sicurezza non è il posto dove dipendere da
quella. Il giro si ripete finché compaiono thread nuovi, perché un programma che sta per essere
congelato può ancora avviarne.

### 3. Ogni regola è un rifiuto

La decisione è una funzione pura, come [ADR-0013](ADR-0013-come-si-aggiorna-il-prodotto.md), e per lo
stesso motivo: è la cosa più pericolosa che il prodotto sa fare. Congelare la cosa sbagliata blocca
il computer.

- **Solo se è un attacco.** «Attività insolita» non è un'accusa: un programma di backup che legge
  tutta la cartella personale ci arriva un martedì qualunque.
- **Mai un programma di Windows**, riconosciuto da dove sta (la cartella di Windows, la nostra, quella
  di Defender) e in più per nome, nel caso uno di quei nomi giri da un'altra parte.
- **Tranne gli interpreti di script.** `powershell.exe`, `wscript.exe`, `cscript.exe`, `mshta.exe`
  stanno dentro Windows, ma il motivo per cui non si tocca quella cartella — «bloccherebbe la
  macchina» — non vale per una singola istanza di un interprete. E moltissimo ransomware arriva come
  script proprio perché tutti si fidano dell'interprete. Anche questo l'ha trovato l'attacco
  inscenato: il colpevole veniva nominato correttamente e poi lasciato in pace, perché era
  `powershell.exe`. L'eccezione toglie la regola sulla cartella, **mai** quella sui nomi vietati.
- **Mai noi stessi.** Una protezione che può congelare il proprio servizio si può spegnere facendo
  scattare un falso allarme.
- **Mai un processo di cui non vediamo il file eseguibile.** Se non riusciamo ad aprirlo è un
  processo protetto, e un processo protetto è Windows, non un ransomware.
- **Mai se ce n'è più di uno.** Due programmi che scrivono sugli stessi file possono essere l'attacco
  *più* lo strumento con cui l'utente stava lavorando. Indovinare significa una probabilità su due di
  congelare il lavoro dell'utente. Si nominano entrambi e decide lui.
- **Numero di processo e ora di avvio insieme.** I numeri vengono riusati: fra il momento in cui
  decidiamo di congelare e quello in cui lo facciamo, l'originale può finire e il numero passare a
  qualcos'altro. Controllare solo il numero è il modo in cui un prodotto congela il programma
  sbagliato.

### 4. La via d'uscita esiste prima dell'azione

`cetrai resume --pid <numero>` funziona **senza il servizio, senza privilegi di amministratore**, e il
numero è scritto nell'avviso stesso. Se anche quello fallisse, nessun congelamento sopravvive a un
riavvio — e l'avviso lo dice.

## Quello che abbiamo provato e buttato via

Quando il Restart Manager non trovava nessuno, la strada ovvia era misurare **quanto scrive** ogni
processo: ogni programma tiene il totale dei byte scritti, si campiona due volte a mezzo secondo di
distanza e si guarda chi scrive di più. La regola era prudente: agire solo su chi scriveva almeno
quattro volte più di chiunque altro, e almeno un megabyte.

**Alla prima prova ha congelato Chrome.** In sei decimi di secondo il browser aveva scaricato più
byte di quanti il finto ransomware ne scrivesse cifrando file da due kilobyte. È stato ripreso subito
e non era in esecuzione attiva, ma il punto resta.

La lezione non è che la soglia fosse tarata male. È che **il volume di byte non è un segnale di
ransomware**: cifrare un documento scrive quanto il documento, cioè pochissimo, mentre un browser,
un aggiornamento o una compilazione scrivono molto di più senza toccare niente di importante. Il
segnale del ransomware è *quanti file diversi* e *dove*, non quanti byte. Il codice è stato rimosso,
non messo a punto.

Vale la pena averlo scritto: un'euristica che agisce e che non è mai stata provata contro un attacco
è un difetto che aspetta. Questa ci ha messo un secondo a manifestarsi, in una prova, invece che sul
computer di un cliente.

## Conseguenze

- **Provato dall'inizio alla fine, su un attacco inscenato.** Un finto ransomware ha riscritto 120
  file veri in tre cartelle, tenendo ogni file aperto un quarto di secondo. Il servizio ha
  riconosciuto l'attacco, **identificato il processo giusto**, e lo ha **congelato al quinto file**.
  Sei secondi dopo era ancora a cinque. `cetrai resume --pid` l'ha rimesso in moto, ed è ripartito
  fino a venti — nei due sensi, non solo in uno.
- **Provato, eseguendo, nei singoli pezzi:** Windows nomina davvero il processo che tiene aperto un
  file (l'interoperabilità con strutture native è dove questa funzione può essere silenziosamente
  sbagliata: una struttura descritta con un campo in meno restituisce spazzatura, non un errore). E
  un processo vero, messo a scrivere in ciclo, smette quando lo congeliamo. Il test verifica prima
  che stesse scrivendo davvero: un processo morto scrive poco quanto uno congelato, e farebbe
  passare la prova per il motivo sbagliato.
- **Provato, senza macchina:** 20 test sulle regole. Quattro descrivono i casi in cui si agisce, gli
  altri i motivi per cui non si agisce.
- **Non provato:** contro un ransomware vero. Non ne abbiamo uno e non è il genere di cosa che si
  procura per fare una prova. Il finto ransomware si comporta come si comporta perché l'abbiamo
  scritto noi: tiene i file aperti un quarto di secondo e procede in ordine alfabetico. Quanta parte
  delle famiglie reali faccia lo stesso, non lo sappiamo.
- **Il costo del falso positivo** è passato da «un avviso di troppo» a «un programma congelato». Le
  regole sopra sono scritte per pagarlo il meno possibile, e `StopSuspect: false` lo azzera lasciando
  il nome.
