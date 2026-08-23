# ADR-0006 — Osservare prima di bloccare le cartelle personali

- **Stato:** Accettata
- **Data:** 2026-07-27

## Contesto

Windows ha già una difesa contro il ransomware: **Controlled Folder Access**. Impedisce ai programmi
non autorizzati di scrivere in Documenti, Immagini, Desktop. È presente su ogni Windows 10 e 11, non
costa nulla, e su quasi tutti i PC italiani è **spenta**.

Il motivo per cui è spenta è il problema, non un dettaglio. Accesa di colpo, ferma qualunque
programma non presente nella lista di Microsoft: il gioco non salva più la partita, il programma di
backup non fa più il backup, il vecchio editor di foto non salva più il lavoro. L'utente non conclude
che Windows è severo. Conclude che il programma di sicurezza che ha appena installato gli ha rotto il
computer, e lo disinstalla — portandosi via anche la protezione anti-truffa che funzionava.

`cetrai status` lo rileva già oggi su questa macchina: cartelle personali non protette. Sapere che va
accesa è la parte facile; accenderla senza fare danni è la parte che vale.

## Decisione

Non si passa mai direttamente al blocco. Il percorso ha tre passi e uno di attesa:

```
spenta ──> osservazione ──(7 giorni)──> proposta di autorizzazioni ──> blocco
```

1. **Osservazione.** Si attiva la modalità *audit* di Windows: non blocca niente e registra ciò che
   avrebbe bloccato. Rischio per l'utente: zero.
2. **Attesa di sette giorni.** Non uno: il software legittimo ha ritmi settimanali — il backup della
   domenica notte, l'importazione delle foto dopo il fine settimana, il gestionale a fine mese. Un
   giorno di osservazione fotografa un martedì qualsiasi e manca tutto il resto.
3. **Proposta.** Windows registra gli eventi 1123 e 1124 nel proprio registro, dove non guarda
   nessuno. Li leggiamo, li raggruppiamo per programma e li trasformiamo in una lista corta di
   autorizzazioni da confermare. **Questo è il grosso del valore della funzione**: dire all'utente
   "attiva questa impostazione" lo sanno fare tutti, dirgli quali sei programmi autorizzare prima di
   attivarla no.
4. **Blocco**, solo dopo la conferma.

Due regole dentro la proposta:

- **I programmi che partono da cartelle temporanee non vengono mai consigliati.** `AppData\Local\Temp`,
  `Downloads`, `Windows\Temp`, la cartella Esecuzione automatica: un programma che vive lì e scrive
  nelle cartelle personali ha esattamente la forma dell'attacco da cui stiamo difendendo. Restano
  visibili, marcati, e l'utente può autorizzarli a mano da Windows: non mettiamo noi la firma sul
  consiglio.
- **Le autorizzazioni si aggiungono, non si riscrivono.** Un permesso dato dall'utente tramite
  Windows non viene rimosso in silenzio da noi.

La regola sta in `FolderShieldPolicy`, funzione pura in `CetrAI.Core`, separata dal codice che
tocca la macchina. È la stessa asimmetria del resto del prodotto: la regola che evita di rompere il
computer dell'utente dev'essere verificabile senza un computer da rompere.

## Conseguenze

- Dall'installazione alla protezione attiva passa **una settimana**. È un costo reale e accettato:
  una settimana in meno di protezione vale meno della fiducia persa rompendo un programma.
- L'attesa va misurata da qualche parte, e Windows non registra *quando* l'osservazione è iniziata:
  serve un segnaposto nostro (`FolderShieldJournal`). Se manca, il conteggio riparte da zero e la
  politica aspetta invece di agire — il verso giusto in cui sbagliare.
- La protezione da manomissioni di Windows può rifiutare la modifica: in quel caso lo diciamo e
  indichiamo Sicurezza di Windows, invece di fallire in silenzio.
- Serve l'amministratore. Il servizio ce l'ha; `cetrai harden` da console va lanciato elevato.
- `cetrai harden` senza `--apply` si limita a dire cosa farebbe. Un comando che cambia
  un'impostazione di sicurezza di Windows non deve essere anche quello che si esegue per sbaglio.

## Alternative scartate

- **Attivare il blocco all'installazione.** La strada più diretta al disinstalla. È esattamente il
  motivo per cui Microsoft la lascia spenta.
- **Non toccare Controlled Folder Access e scrivere una protezione nostra.** Richiederebbe un
  minifiltro di file system firmato WHQL — fuori portata oggi — e duplicherebbe peggio una difesa
  che l'utente ha già pagato con la licenza di Windows.
- **Osservare un giorno invece di sette.** Più rapido e sbagliato: mancherebbe tutto il software con
  cadenza settimanale, cioè proprio i backup, che sono i programmi che scrivono di più nelle cartelle
  personali.
- **Autorizzare automaticamente tutto ciò che l'osservazione ha visto.** Comodo, e sufficiente a
  autorizzare il ransomware se l'infezione è già in corso durante la settimana di osservazione.
