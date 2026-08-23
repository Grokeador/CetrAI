# ADR-0005 — Dove vive la chiave API

- **Stato:** Accettata
- **Data:** 2026-07-27

## Contesto

[ADR-0004](ADR-0004-analisi-approfondita-premium.md) ha scartato la chiave incorporata nel prodotto
in una riga. La riga è giusta, ma non basta: finché l'unico modo di far funzionare l'analisi
approfondita è una chiave letta sulla macchina che esegue il servizio, quella riga descrive
un'intenzione, non un vincolo. Un'intenzione si dimentica al momento di impacchettare l'installer.

Il problema è concreto e ha una scadenza: appena il prodotto viene installato su un secondo computer,
la chiave è su un computer che non controlliamo.

**Non serve cifrarla meglio.** Qualunque forma di protezione locale — variabile d'ambiente, DPAPI,
file cifrato, offuscamento nel binario — deve essere reversibile dal servizio stesso, altrimenti il
servizio non può usarla. Ciò che il servizio sa decifrare per usare, lo sa decifrare anche chi ha
quella macchina. Non è un problema di implementazione: è la struttura del caso.

Va anche chiarito un equivoco: **i clienti non avranno mai una chiave del fornitore**. Pagano
CetrAI, non il fornitore del modello. La chiave in gioco è una sola, la nostra, e il rischio non
è che venga letta da un curioso — è che venga usata da chiunque, a spese nostre, senza tetto e senza
un modo di fermarla che non sia revocarla per tutti i clienti insieme.

## Decisione

La chiave non sta sul PC del cliente. Il servizio parla con il **backend CetrAI**, e il backend
parla con il fornitore.

```
PC cliente ──token licenza──> backend CetrAI ──chiave API──> fornitore
```

Il PC del cliente porta un **token di licenza**: legato a un cliente, revocabile da noi, limitato da
una quota. Rubato, vale qualche analisi sul piano di qualcun altro — un fastidio che chiudiamo dal
nostro lato. Una chiave API rubata sarebbe invece una fattura illimitata a nostro nome.

Nel codice questo è un solo punto di scelta, `ICloudTransport`, con due attuazioni:

| | `Backend` | `Direct` |
|---|---|---|
| Chi tiene la chiave | i nostri server | questa macchina |
| Cosa c'è sul PC | token di licenza | chiave API |
| Dove è ammesso | distribuzione | solo build di sviluppo |

`CloudTransportPolicy.Decide` sceglie fra i due **una volta sola**, all'avvio, ed è una funzione
pura: la regola che protegge la chiave si prova senza chiave, senza rete e senza fattura.

La regola che conta è una sola riga: in una build che non sia di sviluppo, il trasporto diretto è
**rifiutato**. Non segnalato con un avviso — rifiutato. Un avviso è qualcosa che un rilascio può
scavalcare; questo no. Se qualcuno configura `Transport: Direct` in un installer, l'analisi
approfondita semplicemente non parte e il verdetto locale resta: il guasto invisibile di ADR-0004
vale anche qui.

Le regole su *cosa* può uscire dal PC non cambiano e non si spostano: restano in `CloudAnalyst`,
sopra il trasporto. Sorgenti ammesse, tetto giornaliero, veto del catalogo valgono identiche
qualunque sia la strada.

## Conseguenze

- Il prodotto distribuito non può portare una chiave API, indipendentemente da come è scritta la
  configurazione. È una proprietà della build, non una raccomandazione.
- Lo sviluppo resta comodo: una variabile d'ambiente e `Transport: Direct` in `appsettings.json`.
- **Il backend non esiste ancora.** Esiste la metà lato client, scritta ora perché il passaggio sia
  una modifica di configurazione e non una riscrittura. Fino ad allora, in una build di rilascio
  l'analisi approfondita è spenta — che è il comportamento corretto, non una mancanza.
- Il backend diventa un componente da presidiare: è lui a custodire la chiave, ad applicare le quote
  per cliente e a poter revocare una licenza. È lavoro di Fase 5, ora con un requisito preciso.
- Un cliente offline o con il nostro backend irraggiungibile perde l'analisi approfondita, non la
  protezione: il motore locale non passa da qui.

## Alternative scartate

- **Cifrare la chiave sul PC del cliente (DPAPI, file cifrato, offuscamento).** Sposta il tempo
  necessario a estrarla da minuti a ore. Il servizio deve poterla decifrare, quindi anche chi ha
  quella macchina. Peggiore perché *sembra* una soluzione.
- **Una chiave per cliente, emessa da noi.** Sarebbe revocabile singolarmente, ma resta una chiave
  del fornitore su una macchina altrui, con un costo di gestione per cliente e nessun tetto di spesa
  applicabile da noi. Il token di licenza dà gli stessi vantaggi senza gli svantaggi.
- **Chiedere al cliente la propria chiave.** Sposta il problema sull'utente e distrugge il prodotto:
  chi compra un antitruffa per non doverci pensare non apre un account presso un fornitore di
  modelli.
- **Nessun trasporto diretto, nemmeno in sviluppo.** Onesto ma inutile: senza un backend non ci
  sarebbe modo di provare la funzione. Il rifiuto in build di rilascio ottiene lo stesso risultato
  dove conta.
