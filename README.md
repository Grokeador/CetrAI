# AIDefender — pacchetto di valutazione

> **Windows ti protegge dai virus. AIDefender ti protegge dalle truffe.**

Servizio di sicurezza per Windows pensato per il mercato italiano: riconosce phishing, truffe via
messaggio e imitazioni di marchi, sorveglia le cartelle personali e tiene copie da cui recuperare i
file dopo un attacco.

Qui c'è **solo il programma installabile**. Il codice sorgente non è pubblicato.

---

## Cosa c'è in questo pacchetto

Tutte le funzioni sono **accese**, sia quelle del piano gratuito sia quelle del piano a pagamento.
Nessuna schermata chiede di aggiornare il piano.

Resta spenta una cosa sola, e la ragione è dichiarata perché non è un difetto:

| Funzione | Perché è spenta |
|---|---|
| Analisi approfondita con IA | La chiave del fornitore non sta sul computer del cliente, mai: passa da un backend che qui non c'è. Una build di rilascio **rifiuta** la chiave locale, per costruzione. |

**L'aggiornamento automatico è acceso da questa versione.** Il servizio guarda una volta al giorno se
ne esiste una più recente e la installa da solo, senza chiedere niente e senza chiedere un riavvio.
Quello che scarica lo rifiuta se non porta la nostra firma: HTTPS dimostra chi ha servito il file,
non chi lo ha scritto, quindi il manifesto è firmato con una chiave che non sta su nessun server e il
prodotto porta solo la metà pubblica. Rifiuta anche una versione più vecchia della propria — un
attacco di downgrade porterebbe la nostra stessa firma.

E se non riesce a controllare, **lo dice**: dopo sette giorni di silenzio la riga nel cruscotto
diventa ambra e scrive da quanti giorni. Prima restava a schermo la risposta dell'ultimo controllo
riuscito, per sempre.

---

## Installazione

**Serve Windows 10 o successivo, 64 bit, e i diritti di amministratore.**

1. Scarica l'MSI dalla sezione **Releases**.
2. Windows mostrerà l'avviso di SmartScreen: **il pacchetto non è firmato**. Non c'è ancora un
   certificato EV. → *Ulteriori informazioni* → *Esegui comunque*.
3. **Non ti viene chiesto niente sulla condivisione dei dati**, e non per distrazione: questo
   pacchetto non ha un indirizzo a cui mandare, quindi la schermata del consenso non è nemmeno
   compilata dentro. Una domanda a cui la risposta non cambia niente non è una domanda. Nei pacchetti
   che ce l'hanno, quello che viaggia è una fascia di punteggio e un elenco di sigle
   (`9|MSG_CREDENTIAL_REQUEST`): il formato non è in grado di contenere indirizzi, messaggi o nomi.
4. Al termine il cruscotto si apre da solo e l'icona compare nell'area di notifica.

Per disinstallare: *Impostazioni → App installate → AIDefender*. **Le copie di sicurezza dei tuoi
file sopravvivono alla disinstallazione**, di proposito: vanno rimosse a mano da
`C:\ProgramData\AIDefender`.

---

## Cosa vale la pena provare, se stai valutando

- **Incolla un messaggio di truffa** nel cruscotto — italiano, inglese, spagnolo, francese o
  tedesco. Poi incollane uno legittimo che gli somiglia (un sollecito di pagamento vero, un avviso
  di giacenza vero): il prodotto è tarato per non gridare su quelli.
- **Prova un indirizzo che imita un marchio**: `intesa-sanpaolo-verifica.icu`, e poi quello vero.
- **L'estensione per il browser** va installata a parte, dal cruscotto.
- **Riavvia il computer**: il servizio deve ripartire da solo entro un minuto.
- **Un secondo account Windows** sulla stessa macchina: cronologia, correzioni e ripristino devono
  vedere solo il proprio profilo.
- Da riga di comando, `aidef stato` e `aidef scan --url <indirizzo>` mostrano i segnali che hanno
  prodotto il verdetto, uno per uno, con il punteggio.

---

## I numeri, misurati e non dichiarati

Misurati su dati che non abbiamo scritto noi — il milione di siti più visitati al mondo, elenchi di
phishing veri, corpora di messaggi già etichettati da altri.

| | risultato |
|---|---|
| Falsi allarmi su **1.000.000** di siti reali | **0,032%** (di cui bloccati 0,006%) |
| Quanto ci aggiunge la cronologia accesa, come gira sul tuo PC | **+0,003 punti** |
| Phishing riconosciuto — **dove il catalogo conosce il marchio** | **78,3%** |
| Phishing riconosciuto — dove non lo conosce | **1,8%** |
| Conversazioni normali (4.827 messaggi veri) accusate per sbaglio | **0** |
| Truffe riconosciute su un corpus di SMS inglesi | **4,4%** |
| Tentativi di evasione scritti a mano che passano | **82%** su 51 |
| Test automatici | **715** |

**Le prime due righe vanno lette insieme, e sono il numero più importante di questa pagina.** La
seconda dice quanto vale il meccanismo; la terza dice quanto è largo. Quello che decide la copertura
di questo prodotto non è una soglia né un peso: è **quante organizzazioni ci sono nel catalogo**.

La media delle due fa 7,7%, ed è la cifra che questa pagina pubblicava da sola. Era fuorviante in
tutte e due le direzioni. Il corpus pubblico su cui è misurata contiene **zero** domini `.it` e
**zero** marchi italiani su trecento — ventuno sono Roblox — quindi per il 92% sta fuori da ciò che
un prodotto costruito per l'Italia può sapere. Un motore a regole fuori dal suo paese non peggiora:
**si azzera**, e a schermo è indistinguibile da «tutto a posto». Il 4,4% sui messaggi è lo stesso
fenomeno: SMS britannici del 2011, truffe a numeri a tariffa maggiorata.

**La cronologia, misurata — e questa pagina aveva promesso troppo.** Qui c'era scritto che il pezzo
che conta davvero non è il catalogo ma la funzione che impara i marchi *dalla cronologia di chi usa
il computer*: l'unica lista giusta per chiunque, capace di riconoscere l'imitazione di una banca
brasiliana senza averne mai sentito parlare. Era una frase senza un numero sotto. Adesso il numero
c'è, e dice un'altra cosa: con 200 abitudini — una macchina vera ne impara fra 158 e 176 — recupera
**3** casi di phishing sui 277 che sfuggivano.

E c'è di peggio, perché riguarda tutta questa tabella: **quella funzione non era mai entrata in una
misura**, pur essendo accesa nel prodotto installato. Misurandola, moltiplicava per sette i falsi
allarmi. Letti uno per uno, il motivo era che la regola sul «nome di un sito che usi, dentro un'altra
registrazione» accusava `dc-msedge.net`, `cloudflare-ech.com`, `azure-apim.net`,
`taboola-display.com`: i domini con cui Microsoft, Cloudflare e Amazon registrano la propria
infrastruttura. Non è una firma di frode, è una convenzione aziendale — e la regola stava accusando
Microsoft di imitare Microsoft.

Ora quella somiglianza pesa meno della soglia d'allarme: resta una prova che si somma alle altre e
non decide più da sola. I tre recuperi restano, e i falsi allarmi tornano quasi dov'erano — è la
seconda riga della tabella, e la ragione per cui esiste. Sui 990.000 siti veri fuori dalla cronologia
simulata: **294 falsi allarmi senza cronologia, 328 con**. Prima della correzione erano il settuplo.

L'**82% di evasione** è pubblicato apposta, e questa volta è **salito**: era 74,5%. Tre dei tentativi
scritti a mano venivano fermati proprio da quella regola che accusava da sola. Tre attacchi scritti
da noi contro quarantasei siti veri che la gente apre ogni giorno — il baratto non è in dubbio, ma è
una perdita, e sapere cosa manca vale più di un numero che sembra buono.

Un numero che **non** troverete qui è «prende il 99% delle minacce». Sugli elenchi di soli domini la
stessa misura dà 0,28% o 26,6% a seconda di quale schema si assume per un dato che l'elenco non
contiene — quindi non significa niente, e non lo pubblichiamo.

**Il tetto, misurato.** Dei casi non riconosciuti, il 42% non accende **nessun** segnale: nessuna
soglia li prenderà mai. Alcuni sono siti legittimi bucati, dove l'indirizzo è innocente perché lo è
davvero. Abbassare la soglia da 25 a 20 guadagnerebbe otto casi di phishing e accuserebbe
ventiduemila siti veri — misurato, ed è il motivo per cui la soglia non si tocca.

---

## Cosa questo prodotto NON fa

È scritto anche dentro il programma, sotto *«cosa non fa»* nel cruscotto.

- **Non è un antivirus** e non sostituisce quello di Windows: gli sta accanto.
- **Non ferma chi è già amministratore** del computer.
- **Non riconosce ogni truffa**, e nessuno lo fa.
- **Non cifra niente** e non nasconde i file.
- **Non ferma un ransomware con certezza**: riduce il danno e tiene copie.
- **Non decide al posto tuo** e non ti chiude fuori dai tuoi file.
- **Non ti difende da un avversario che ha scelto proprio te**: è fatto contro chi manda un milione
  di messaggi perché mille persone abbocchino.

---

## Verifica del file

```
AIDefender-0.1.5251-x64.msi
SHA-256  971F050A0103EA4228B1ABDCD12E96D43397773DF6B12A341B5437298E5C3558
```

```powershell
Get-FileHash .\AIDefender-0.1.5251-x64.msi -Algorithm SHA256
```

La stessa impronta è dentro `aggiornamento.json`, firmata: è quella che il prodotto controlla da sé
prima di installare qualunque cosa.

---

## Segnalazioni

Difetti, falsi allarmi e osservazioni: aprite una *Issue*, oppure scrivete direttamente.
Un falso allarme su un sito legittimo è la segnalazione più utile che esista per questo prodotto.

*Tutti i diritti riservati. Il codice sorgente non è pubblicato e non è concesso in licenza.*
