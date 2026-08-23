# ADR-0008 — Copie che sopravvivono all'attacco

- **Stato:** Accettata
- **Data:** 2026-07-27

## Contesto

[ADR-0007](ADR-0007-rilevamento-comportamentale.md) riconosce un attacco in corso, ma dichiara anche
il proprio limite: in user mode non sappiamo quale processo stia cifrando, quindi non lo fermiamo.
Riconoscere senza poter rimediare è metà del lavoro — e la metà meno utile, perché arriva quando il
danno è già cominciato.

Serve poter riportare indietro i file. È anche la funzione su cui si regge il **Premium**: il
rilevamento e il blocco restano gratuiti, il ripristino si paga.

Il problema non è copiare. È che la copia sopravviva:

- **Le copie shadow di Windows non bastano.** `vssadmin delete shadows` è di norma la prima cosa che
  un ransomware esegue, e su molti PC consumer la Protezione sistema è comunque disattivata.
- **Una cartella qualsiasi non basta.** Un ransomware che gira come l'utente trova e cifra anche la
  cartella delle copie. Una copia raggiungibile dall'attaccante non è una copia.
- **Copiare tutto non basta e anzi nuoce.** Le cartelle personali vere contengono progetti video,
  dischi di macchine virtuali e installazioni di giochi: un backup che riempie il disco è un backup
  che l'utente cancella.

## Decisione

### Cosa si copia

Solo ciò che non si può riscaricare: documenti, fogli di calcolo, fotografie, PEC e allegati firmati,
chiavi e certificati. Con un tetto di 64 MB per file e l'esclusione di `AppData`, `node_modules`,
cestino e cartelle di sistema. Un film si riscarica; la tesi no.

### Come si conserva

Archivio **indirizzato per contenuto**: il file è salvato sotto l'hash del proprio contenuto. Cinquanta
copie di un documento che nessuno ha toccato costano una copia, non cinquanta. È ciò che rende
sostenibili settimane di storico su una macchina consumer, e rende l'archivio incrementale senza
nessuna della contabilità che di solito quella parola comporta.

### Come si difende

**I permessi, non la posizione.** La cartella riceve un elenco esplicito — **solo** SYSTEM e
Administrators, in scrittura e in lettura — con l'ereditarietà disattivata, così niente a monte può
allentarla.

> **Modifica del 28/07/2026.** Prima gli altri utenti potevano leggere, e andava bene finché
> l'archivio conteneva i file di una persona sola. Da [ADR-0011](ADR-0011-di-chi-sono-i-file-che-proteggiamo.md)
> contiene le copie delle cartelle personali di **tutti**: lasciarlo leggibile avrebbe dato a ogni
> account della macchina una copia dei documenti degli altri. Nessuno ha bisogno di leggerlo
> direttamente — ripristina il servizio, che sa di chi sono i file
> ([ADR-0012](ADR-0012-chi-puo-chiedere-cosa-al-canale-locale.md)).
>
> I permessi li applica ora **il servizio a ogni avvio**, non un comando da riga di comando che
> qualcuno deve ricordarsi: era l'unico modo in cui venivano applicati, e una difesa che dipende da
> un gesto manuale è una difesa che sulla macchina di un cliente non c'è.

La sottigliezza che lo rende efficace anche sul PC di casa, dove l'utente *è* amministratore: un
programma avviato normalmente gira con un token filtrato in cui il gruppo Administrators è
*deny-only*. Non può scrivere lì dentro senza un consenso che l'utente vedrebbe.

**Detto chiaramente: ferma il ransomware che gira come l'utente, cioè quasi tutto. Non ferma un
ransomware che ha già ottenuto i privilegi di amministratore, e sulla stessa macchina non lo
fermerebbe niente.**

### Quando si butta via

Lo spazio si recupera **dal mezzo**, mai dalle estremità. Durante un attacco le copie più recenti
sono quelle che contengono i file già cifrati: buttare dalla parte recente distruggerebbe proprio ciò
che serve al ripristino. La più vecchia è l'ultima fotografia completa di prima che succedesse
qualcosa, e le tre più recenti sono ciò che un ripristino cerca per prime. Tutto quello che sta in
mezzo è sacrificabile.

### Come si ripristina

`cetrai restore` senza `--apply` dice soltanto quali file toccherebbe. Si riscrivono solo i file
diversi dalla copia, quindi un ripristino eseguito due volte non fa niente la seconda volta e un
ripristino interrotto a metà si rilancia e basta.

## Conseguenze

- Verificato end-to-end da riga di comando: tre documenti copiati, riscritti con byte casuali,
  ripristinati identici. Un archivio da cui non si è mai ripristinato è una speranza, non una
  funzione.
- **Prendere le copie richiede privilegi elevati** una volta protetta la cartella: è il prezzo
  diretto della difesa. In esercizio le prende il servizio, che gira come SYSTEM; da console serve un
  terminale amministratore.
- Le copie non sono cifrate. Chi ha già i privilegi per leggerle ha già i privilegi per leggere gli
  originali, quindi cifrarle sposterebbe solo il problema su dove tenere la chiave.
- 5 GB di spazio predefinito. Su una macchina con pochi documenti copre mesi, su una molto piena
  copre giorni: il numero va reso configurabile e mostrato nel cruscotto.
### Prima la fretta, poi il gelo

Il servizio unisce le due metà, e la giunzione porta una regola che vale più del resto del codice.

**Appena l'attività è insolita, si copia subito** — un passo prima della certezza i file sono
probabilmente ancora quelli giusti, e una copia presa lì vale più di qualunque copia a calendario.

**Appena è un attacco, l'archivio si congela**: niente copie, niente eliminazioni. L'istinto sarebbe
il contrario — fare subito un backup di tutto — ed è esattamente sbagliato: la copia salverebbe la
versione già cifrata, e per farle spazio l'eliminazione butterebbe fuori quelle buone. *Un sistema di
copie che continua a lavorare durante un attacco sovrascrive il salvataggio con il disastro.*

Le due metà sono la stessa idea vista dai due lati dell'istante in cui diventa certo.

Verificato con il servizio in esecuzione su cartelle usa e getta: 60 documenti riscritti, allarme,
congelamento al primo controllo successivo, una sola copia rimasta in archivio — quella di prima
dell'attacco — e nel registro il comando esatto per ripristinarla.

### Quanto dura una copia, e cosa costa scoprirlo tardi

La regola era giusta e l'impianto sotto non la rispettava. Al primo avvio su una macchina vera:

| Ora | Cosa risulta dal registro |
|---|---|
| 17:56 | parte la copia periodica di avvio |
| 17:57 | il sorvegliante vede attività insolita e **chiede la copia che conta** |
| 18:05 | finisce la copia periodica: 359 file, 99 MB, **dieci minuti** |

La copia urgente delle 17:57 non è mai stata presa. Il servizio ammetteva **una copia alla volta**, e
chi trovava occupato tornava indietro **senza scrivere niente nel registro**: una copia di routine
aveva bloccato una copia urgente, in silenzio. Il difetto non stava nella regola — che i test
verificavano — ma nel meccanismo che avrebbe dovuto eseguirla, e si è visto solo mettendo in fila gli
orari di un'esecuzione reale.

Adesso la richiesta viene **tenuta e ripresa** appena la copia in corso finisce
(`SnapshotTurn`), ed è **rigiudicata** al suo turno: se nel frattempo è diventato un attacco non
viene presa, l'archivio si congela. Ricordare la richiesta non deve diventare un modo per aggirare la
regola del gelo. Rimandare e riprendere finiscono entrambi nel registro: uno scarto silenzioso è ciò
che ha reso questo difetto invisibile per un mese.

**Il numero nuovo è la durata di una copia**, e il servizio adesso la scrive ogni volta. Dieci minuti
la prima, cinque secondi le successive — deduplicazione per contenuto: la seconda copia di 359 file
ha aggiunto 0 MB. È anche l'ampiezza della finestra in cui una copia urgente può restare in attesa,
quindi è un numero da tenere d'occhio, non un dettaglio da registro.

## Alternative scartate

- **Copie shadow di Windows (VSS).** Cancellarle è la prima mossa di quasi ogni ransomware, e su
  molti PC consumer sono comunque spente. Difendersi con lo strumento che l'attaccante disattiva per
  primo non è difendersi.
- **Copie in cloud.** Risolverebbe la sopravvivenza e introdurrebbe un problema peggiore: i documenti
  personali dell'utente su un nostro server, con tutto ciò che comporta in responsabilità e in
  costi. In contraddizione con "dal PC esce solo l'ambiguo" ([ADR-0004](ADR-0004-analisi-approfondita-premium.md)).
- **Cifrare la cartella delle copie.** La chiave dovrebbe essere leggibile dal servizio, quindi da
  chiunque abbia quella macchina con i privilegi giusti: stessa struttura del problema di
  [ADR-0005](ADR-0005-dove-vive-la-chiave-api.md), stessa conclusione.
- **Copiare tutto.** Semplice e sbagliato: riempie il disco e si fa disinstallare.
- **Copia su modifica, prima della scrittura.** Sarebbe la protezione ideale — nessuna finestra
  scoperta — e richiede un minifiltro di file system con driver firmato WHQL, fuori portata oggi.
