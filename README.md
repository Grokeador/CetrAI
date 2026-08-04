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

Restano spente due cose, e la ragione è dichiarata perché non è un difetto:

| Funzione | Perché è spenta |
|---|---|
| Analisi approfondita con IA | La chiave del fornitore non sta sul computer del cliente, mai: passa da un backend che qui non c'è. Una build di rilascio **rifiuta** la chiave locale, per costruzione. |
| Aggiornamento automatico | Mancano una chiave di firma e un indirizzo di pubblicazione. Il servizio lo dichiara a ogni avvio: una macchina che non riceverà correzioni non deve scoprirlo dopo. |

---

## Installazione

**Serve Windows 10 o successivo, 64 bit, e i diritti di amministratore.**

1. Scarica l'MSI dalla sezione **Releases**.
2. Windows mostrerà l'avviso di SmartScreen: **il pacchetto non è firmato**. Non c'è ancora un
   certificato EV. → *Ulteriori informazioni* → *Esegui comunque*.
3. Durante l'installazione compare una schermata sul contributo anonimo al miglioramento del
   prodotto, con la casella già spuntata. Puoi toglierla: quello che viaggia è una fascia di
   punteggio e un elenco di sigle (`9|MSG_CREDENTIAL_REQUEST`) e il formato non è in grado di
   contenere indirizzi, messaggi o nomi. In questo pacchetto non c'è comunque nessun indirizzo a cui
   mandarli, quindi non parte niente.
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
| Phishing riconosciuto, dove lo schema è vero | **7,7%** |
| Conversazioni normali (4.827 messaggi veri) accusate per sbaglio | **0** |
| Truffe riconosciute su un corpus di SMS inglesi | **4,4%** |
| Tentativi di evasione scritti a mano che passano | **74,5%** su 51 |
| Test automatici | **681** |

**Come vanno letti.** La precisione è alta e la copertura è bassa: il prodotto è costruito per non
disturbare chi non ha problemi, non per intercettare tutto. Il 4,4% sui messaggi è misurato su SMS
britannici del 2011 con truffe a numeri a tariffa maggiorata — fuori dal dominio per cui il motore è
scritto, dove una regola non peggiora: **si azzera**. E il 74,5% di evasione è pubblicato apposta:
sapere cosa manca vale più di un numero che sembra buono.

Un numero che **non** troverete qui è «prende il 99% delle minacce». Sugli elenchi di soli domini la
stessa misura dà 0,28% o 26,6% a seconda di quale schema si assume per un dato che l'elenco non
contiene — quindi non significa niente, e non lo pubblichiamo.

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
AIDefender-0.1.5177-x64.msi
SHA-256  707C86299AFFDB4F6EB49E14761A25D93FB3006A88EE61CC5EA2A13B10D9FDFB
```

```powershell
Get-FileHash .\AIDefender-0.1.5177-x64.msi -Algorithm SHA256
```

---

## Segnalazioni

Difetti, falsi allarmi e osservazioni: aprite una *Issue*, oppure scrivete direttamente.
Un falso allarme su un sito legittimo è la segnalazione più utile che esista per questo prodotto.

*Tutti i diritti riservati. Il codice sorgente non è pubblicato e non è concesso in licenza.*
