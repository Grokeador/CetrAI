# ADR-0017 — Chi sceglie il modello, e cosa quella scelta non può fare

- **Stato:** **Sostituita da [ADR-0018](ADR-0018-la-ai-la-porta-l-utente.md)** lo stesso giorno
- **Data:** 2026-08-17

> Questa decisione dava all'utente una tendina fra due modelli **nostri**, pagati da noi dietro un
> abbonamento. La decisione di tenere il prodotto interamente gratuito ha tolto quella premessa: con
> il backend che paga, l'analisi approfondita si accende solo dietro un abbonamento che non esiste,
> cioè per nessuno. ADR-0018 la sostituisce con destinazioni che l'utente porta.
>
> **Quello che è sopravvissuto intero**, e vale la pena rileggere qui: la scelta può solo restringere,
> il client non nomina mai un modello, e una capacità pericolosa sul canale locale si toglie col tipo.

## Contesto

Chi apre il cruscotto non ha modo di sapere che esiste un'analisi approfondita, né di dire «questo
caso resta qui». Il modello è scritto in tre file di configurazione, e l'unico interruttore è
`CloudAnalysis:Enabled`, che un utente non vede e non tocca.

La richiesta era di poter scegliere «la AI» accanto al pulsante SCANSIONA. Detta così sembra la cosa
che [ADR-0005](ADR-0005-dove-vive-la-chiave-api.md) ha già scartato — chiedere al cliente la propria
chiave — e non lo è: quella alternativa spostava sull'utente il problema di procurarsi un account
presso un fornitore. Qui l'utente non procura niente. Sceglie fra comportamenti che il prodotto sa
già servire, e nel farlo scopre che qualcosa poteva uscire dal suo computer.

## Decisione

Una tendina accanto al pulsante, con tre voci: **solo su questo PC**, **Claude veloce**, **Claude
approfondita**. La scelta si ricorda in `%ProgramData%\CetrAI\scelta-analisi.txt` e vale per tutti e
due i percorsi che chiedono un parere profondo — l'analisi manuale e la scansione.

Quattro vincoli, che contano più della tendina.

### 1. La scelta può solo restringere

`Solo su questo PC` spegne l'uscita. Le altre due non accendono niente che il piano e la
configurazione non abbiano già acceso: su Free, dove `Feature.CloudDeepAnalysis` è spenta, scegliere
«approfondita» cambia una parola in un file e **non manda fuori un byte**.

Non è una raffinatezza. Al canale locale può parlare qualsiasi processo che gira come l'utente
([ADR-0012](ADR-0012-chi-puo-chiedere-cosa-al-canale-locale.md)), quindi la domanda giusta non è «la
tendina funziona» ma «qual è il peggio che ci si fa». La risposta deve essere: far mandare fuori
**meno**. È questo che rende sicuro metterla su quel canale, e c'è un test che la sorveglia dal lato
che conta — il piano Free con la voce cara selezionata, e l'analista mai chiamato.

### 2. Il client non nomina mai un modello

Sul filo passa un valore di `DeepChoice`, tre valori e basta — stesso ragionamento di `SocialSite`.
Un campo stringa sarebbe un chiamante che decide su cosa ci arriva la fattura. Il nome del modello
sta dove sta la chiave: `Backend:Analysis:Model` e `FastModel` sul backend, e con il trasporto
`Direct` in sviluppo nelle opzioni locali.

Il backend traduce: **solo la parola `Fast` compra qualcosa di diverso**, e tutto il resto — una copia
installata prima che la tendina esistesse e che quel campo non lo manda, un refuso, una licenza
rubata che prova a nominare il modello più caro — vale l'approfondita che quella licenza già paga.
Mai qualcosa di più caro, mai il nulla.

### 3. Due serrature sulla stessa promessa

Il servizio ferma il caso prima di chiamare l'analista, e l'analista lo ferma di nuovo. La ripetizione
è voluta: `CloudAnalyst` è la classe che possiede la regola su cosa può lasciare il PC, e una promessa
mantenuta in un punto solo è una promessa che il terzo chiamante può dimenticare di mantenere.
`CloudAnalysisOutcome.KeptHere` è un esito a sé e non `Disabled`, per la stessa ragione per cui
`RefusedByService` è separato: «nessuno ha chiesto che uscisse» e «la funzione è spenta» sono due
fatti diversi, e il riepilogo dice all'utente quanti dei suoi indirizzi sono usciti.

### 4. Il pulsante funziona senza che la tendina venga toccata

La regola di prodotto dice che l'utente non deve fare niente, e che ogni domanda va giustificata. Una
tendina accanto al pulsante principale è una domanda posta a tutti, per sempre; regge solo perché il
predefinito è quello che il prodotto faceva prima — e resta quello anche su una macchina dove il file
non c'è, o è illeggibile. Chi non la apre mai non perde niente.

## Conseguenze

- Chi installa il prodotto scopre, guardando una tendina, che esiste una fascia di casi che può
  uscire dal suo computer, e ha un modo di dire di no che non richiede di trovare un file di
  configurazione.
- La voce «veloce» è **misurata a metà**: la catena è provata, il confronto di qualità con
  l'approfondita sulla fascia ambigua non è stato fatto e richiede una chiave. Finché non c'è quel
  numero, la voce lo dice di sé stessa nel suggerimento che compare passandoci sopra. Un peggioramento
  non misurato, a schermo, è indistinguibile da una buona risposta.
- La `ComboBox` è il primo selettore del prodotto e ha richiesto un modello completo: quella di serie
  arriva con il proprio aspetto chiaro, come la barra di scorrimento prima di lei.
- Provato dal vivo il 17/08/2026 contro il backend su questa macchina: `Fast` sul filo arriva `Fast`
  nel registro del backend, l'assenza del campo arriva `Thorough`, e `Profondita: "claude-opus-5"` —
  cioè un client che prova a nominare un modello — arriva `Thorough`. **Non** è stata eseguita la
  metà che parte dal cruscotto: fermare il servizio installato per mettere al suo posto quello nuovo
  richiede una finestra da amministratore.

## Alternative scartate

- **Scegliere il fornitore (Claude, OpenAI, Gemini).** Sul PC del cliente non cambierebbe niente —
  viaggerebbe comunque una preferenza — ma ogni fornitore vuole un adattatore suo, uno schema di
  risposta vincolato in modo diverso e un account nostro. Costa molto e non risolve niente che le tre
  voci non risolvano già.
- **La chiave dell'utente.** Scartata da ADR-0005 e non riaperta: chi compra un antitruffa per non
  doverci pensare non apre un account presso un fornitore di modelli.
- **Nascondere le voci a pagamento su Free.** Lascerebbe un menu di una voce sola, che non dice niente
  di cosa fa la metà a pagamento. Mostrarle attive sarebbe un controllo che non fa quello che dice.
  Spente, con il motivo addosso, sono l'unica delle tre forme vera.
- **Una scelta per singola scansione, invece che una preferenza.** Sarebbe una domanda a ogni pressione
  del pulsante, cioè esattamente ciò che la regola di prodotto vieta.
