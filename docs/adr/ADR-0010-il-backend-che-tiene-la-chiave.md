# ADR-0010 — Il backend che tiene la chiave

- **Stato:** Accettata
- **Data:** 2026-07-28

## Contesto

[ADR-0005](ADR-0005-dove-vive-la-chiave-api.md) ha deciso che la chiave API non sta sul PC del
cliente: il servizio parla con il backend CetrAI, e il backend parla con il fornitore. Il lato
client di quell'accordo esiste da allora — `BackendCloudTransport`, il token di licenza in
configurazione, la regola che una build di rilascio rifiuta la chiamata diretta.

Mancava l'altra metà, e la mancanza aveva una conseguenza precisa che nessuno aveva detto a voce
alta: **il pacchetto costruito in [ADR-0009](ADR-0009-come-si-installa.md) distribuisce una funzione
a pagamento che non può funzionare.** È una build di rilascio, quindi rifiuta la chiamata diretta;
il trasporto configurato è `Backend`; il backend non esisteva. L'analisi approfondita, provata dal
vivo il 27/07/2026, era irraggiungibile per chiunque avesse installato il prodotto.

## Decisione

Esiste `backend/CetrAI.Backend`: applicazione web .NET 9, un solo endpoint che conta.

```
POST /v1/analisi-approfondita     Authorization: Bearer <token di licenza>
```

Non è un progetto Windows: il prodotto si installa su Windows, il backend deve poter stare su una
macchina Linux in Unione Europea.

### 1. Il token è casuale, e ne conserviamo solo l'impronta

Trentadue byte casuali con un prefisso riconoscibile (`aidef_`). Sul disco finisce lo SHA-256, mai
il token. Una copia rubata dell'archivio dice *quali* licenze esistono, non *come* usarle: lo stesso
motivo per cui nessuno conserva le password in chiaro, applicato alla nostra copia di riserva.

La ricerca avviene per impronta. Un test verifica che il file salvato non contenga il token — se
quel test si rompe, la nostra copia di riserva è diventata una via d'ingresso nel prodotto.

### 2. Due limiti diversi, perché fermano due cose diverse

- **La quota** (giornaliera e mensile, per licenza) conta le analisi *consegnate*. È ciò che il
  cliente ha comprato. Il tetto giornaliero non è una seconda versione di quello mensile: impedisce
  che una giornata storta — un ciclo, una macchina compromessa — spenda tutto il mese prima che
  qualcuno se ne accorga.
- **Il limite di frequenza** conta i *tentativi*, dieci al minuto per licenza. È ciò che protegge la
  nostra fattura dal fornitore, qualunque cosa risulti dalle risposte.

Tenerli separati è ciò che permette di essere generosi sui rimborsi senza aprire una falla.

### 3. Chi paga quando la chiamata non produce niente

- Risposta ottenuta → **spesa**.
- Il fornitore declina → **spesa**: quella chiamata è stata fatta e ci è stata addebitata.
- Il fornitore è irraggiungibile → **rimborsata**: il cliente non ha avuto niente, e far pagare un
  nostro guasto è far pagare il nulla.

Il caso impreciso è il timeout, contato come guasto anche se potrebbe esserci stato addebitato. È il
limite di frequenza a impedire che qualcuno ne faccia un mestiere.

Prenotazione e conteggio avvengono insieme, sotto lo stesso lock: due richieste nello stesso istante
non devono vedere entrambe l'ultima analisi disponibile.

### 4. La revoca vale subito — difetto trovato eseguendo, non leggendo

Il comando che revoca una licenza gira in una **console**, cioè in un processo diverso da quello che
risponde alle richieste. La prima versione leggeva l'archivio una volta all'avvio: revocata la
licenza, il backend ha continuato a servirla.

È esattamente il momento per cui la revoca esiste — una licenza di cui si sta abusando *adesso*, non
al prossimo rilascio. Ora l'archivio ricontrolla la data di modifica del file a ogni ricerca e
rilegge quando è cambiata. Costo: una `stat` per richiesta. Provato dal vivo: prima della revoca il
verdetto approfondito arriva, subito dopo il backend risponde 401 e sul PC resta il verdetto locale.

### 5. Il backend si rifiuta di partire in tre casi

Rifiuti, non avvisi: un avviso è una cosa che un rilascio delle undici di sera supera senza vederla.

- **Manca la chiave.** Letta da `ANTHROPIC_API_KEY` nell'ambiente e da nessun'altra parte: non da
  `appsettings.json`, che viene copiato e committato per sbaglio, e non da un argomento della riga
  di comando, che finisce nell'elenco dei processi. Un backend che parte senza chiave risponde
  errore a ogni cliente, in silenzio, alle tre di notte.
- **Ascolta in chiaro fuori da questa macchina.** Il token di licenza viaggia
  nell'intestazione `Authorization`: su un indirizzo pubblico senza HTTPS è una licenza regalata a
  chiunque stia sul percorso, e il cliente non lo saprebbe mai. Su `localhost` non c'è percorso, ed
  è per questo che lo sviluppo non ha bisogno di un certificato.
- **Modello finto in una build di rilascio.** È lo specchio della regola del client: là una build di
  rilascio rifiuta la chiave locale, qui rifiuta una risposta che non viene da un modello.

### 6. Le licenze si emettono dalla console, non da un endpoint

Un endpoint che emette licenze è una fabbrica di licenze, e proteggerlo bene vorrebbe dire costruire
un secondo sistema di autenticazione per difendere il primo. Finché non ci sono account e pagamenti,
chi può aprire una shell su quella macchina è esattamente l'insieme di chi può emettere licenze.

Il token si vede una volta sola, al momento dell'emissione. Perderlo costa una licenza nuova, che è
poco; conservarlo costerebbe il prodotto.

### 7. Il caso non finisce mai nel registro

È l'unica cosa che un cliente ci ha mandato in confidenza — un messaggio della sua posta, un
indirizzo che ha visitato — e una riga di registro è il modo più semplice perché finisca dove nessuno
voleva metterla. Nel registro vanno la licenza, l'esito, la durata e il consumo.

### 8. Archivio su file, dietro un'interfaccia

Licenze e consumi stanno in due file JSON riscritti per intero, con scrittura su file temporaneo e
spostamento atomico. È onesto per un server e sbagliato per due. Quando saranno due, queste due
classi diventano due tabelle e sopra non cambia niente: è il motivo per cui stanno dietro
`ILicenceStore` e `IUsageLedger` invece che dentro l'endpoint.

## Conseguenze

**Ora funziona:** il client di rilascio ha finalmente qualcosa con cui parlare. Catena provata
end-to-end in locale — `cetrai` → servizio → backend → risposta → verdetto sostituito — con licenza
verificata, quota consumata e revoca che ha effetto immediato.

**Non c'è ancora:**

- **account e pagamenti.** Le licenze si emettono a mano. È sufficiente per una dimostrazione e per
  i primi clienti, non per vendere.
- **un posto dove gira.** Nessun hosting, nessun certificato, nessun dominio. La regola del punto 5
  garantisce che il primo tentativo di esporlo in chiaro fallisca invece di riuscire in silenzio.
- **più di un'istanza.** File riscritti per intero e lock in processo: due copie in esecuzione si
  sovrascriverebbero a vicenda.
- **la prova con il modello vero attraverso il backend.** La catena è stata percorsa con il modello
  finto; la chiamata al fornitore è la stessa già provata dal vivo dal client il 27/07/2026, ma
  «già provata altrove» non è «provata qui».
