# CetrAI

> ## Windows ti protegge dai virus. **CetrAI ti protegge dalle truffe.**

Il tuo antivirus è bravissimo a fermare i file infetti. Ma nessun file infetto ti ha mai chiesto le
credenziali della banca: quello lo fa un SMS che sembra di Poste, un link che sembra dell'Agenzia
delle Entrate, un dominio che sembra il tuo istituto e ha una lettera al posto giusto.

**CetrAI è il pezzo che manca.** Sta accanto a Windows Defender, non al suo posto.

E non è un'app a cui *chiedere* se un messaggio è una truffa. È quella che **guarda al posto tuo**, e
quando trova qualcosa la sistema invece di segnalartela.

---

## ⬇️ Scarica

**[⬇ Scarica CetrAI](https://github.com/Grokeador/CetrAI/releases/latest/download/CetrAI-Setup-x64.msi)** — oppure guarda la **[pagina del prodotto](https://grokeador.github.io/CetrAI/)**

Windows 10 o successivo, 64 bit, diritti di amministratore. Un solo file, nessuna dipendenza da
installare prima: il runtime viaggia dentro.

Al primo avvio Windows mostrerà l'avviso di SmartScreen perché il pacchetto non ha ancora un
certificato EV → *Ulteriori informazioni* → *Esegui comunque*. Al termine il cruscotto si apre da
solo e l'icona compare nell'area di notifica. **Non ti viene chiesto niente.**

---

## La regola del prodotto: tu non devi fare niente

Questa è la cosa che rende CetrAI diverso, ed è una scelta scritta nel codice prima ancora che
nel marketing.

Chi installa un antivirus non vuole diventare un tecnico. Preme un pulsante e il computer deve
risultare pulito — non deve ricevere un elenco di cose da decidere, da verificare, da sistemare.

| | |
|---|---|
| 🚫 **Niente compiti a casa** | Un risultato «da verificare» che nessuno verificherà è peggio di nessun risultato |
| ⚡ **Agire, non elencare** | Trovata una truffa nella cronologia, la blocca. Non chiede il permesso di bloccarla |
| 🔘 **Niente pulsanti che falliscono** | Se una cosa non può riuscire, non te la offre: te lo spiega e ti porta dove puoi farla |
| ⌨️ **Niente riga di comando** | Se una cosa si può fare solo da terminale, per te non esiste |
| ❓ **Ogni domanda va giustificata** | Ti chiede solo l'irreversibile: il consenso all'installazione e il ripristino dei file |

---

## Cosa fa

### 🎣 Riconosce le truffe, non solo i virus

- **Indirizzi**: **17 segnali diversi** su ogni link — marchi imitati, domini appena registrati,
  sottodomini che nascondono la destinazione, alfabeti misti, suffissi usa-e-getta, percorsi da
  pagina di accesso
- **Messaggi**: incolla un SMS, una PEC, un'email. Legge **italiano, inglese, spagnolo, francese,
  portoghese e tedesco** e riconosce con **8 segnali** fretta artificiale, minacce di blocco,
  richieste di credenziali, esche di denaro, IBAN. **E legge anche il link che il messaggio porta
  dentro**, che è quasi sempre l'arma vera — anche quando è scritto nudo, senza `http`, come lo
  scrive chi truffa un ragazzino
- **Domini che imitano**: `intesa-sanpaolo-verifica.icu` non passa. E nemmeno le imitazioni
  scritte con caratteri che l'occhio non distingue — uno zero al posto di una o, una `а` cirillica

### 🎮 E le truffe che arrivano ai ragazzini

I Robux e i V-Bucks «gratis», il generatore che non esiste, l'amico che chiede la password
dell'account, il «non dirlo ai tuoi». Sette casi scritti a mano su sette, con otto messaggi veri che
usano le stesse parole — un amico che regala davvero una skin, l'avviso antitruffa di Roblox: **zero
accusati**. La riservatezza non basta a far scattare niente da sola, perché la stessa frase la scrive
un genitore che nasconde un regalo.

### 🇮🇹 Costruito per l'Italia, sul serio

Il catalogo dei marchi **non è stato scritto a memoria**. È stato costruito leggendo **trenta
settimane di riepiloghi CERT-AgID**, che pubblicano ogni settimana quali marchi vengono usati
davvero nelle campagne contro l'Italia.

Da lì sono entrati BNL, Inbank, Klarna, SumUp, Autostrade, Subito — e soprattutto **SEND**, la
piattaforma di notifiche della Pubblica Amministrazione, che è metà dell'argomento «Multe»: il tema
più frequente delle campagne italiane, **ventinove in una settimana sola**.

Nel vocabolario delle esche sono entrate le parole di quel tema: *multa, sanzione, verbale,
contravvenzione, giacenza, dogana*. Compaiono in **zero** domini legittimi su un milione.

### 🧠 Impara — dal tuo computer, non da un profilo

- **Dalla tua navigazione**: riconosce l'imitazione di una banca brasiliana senza averne mai sentito
  parlare, perché sa che *tu* la usi. La lista giusta per ciascuno è quella che ciascuno si scrive
  da solo, navigando
- **Dalle risposte già pagate**: una forma di caso che l'analisi approfondita ha deciso tre volte
  allo stesso modo viene decisa qui, offline, in microsecondi e gratis. Più lo usi, meno costa
- **Dalle altre installazioni**: due computer nella stessa casa incontravano la stessa campagna due
  volte e la pagavano due volte. Ora una regola corroborata da più macchine *diverse* vale per
  tutte — e sul filo passa solo una fascia di punteggio e un elenco di sigle

### 📞 Ti avvisa quando la truffa arriva per telefono

La frode che oggi costa di più in Italia non porta nessun virus: una telefonata, qualcuno che dice di
essere la banca, e **sei tu a installare** il programma di controllo remoto. Software legittimo,
firmato, che ogni antivirus lascia passare — giustamente, perché non è un virus. Non c'è niente da
trovare per uno scanner di file.

CetrAI guarda un'altra cosa: **quando quel programma è arrivato sul computer**. Chi lo usa per
lavoro l'ha installato mesi fa. Chi sta per essere derubato l'ha installato durante la telefonata che
è ancora in corso. Nei secondi prima che lo sconosciuto entri, ti dice l'unica frase che nessuno ti
sta dicendo: *nessuna banca chiede di installare questi programmi.*

### 💳 Sorveglia l'IBAN che hai copiato

Esistono programmi che aspettano un IBAN negli appunti e lo sostituiscono un istante prima che tu lo
incolli. Funziona perché **nessuno rilegge ventisette caratteri che ha appena copiato**, e perché
quando il bonifico è partito non c'è niente da annullare.

A tradirli non è il secondo IBAN — puoi legittimamente copiarne due — ma la velocità: un programma
deve vincere la corsa contro l'incolla, e sostituisce in millisecondi. Quello lo vediamo.

### 🔒 Ferma il ransomware e ti ridà i file

- **Rilevamento comportamentale**: guarda *come* si comportano i programmi con i tuoi file, non che
  aspetto hanno
- **Copie automatiche** delle cartelle personali, tenute fuori dalla portata di chi cifra
- **Ripristino a un clic**: il prodotto sceglie da sé l'ultima copia certamente intatta — quella
  presa **prima** dell'inizio dell'attacco
- **Attribuzione del processo e congelamento**: chi sta scrivendo viene individuato e fermato

### 🌐 Ti difende mentre navighi

Estensione per **Chrome, Edge e Firefox**, con un filtro di riservatezza che toglie query e frammenti
prima ancora che l'indirizzo lasci la pagina: la sessione non esce, mai.

### 🔄 Si aggiorna da solo, e in modo verificabile

Controllo ogni 24 ore, installazione silenziosa, **nessun pulsante**: una correzione che aspetta un
clic è una correzione non installata.

Quello che scarica lo rifiuta se non porta la nostra firma. HTTPS dimostra chi ha *servito* il file,
non chi lo ha *scritto*: il manifesto è firmato con una chiave che non sta su nessun server, e il
prodotto porta solo la metà pubblica. Rifiuta anche una versione più vecchia della propria.

### 🛡️ Fa da ponte con Windows Defender

Defender conosce il proprio stato ma non lo dice a nessuno. CetrAI glielo chiede e te lo mostra
in una schermata sola: antivirus, protezione in tempo reale, monitoraggio comportamenti, controllo
download, protezione cartelle, protezione da manomissione, età delle firme, ultima scansione.

---

## Perché fidarsi: i numeri sono misurati, non dichiarati

Misurati su dati che **non abbiamo scritto noi** — il milione di siti più visitati al mondo, elenchi
di phishing veri, corpora di messaggi già etichettati da altri.

| | |
|---|---|
| Falsi allarmi su **1.000.000** di siti reali | **0,032%** — uno su tremila |
| Conversazioni normali (4.827 messaggi veri) accusate per sbaglio | **0** |
| Phishing riconosciuto dove il catalogo conosce il marchio | **86,4%** |
| Phishing riconosciuto dove **non** lo conosce | **1,6%** |
| Test automatici che girano a ogni build | **1.115** |
| Tempo per verdetto | **0,041 ms** — 17.700 al secondo su un thread |
| Memoria per verdetto | **4,7 KB** |
| Memoria del servizio | **18-20 MB** all'avvio |

**Le due righe sul phishing vanno lette insieme, ed è il motivo per cui la seconda è pubblicata.** Un
motore a regole non degrada fuori dalla conoscenza che ha: si azzera, e sullo schermo è
indistinguibile da «tutto a posto». L'1,6% è il tetto vero del prodotto dove il marchio imitato non è
in catalogo, e si alza in un modo solo — allargando il catalogo. Chi pubblica solo l'86,4% sta
pubblicando la media di un corpus, non una capacità.

**Un falso allarme su tremila siti veri** è il numero che conta più di tutti gli altri: un prodotto
che grida su un sito legittimo insegna a ignorarlo, e da lì in poi non protegge più nessuno.

Il servizio è **leggero per costruzione**, non per fortuna: il pacchetto non viene nemmeno creato se
il servizio supera i 24 MB all'avvio, e i test falliscono se un verdetto supera gli 8 KB.

---

## Non è l'ennesimo «incolla il messaggio e ti dico se è una truffa»

Gli assistenti anti-truffa usciti negli ultimi anni fanno tutti la stessa cosa: apri l'app, incolli
il messaggio, ricevi un parere. Funzionano — **quando ti ricordi di aprirli**, e su quello che avevi
già deciso di controllare.

Ma la truffa che ti frega non è quella che hai messo in dubbio. È quella che hai creduto.

| | L'assistente che ti dà un parere | CetrAI |
|---|---|---|
| **Devi ricordarti di usarlo** | sì: apri, incolli, aspetti | **no**: guarda da sé cronologia, file e indirizzi |
| **Cosa ottieni** | un giudizio | **una cosa fatta** — il dominio bloccato, il processo fermato |
| **Il messaggio** | esce dal tuo computer | le regole girano **qui**; esce al massimo una fascia di punteggio |
| **Se qualcuno ti cifra i file** | non c'entra niente | copie automatiche e **ripristino a un clic** |
| **Il catalogo dei marchi** | globale | **trenta settimane di CERT-AgID**, costruito per l'Italia |
| **I falsi allarmi** | non pubblicati | **0,032% su un milione di siti veri**, e te lo rifai da solo |
| **Cosa sa di te** | quello che gli mandi | le tue abitudini di navigazione, **e restano sul tuo disco** |

Le ultime due righe sono quelle che contano davvero.

**Un antitruffa che grida sul sito della tua banca ti ha già perso.** Da lì in poi la persona clicca
«ignora» per riflesso, e il prodotto non protegge più niente. Per questo il numero pubblicato qui non
è la percentuale di truffe riconosciute ma quella di **volte in cui ha sbagliato su un sito vero** —
ed è misurato sul milione di siti più visitati al mondo, che non abbiamo scelto noi.

**E impara la lista giusta per te, non per tutti.** Riconosce l'imitazione di una banca brasiliana
senza averne mai sentito parlare, perché sa che *tu* la usi. Un catalogo globale non può contenere la
banca di ciascuno; la tua navigazione sì, e non lascia il tuo computer per farlo.

---

## E in più, cose che un assistente anti-truffa non fa affatto

**Ferma il ransomware e ti ridà i file.** Non è una funzione a parte: è la stessa idea. Trovato
l'attacco, sceglie da sé l'ultima copia certamente intatta — quella **prima** dell'inizio — e la
rimette. Non ti chiede quale.

**È verificabile.** Ogni numero di questa pagina si rifà con un comando su dati pubblici. Non c'è una
cifra qui che non abbia dietro una misura eseguibile.

**Ti spiega perché.** Ogni verdetto arriva con i motivi in italiano, non con un punteggio e basta.

**Non ti chiude fuori dai tuoi file.** Non cifra niente, non nasconde niente, non decide al posto tuo.

---

## Trasparenza: i limiti sono scritti dentro il prodotto

A un clic dal nome del prodotto c'è la finestra *«cosa fa»*: diciotto capacità in sei gruppi, una
riga ciascuna. **In fondo, nella stessa finestra, ci sono i limiti** — perché la persona che ne ha
più bisogno è quella che crede di aver comprato un antivirus e quindi smette di stare attenta.

- Non è un antivirus e non sostituisce quello di Windows: gli sta accanto
- Non riconosce ogni truffa, e nessuno lo fa
- Non ferma chi è già amministratore del computer
- Non ti difende da un avversario che ha scelto proprio te: è fatto contro chi manda un milione di
  messaggi perché mille persone abbocchino

---

## Verifica del file

```
CetrAI-0.1.5629-x64.msi
SHA-256  F2E4E37695F50D694AC3623B33E3CC724499D43264ADEB9B1C0ABCD21F15221A
```

```powershell
Get-FileHash .\CetrAI-0.1.5629-x64.msi -Algorithm SHA256
```

La stessa impronta è dentro `aggiornamento.json`, firmata: è quella che il prodotto controlla da sé
prima di installare qualunque cosa.

---

## Cosa provare, se stai valutando

- **Incolla un messaggio di truffa** nel cruscotto — e poi uno legittimo che gli somiglia, un
  sollecito di pagamento vero, un avviso di giacenza vero. È tarato per non gridare su quelli
- **Prova un indirizzo che imita un marchio**: `intesa-sanpaolo-verifica.icu`, e poi quello vero
- **Riavvia il computer**: il servizio riparte da solo entro un minuto
- **Un secondo account Windows** sulla stessa macchina: cronologia, correzioni e ripristino vedono
  solo il proprio profilo

---

## Segnalazioni

Difetti, falsi allarmi e osservazioni: aprite una *Issue*.
**Un falso allarme su un sito legittimo è la segnalazione più utile che esista per questo prodotto.**

*Tutti i diritti riservati. Il codice sorgente non è pubblicato e non è concesso in licenza.*
