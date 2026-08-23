# Cosa fa CetrAI

Inventario delle capacità del prodotto, ricontate dal sorgente l'8 agosto 2026 sulla versione
**0.1.5276**. Ogni riga porta il file dove sta la cosa, così chi legge può andare a vedere.

Questo documento non è marketing: esiste per essere letto da chi valuta il prodotto, e dice anche
cosa è spento e perché. La sezione che vale di più è [l'ultima](#11-cosa-è-spento-e-perché).

## Come leggere la colonna «stato»

| stato | significa |
|---|---|
| **attiva** | gira nel pacchetto che si scarica oggi |
| **Premium** | costruita, spenta nel piano Free |
| **spenta** | costruita e non accesa, con la ragione accanto |
| **non c'è** | dichiarata da qualche parte e senza codice che la applichi |

E una seconda distinzione, che conta di più della prima: **provata sul prodotto installato** oppure
**verde solo nei test**. In questo progetto ogni installazione ha trovato difetti che i test non
vedevano, quindi le due cose non si equivalgono.

---

## 1. Motore anti-truffa

Cinque rilevatori, **37 codici di segnale** distinti: **18** riguardano gli indirizzi, **19** i
messaggi. Registrati in `Detection/DetectionServiceCollectionExtensions.cs:34`.

Il conto giusto è la somma delle tabelle qui sotto — 10 + 4 + 4 + 19 — e per un mese questa riga ha
detto 28 e 20, cioè tre in più di quanti ne elencava lei stessa. Le tabelle erano giuste: sbagliato
era il totale, che nessuno ricontava perché stava sopra e sembrava il riassunto. Si ricava in un
comando, e quello è il modo di scriverlo:
`grep -rhoE '"(URL|MSG)_[A-Z0-9_]+"' src/CetrAI.Detection --include=*.cs | sort -u | wc -l`.

### Sugli indirizzi — `Detection/Signals/UrlStructureDetector.cs`

| segnale | peso | scatta quando |
|---|---|---|
| `URL_USERINFO` | **45** | c'è qualcosa prima di una `@` nell'autorità |
| `URL_PUNYCODE` | 40 | due alfabeti dentro la stessa etichetta (`аpple.com`) |
| `URL_IP_LITERAL` | 35 | l'host è un indirizzo numerico nudo |
| `URL_HIGH_RISK_TLD` | 22 | suffisso fra i 20 usa-e-getta noti |
| `URL_FREE_CURRENCY_PROMISE` | 30 | il nome promette valuta di gioco gratis (`robuxgratis`, `freevbucks`) |
| `URL_DEEP_SUBDOMAIN` | 20 | il sottodominio ha tre o più etichette |
| `URL_CREDENTIAL_PATH` | 20 / 12 | il percorso contiene parole da pagina d'accesso (20 da due in su) |
| `URL_SHORTENER` | 18 | dominio fra i 12 accorciatori noti |
| `URL_INSECURE_SCHEME` | 15 | schema `http` |
| `URL_FOREIGN_SCRIPT` | 12 | etichetta intera in un alfabeto non latino sotto suffisso latino |

45 è `Signal.DecisiveWeight`: da lì in su un segnale solo può portare un verdetto.

### Marchi imitati — `Detection/Signals/BrandImpersonationDetector.cs`

| segnale | peso | scatta quando |
|---|---|---|
| `URL_BRAND_IN_SUBDOMAIN` | **55** | il marchio è solo nel sottodominio (`poste.it.secure-login.tk`) |
| `URL_BRAND_IMPERSONATION` | **52-45** | marchio nel dominio registrabile che non è suo — banche 52, PA e poste 50, PEC 48, resto 45 |
| `URL_BRAND_ON_RENTED_SUBDOMAIN` | 45 | il marchio è nel sottodominio di una piattaforma che affitta sottodomini, **e** c'è un'esca accanto |
| `URL_BRAND_IN_PATH` | 18 | il marchio è nel percorso di un dominio estraneo, **e** il percorso porta anche un'esca |

Riporta **solo la corrispondenza più grave**, non la somma.

#### A destra del marchio non c'era sempre un proprietario

Il segnale da 55 dice una frase precisa — *il sito reale è X, il nome è stato messo davanti solo per
ingannare* — e su `poste.it.secure-login.tk` è vera. Rimisurata sui **108.583 host con almeno tre
etichette** del milione Tranco, era falsa in due modi opposti che sono lo stesso difetto: **a destra
non c'è un proprietario.**

- **X è un palazzo in affitto.** Su `github.io` il sottodominio è il nome dell'organizzazione, quindi
  `metamask.github.io` è MetaMask — e compare in un feed di phishing, dove il prodotto lo dava
  Pericoloso a 55. Su Fandom è il wiki della comunità, su Vercel è il nome che la piattaforma genera
  da un repository: `amazon-clone-mauve-beta.vercel.app` è un esercizio.
- **X non è un dominio, è un suffisso che il parser non conosceva.** `vodafone.com.pg` veniva letto
  come «vodafone davanti a com.pg», e `com.pg` non è di nessuno.

Dei 14 accusati, **dodici erano il sito nazionale vero di una multinazionale**: DHL Polonia,
Vodafone in Papua Nuova Guinea, Giappone, Qatar e Figi, Leroy Merlin Cipro, Binance Taiwan, Poste
Algeria, Santander in Colombia e Messico, e la pagina SPID della Regione Piemonte. Gli altri due
erano `roblox.com.ug` e `roblox.com.ml`, cioè phishing vero: **il milione Tranco contiene anche
domini di truffa abbastanza visitati da entrarci**, ed è la ragione per cui qui si leggono i nomi
invece di contare le righe.

Sulla piattaforma il nome da solo non vale più niente, quindi decide la compagnia che tiene —
marchio **più** parola d'esca, la stessa regola del marchio nel percorso. **45 e non 55**, cioè
avviso e non blocco, perché un produttore onesto di quella forma esiste: `paypal-scam-alert.
blogspot.com` è il blog che mette in guardia dalla truffa, e «alert» sta nel vocabolario delle esche.
È lo stesso inciampo di *«Never share your password»*.

**Il denominatore che manca, detto prima del numero:** il milione Tranco non contiene **nemmeno un**
sottodominio di quelle piattaforme, perché elenca domini registrabili. Il «14 su 108.583» non dice
quindi niente sul primo dei due casi; per quello la metà legittima è scritta a mano in
`tests/CetrAI.Detection.Tests/RentedSubdomainTests.cs`, e la misura possibile è stata quella opposta,
sui feed di phishing: su 155.927 domini di Phishing Army 1.657 stanno su quelle piattaforme e la
regola ne prendeva **zero**; su 64.960 di URLhaus, 1.269 e **zero**; su 300 di OpenPhish, 171 e
tredici.

**Il prezzo, scritto invece che nascosto:** OpenPhish 35 → 23 catture, Phishing Army 182 → 179.
I dodici persi di OpenPhish, uno per uno: `metamask.github.io` (il sito vero), quattro
`amazon-clone-*.vercel.app`, `amazon-com-html-css-project.vercel.app`,
`airbnb-frontend-ashen-three.vercel.app` e `netflix-rho-wheat.vercel.app`. I falsi allarmi su Tranco
sono 14 → **3**, e quei tre stanno nei feed.

E una cosa che vale più del prezzo: delle 39 catture della forma `roblox.com.<paese>`, **nessuna è
una regola** — le prende un buco. La stessa truffa sotto un suffisso già in elenco, `roblox.com.br`
o `roblox.co.uk`, esce **Sicura oggi**, e un test lo dimostra invece di lasciarlo dedurre. Chi un
giorno importerà l'elenco pubblico completo dei suffissi le perderà tutte insieme, e la domanda da
riaprire allora non sarà la lista ma `IsSameBrandAbroad`, che regala il nome del marchio a chiunque
lo registri in un paese dove il marchio non c'è.

### Somiglianze — `Detection/Signals/CatalogueLookalikeDetector.cs`, `FamiliarLookalikeDetector.cs`

| segnale | peso | scatta quando |
|---|---|---|
| `URL_CATALOGUE_LOOKALIKE` | 55 / 24 / 20 | quasi-copia di un dominio ufficiale in catalogo |
| `URL_LOOKALIKE_NEAR_MISS` | **55** | stesso nome e stesso suffisso di un sito che *tu* usi, diverso solo per caratteri che l'occhio non distingue |
| `URL_LOOKALIKE_NEAR_MISS` | 24 | una modifica di distanza (due su nomi lunghi) |
| `URL_LOOKALIKE_CARRIED` | 24 | il nome familiare portato dentro un'altra registrazione |
| `URL_LOOKALIKE_SAME_SHAPE` | 20 | stesso nome sotto un altro suffisso |

I tre da 24 e 20 stanno **sotto la soglia d'allarme apposta**: contribuiscono e non concludono. Il
ramo da 55 accusa da solo, ed è l'unico. I quattro pesi sono fissati da
`tests/CetrAI.Detection.Tests/FamiliarLookalikeTests.cs` — perché un commento altrove nel motore
diceva che l'intero rilevatore era limitato a 24, e su quella frase erano state prese decisioni.

### Sui messaggi — `Detection/Signals/MessageContentDetector.cs`

| segnale | peso | scatta quando |
|---|---|---|
| `MSG_CREDENTIAL_REQUEST` | **45** | verbo + oggetto credenziale, formale (*«confermi le credenziali»*) o tra pari (*«dammi la tua password»*, *«send me your password»*). Comprende la frase di recupero di un portafoglio crypto |
| `MSG_OTP_HANDOVER` | **45** | chiede il codice usa-e-getta appena arrivato (*«inviandomi il codice a 6 cifre»*) |
| `MSG_SAFE_ACCOUNT` | **45** | «conto di appoggio», «conto sicuro», o un IBAN cambiato su cui versare |
| `MSG_REMOTE_HELP` | **45** | chiede di installare AnyDesk, TeamViewer, Supremo, «assistenza remota» |
| `MSG_PAY_TO_WORK` | **45** | chiede di pagare, ricaricare o versare per «sbloccare i task», gli incarichi, il lavoro |
| `MSG_CARD_PHOTO` | 30 | foto o copia della carta / del bancomat, **fronte e retro** |
| `MSG_FAKE_INFECTION` | 30 | «il tuo telefono è infetto» + scarica, installa, clicca, chiama |
| `MSG_NEW_NUMBER_MONEY` | 30 | numero nuovo **e** richiesta di denaro nello stesso messaggio |
| `MSG_FREE_CURRENCY` | 25 | Robux, V-Bucks o primogem promessi gratis, o un «generatore» |
| `MSG_GUARANTEED_RETURN` | 25 | guadagno garantito, rendimento sicuro, «senza rischio» |
| `MSG_ITEM_DUPLICATOR` | 25 | offerta di duplicare o raddoppiare oggetti **dentro un contesto di gioco**: le due metà separate non accusano, insieme sì |
| `MSG_THREAT` | 22 | minaccia di sospensione, blocco, **ban**, azione legale, tentativo di accesso |
| `MSG_SECRECY` | 22 | chiede di non dirlo ai genitori, di tenerlo segreto, di cancellare la chat |
| `MSG_JOB_LURE` | 22 | una cifra a giornata **e** «nessuna esperienza richiesta» nello stesso messaggio |
| `MSG_CHANNEL_SWITCH` | 20 | porta la conversazione su WhatsApp, Telegram o Signal, fuori dalla piattaforma |
| `MSG_IBAN` | 20 | un IBAN nel testo |
| `MSG_MONEY_LURE` | 20 | rimborso, premio, fattura non pagata, spese doganali, spese di consegna, multa da pagare |
| `MSG_MULTIPLE_PATTERNS` | 20 | quando i precedenti hanno già prodotto **tre** segnali |
| `MSG_URGENCY` | 18 | scadenze e fretta artificiale |

I quattro a 45 e i tre a 30 sono **tutte truffe che non contengono un link**: il telefono del finto
operatore, il codice usa-e-getta, il conto di appoggio, il «ciao mamma». Il motore sugli indirizzi
non poteva vederne nessuna, ed è la ragione per cui esistono — vedi il corpus italiano in fondo.

**Sei lingue**: italiano, inglese, tedesco, e un unico schema romanzo per spagnolo, francese e
portoghese. Lavora sul testo con gli accenti tolti, perché la stessa truffa arriva come *envío* e
*envio*.

`MSG_CREDENTIAL_REQUEST` ha una difesa dedicata: *«Never share your password»* è l'avviso antitruffa
che ogni banca manda ai clienti, quindi una negazione assoluta entro 40 caratteri nella stessa frase
annulla **quella** corrispondenza.

Lo stesso codice ha **due pattern**, e la differenza è misurata. Quello formale — *«confermi le sue
credenziali»* — accetta anche oggetti larghi: `account`, `utenza`, `identità`. Quello tra pari —
*«dammi»*, *«mandami»*, *«passami»* — pretende un segreto vero: password, codice, credenziali,
chiave privata. La ragione è un falso allarme trovato scrivendo la metà legittima: *«fammi entrare
nel tuo account che ti finisco la missione mentre sei a scuola»* prendeva **45**, cioè il prodotto
diceva a un ragazzino che suo fratello lo stava truffando. Le due frasi — quella del truffatore che
promette di portarti al livello 100 e quella del fratello — sono **identiche**, quindi la domanda
categorica non ha una risposta e il segnale deve tacere. Il prezzo è dichiarato: il furto d'account
travestito da *«te lo potenzio io»* non si vede più.

`MSG_SECRECY` pesa 22 e **non accusa da solo**, ed è una scelta, non una taratura. La domanda
categorica posta per intero — *quale mittente onesto scrive «non dirlo a nessuno»?* — ha una risposta
scomoda: continuamente. Un amico che prepara una festa a sorpresa, un genitore che nasconde un regalo
di compleanno. Quello che nessun mittente onesto fa è chiedere di nasconderlo **ai genitori** mentre
passa qualcosa di valore, ed è lì che questo segnale si somma agli altri invece di condannare da solo.
La prima versione del pattern inglese accusava cinque conversazioni vere su 4.827 — *«it's impossible
between us»*, *«i dont thnk its a wrong calling between us»* — perché leggeva due parole e non la
frase: in inglese la segretezza sta nel verbo che governa *between us*, non nella coppia.

### Come si compone il punteggio — `Detection/Scoring/`

I segnali si ordinano per peso e ogni successivo conta **0,55** del precedente: cinque prove deboli
non fanno una prova forte.

| soglia | valore | significa |
|---|---|---|
| pericoloso | **50** | e solo se la confidenza supera 55, altrimenti scende a sospetto |
| sospetto | **25** | |
| banda del dubbio | **20-55** | qui il prodotto dichiara di non aver deciso |
| pavimento di rumore | **12** | sotto, dichiara di essere sicuro che non c'è niente |

**I link dentro i messaggi vengono letti** (`Detection/Analysis/LinkFinder.cs`): fino a tre, e conta
il peggiore, non la somma. Prima non venivano guardati affatto — un messaggio incollato veniva pesato
sulle sue parole e il link che portava no. Misurato: da 1 su 5 a 5 su 5 sulle truffe di compravendita.

**Stato: attiva.** Provata sul prodotto installato.

---

## 2. Cataloghi — `Detection/Data/`

| cosa | quanto | dove |
|---|---|---|
| organizzazioni italiane | **51** | `ItalianOrganizations.cs` |
| marchi mondiali | **60** | `GlobalBrands.cs` |
| **totale** | **111** | `BrandCatalogue.cs` |
| categorie | 8 | PA, banche, poste, utenze, corrieri, PEC, piattaforme, social |
| parole esca | **114** | italiano 46, inglese 33, spagnolo 20, tedesco 7, francese 8 |
| nomi ambigui che non sparano da soli | 13 | `intesa`, `sella`, `visa`, `send`, `subito`… |
| suffissi riconosciuti | **210** | `WorldSuffixes.cs` — elenco di suffissi *legittimi*, non pericolosi |
| suffissi di enti pubblici | 16 | `gov.it`, `gouv.fr`, `gc.ca`… |

Il catalogo italiano non è stato scritto a memoria: viene da **trenta settimane di riepiloghi
CERT-AgID**. Ogni marchio aggiunto è misurato contro il milione di siti più visitati al mondo prima di
entrare, e la misura si rifà con `tools\misura-esterna.ps1`.

`amazon.de` è riconosciuta come Amazon senza che la Germania sia in nessun elenco: conta il **nome**
davanti al suffisso, che è quello che non cambia da un paese all'altro — ma solo sotto un suffisso
riconosciuto. Sotto `.tk` la stessa forma significa il contrario.

**Stato: attiva.**

---

## 3. Apprendimento locale

| cosa | dove | come funziona |
|---|---|---|
| **Quello che l'analisi pagata ha già deciso** | `Core/Learning/LessonBook.cs` | Chiave = *fascia di punteggio + sigle dei segnali*, mai un indirizzo. Tre accordi e zero disaccordi per diventare regola; un disaccordo squalifica per sempre. 500 voci, dimentica dopo 90 giorni |
| **Le tue abitudini di navigazione** | `Service/FamiliarDomainsStore.cs` | Dalla cronologia locale, per utente Windows, **solo in memoria, mai su disco**. Tre pagine distinte fanno un'abitudine, 120 giorni indietro |
| **Le altre installazioni** | `Core/Learning/SharedExperience.cs` | Solo forme corroborate; una regola `Safe` **non può attraversare il filo in nessuna direzione**, così un voto falso può al massimo produrre un falso allarme visibile, mai far tacere una minaccia vera |

La grammatica di quello che esce è `^[0-9]{1,4}\|[A-Z][A-Z0-9_]{0,39}(\+…){0,19}$`: **il formato non
è in grado di contenere un indirizzo, un messaggio o un nome.** Non è un dato reso anonimo, è un dato
che non ha mai riguardato nessuno.

**Stato: apprendimento locale attivo; esperienza condivisa spenta** (nessun indirizzo configurato nel
pacchetto, quindi nessuna casella da spuntare all'installazione).

Spenta non vuol dire non provata. L'11 agosto 2026 il giro è stato eseguito per intero su questa
macchina — il client vero costruito da `ServiceWiring` contro il backend vero su HTTP, non un
`HttpMessageHandler` finto: due installazioni concordano su una forma, la terza la chiede e la
adotta (`ricevute 2 da 5 installazioni, 1 nuova qui`). Quello che manca è l'indirizzo, non il
meccanismo.

---

## 4. Ransomware — `Core/Ransom/`, `Service/RansomGuard.cs`, `Platform.Windows/Ransom/`

| cosa | dettaglio |
|---|---|
| **Rilevamento** | Finestra scorrevole di 2 minuti: 25 file, 3 cartelle, 5 file rotti, note di riscatto in 2 cartelle. «Rotto» si stabilisce dal numero magico dell'intestazione, non dall'estensione |
| **Copie** | A contenuto indirizzato (lo stesso documento in 50 copie costa una copia sola), ogni 6 ore, in `%ProgramData%\CetrAI\snapshots` |
| **Cosa si copia** | ~40 estensioni non riscaricabili, max 64 MB per file; mai `appdata`, `.git`, `node_modules`, Windows, Programmi |
| **Spazio** | 5 GB. Lo sfratto toglie **dal mezzo**: la più vecchia e le tre più recenti si tengono, perché durante un attacco le recenti contengono i file cifrati |
| **Sotto attacco** | L'archivio si **congela**: non si copia e non si sfratta più niente |
| **Chi sta scrivendo** | Restart Manager, senza driver, chiedendo dei file **non ancora toccati** — Windows avvisa solo dopo la chiusura |
| **Cosa gli si fa** | **Congelato, non ucciso**: la chiave di cifratura sta nella sua memoria. Reversibile con `cetrai resume --pid` |
| **Chi non si tocca mai** | Processi di sistema, i nostri, quelli senza percorso leggibile, e più di un candidato = nessuno. **Eccezione: gli interpreti di script sono fermabili** |
| **Ripristino** | Il prodotto sceglie da sé l'ultima copia certamente intatta — quella **prima** dell'inizio. **A secco per difetto**: scrive solo se glielo si chiede |
| **Le copie** | Solo LocalSystem e amministratori possono leggerle: gli utenti non hanno **nessun** accesso, perché la cassaforte contiene i documenti di tutti |

**Stato: rilevamento e avvisi attivi anche in Free. Copie e ripristino: Premium.**
Provato su un attacco inscenato (120 file, processo giusto, fermato al quinto); **su un ransomware
vero non è mai stato provato**, ed è un limite dichiarato (ADR-0014).

### Dove sono i file, quando non sono dove Windows crede

Le cartelle sorvegliate erano quelle che Windows *offre*: Documenti, Immagini, Musica, Video,
Desktop. Chi tiene il lavoro in `D:\Progetti` guardava una stanza vuota — l'attacco avrebbe cifrato
l'unica cartella che conta senza che un evento arrivasse al rilevatore.

Ora si **deducono**, senza chiedere niente: le scorciatoie che Windows scrive in `Recent` sono il
registro di quali file una persona ha davvero aperto. Misurato sulla macchina di sviluppo: **132
scorciatoie, 108 leggibili, 65 fuori dal profilo**, che si raggruppano in tre cartelle di lavoro
vere (`WorkFolders.Deduce`, soglia: 3 file distinti sotto la stessa radice, massimo 3 cartelle, mai
la radice di un disco).

Le scorciatoie si leggono **byte per byte** (`ShellLinkTarget`, struttura LinkInfo di MS-SHLLINK) e
non chiedendo alla shell: `IShellLink::Resolve` quando il file non c'è più si mette a cercarlo, e può
bloccarsi su una condivisione di rete — dentro un servizio LocalSystem che sorveglia il ransomware non
è accettabile. E la risoluzione non serve: un percorso che non esiste più è un posto dove la persona
non lavora più.

Le cartelle dedotte entrano nella **sorveglianza, non nelle copie**: un osservatore è una
sottoscrizione del kernel e non costa niente, una copia di una cartella scelta perché è enorme
riempirebbe il disco della persona che dovrebbe proteggere.

**Il prezzo, misurato prima di scrivere il filtro.** Se il lavoro entra nella sorveglianza, ci entra
anche un albero di sorgenti: una sola compilazione di questo prodotto ha scritto **289 file, tutti e
289 dentro `bin` e `obj`**, contro una soglia che si insospettisce a 25 file in 3 cartelle. Senza
filtro la protezione sarebbe passata a «attività insolita» a ogni compilazione. Ignorate `bin`,
`obj`, `node_modules`, `.git`, `dist`, `target`, `__pycache__`, `venv`, `packages`: un ransomware che
cifrasse solo `node_modules` non avrebbe distrutto niente, ed è esattamente il motivo per cui si
possono ignorare.

---

## 5. Integrazione con Windows — `Platform.Windows/`

| cosa | stato | dettaglio |
|---|---|---|
| **Ponte con Defender** | attiva | Sette proprietà lette direttamente da WMI, non da PowerShell: servizio antivirus, tempo reale, comportamenti, controllo download, anti-manomissione, età firme, ultima scansione. Più la protezione cartelle |
| **Protezione cartelle personali** | attiva | Macchina a stati: osserva 7 giorni, legge dal registro eventi di Defender cosa avrebbe bloccato, autorizza quei programmi, poi accende il blocco. **Avanza da sola su un orologio** — prima aspettava che qualcuno premesse un pulsante |
| **Riaccendere la protezione in tempo reale** | attiva, ramo di scrittura non eseguito qui | Il ponte la vedeva spenta e sapeva solo dirlo: un compito a casa dato a chi non sa dove sta l'interruttore. Ora il servizio la riaccende da solo, due volte al giorno, con tre rifiuti in una funzione pura (`RealTimeProtectionPolicy`). **Un altro antivirus** → non si tocca niente: Windows spegne Defender apposta quando qualcuno si registra in `root\SecurityCenter2`, e «aggiustare» quella macchina significa metterci due scanner in tempo reale sugli stessi file. **Stato illeggibile** → non si scrive: una risposta mancata non è un «no». **Un rifiuto si ricorda** per sette giorni e muore col build che l'ha scritto: la protezione da manomissioni accetta la richiesta e non la applica, quindi si rilegge l'impostazione — il codice di ritorno zero non è una prova, sono parole di Microsoft — e non si insiste per sempre, né contro il sistema operativo né contro chi l'ha spenta apposta |
| **Blocco di rete** | attiva | Filtri WFP in **sessione dinamica**: spariscono se il processo muore, quindi un servizio in crash non può lasciare una macchina tagliata fuori. Tetto di 256 host. Provato con gli occhi: filtri 16 → 18 nel motore di Windows, bersaglio irraggiungibile, e tutto torna alla scadenza |
| **Cronologia del browser** | attiva | L'unico posto del prodotto che la legge. Sei browser: Chrome, Edge, Brave, Vivaldi, Opera, Firefox. La cartella del profilo arriva da chi chiama, non viene mai cercata |
| **Riavvio del servizio** | attiva | Il servizio configura da sé le azioni di ripristino di Windows a ogni avvio, invece di lasciarlo all'installatore |
| **Avvio sulla scrivania dell'utente** | attiva | Il servizio, che vive in sessione 0, avvia la finestra nella sessione di chi sta usando il computer. Serve dopo un aggiornamento, quando nessun altro lo farebbe fino al logon successivo |

---

## 6. Le difese che non guardano né indirizzi né testo

| cosa | stato | come funziona |
|---|---|---|
| **Il finto operatore bancario** | attiva | Avvisa quando parte un programma di controllo remoto **arrivato da poco** sul computer. Il segnale non è il programma — centinaia di migliaia di persone lo usano onestamente — ma *quando è arrivato*: chi ci lavora l'ha installato mesi fa, chi sta per essere derubato durante la telefonata in corso. Avvisa, non blocca. Misurato: 229 processi su questa macchina, 0 nominati dall'elenco |
| **L'IBAN sostituito negli appunti** | attiva | A tradire il malware non è il secondo IBAN — se ne possono copiare due — ma la velocità: deve vincere la corsa contro l'incolla, e sostituisce in millisecondi. Cifre di controllo calcolate davvero, sennò un numero di fattura armerebbe un allarme sul denaro. Vive nel tray, perché gli appunti appartengono a una window station e il servizio non ne ha una |
| **Una riga al mese** | attiva | Solo quando c'è qualcosa da dire. Chi non vede mai succedere niente smette di credere che il prodotto ci sia |
| **«Vedi come funziona»** | attiva | La stessa idea, a comando: il cruscotto analizza `poste.it.sicurezza-accesso.invalid/login/verifica`. L'indirizzo non può essere di nessuno (`.invalid` è riservato dalla RFC 6761), e il verdetto **non è recitato** — nel motore non c'è una riga che conosca quella stringa, esce PERICOLO per i due segnali veri. Un caso speciale avrebbe dimostrato che il pulsante funziona, che non è la cosa in dubbio. Se un giorno il motore smette di riconoscerlo, il pulsante lo dice invece di mostrare una riga verde: `SelfTestTests` lo tiene fermo |
| **Il fascicolo per la denuncia** | attiva | Data, ora con fuso, indirizzo, giudizio e motivo di ogni tentativo, più i blocchi applicati, in un file di testo sul desktop. Non è rilevamento, è **trascrizione**: allo sportello chiedono tre cose che nessuno conserva e che il prodotto ha. Ci va **solo ciò che è stato segnalato** (l'elenco di tutto quello che una persona ha guardato, consegnato da lei alla polizia, sarebbe un fascicolo di sorveglianza), la parte dopo il `?` è tagliata perché negli indirizzi di phishing contiene spesso la posta della vittima, e il documento **dice di non essere una perizia**: le ore vengono dall'orologio di quel computer e il file è modificabile |

---

## 7. Superficie di comando

**Canale locale** — `Core/Ipc/IpcContracts.cs`, tubo `CetrAI.Service`, messaggi max 64 KB.
Undici operazioni: `Ping`, `Scan`, `Status`, `History`, `Feedback`, `RansomStatus`, `Restore`,
`FolderShield`, `Checkup`, `Blocks`, `Unblock`.

Chi chiama viene identificato **dal token della connessione, mai da quello che dichiara**. Gli utenti
autenticati possono leggere e scrivere, solo amministratori e LocalSystem possono alterare il canale.
Ogni conversazione ha 4 minuti di tempo, così un client che si collega e tace non porta via il canale
a tutti. E se il nome del tubo appartiene a qualcun altro il servizio **aspetta invece di spegnersi** —
prima quell'eccezione portava giù l'intero prodotto.

**Riga di comando** — `cetrai`, undici verbi: `scan`, `status`, `scansiona`, `blocks`, `netblock`,
`feedback`, `harden`, `watch`, `snapshot`, `restore`, `resume`. Ogni forma stampata nell'aiuto è ora
coperta da un test, perché una di esse non aveva mai funzionato.

**Cruscotto** — sette righe di protezione, avvisi, stato del browser per browser, attività,
un riquadro per analizzare un indirizzo a mano, e una finestra **«cosa fa»** a un clic dal nome del
prodotto: diciotto capacità in sei gruppi, una riga ciascuna, dai marchi imitati alle truffe dentro
i giochi. In fondo alla stessa finestra restano i **dieci limiti dichiarati**, senza il dettaglio
lungo — che sta in `docs/modello-di-minaccia.md`. Prima quella finestra era solo i limiti; toglierli
del tutto sarebbe stata l'unica modifica capace di fare male a qualcuno, perché chi crede di aver
comprato un antivirus smette di stare attento, e allora il prodotto lo avrebbe reso *meno* sicuro.

---

## 8. Estensione per il browser

Chrome, Edge e Firefox. Manifest V3.

Il filtro di riservatezza toglie **query e frammento** prima che l'indirizzo lasci la pagina: passano
solo schema, host e percorso. La stessa regola è riapplicata dal lato del ponte, *perché un host non
deve fidarsi di chi lo chiama, nemmeno di un chiamante scritto da noi*.

Il ponte riconosce quale browser l'ha avviato **risalendo al processo padre**, non da quello che
l'estensione dichiara — e legge solo il nome del processo, mai il percorso o la riga di comando, che
conterrebbe il profilo.

### I messaggi privati dei social — `content/social-dm.js` *(in corso)*

Instagram, TikTok, LinkedIn: il finto recruiter, il finto sponsor, l'amico con l'account rubato che
chiede «il codice per il concorso». Sono truffe fatte di frasi, quasi sempre senza un link, e nessun
antivirus le guarda perché non c'è niente da scansionare.

**La domanda vera non era il codice, era il consenso**, e la risposta è stata resa *inesprimibile*
invece che promessa. Quattro cose, ognuna verificata da un test in `PrivateMessageTests`:

| La promessa | Come la difende il formato |
|---|---|
| in cronologia non finisce il testo | il target del verdetto è `PublicName`, e per un messaggio privato lo mette `ForPrivateMessage` |
| non finisce nemmeno il nome di chi scrive | il posto è un `SocialSite` — quattro valori — non una stringa: il campo **non sa esprimere** una frase |
| non esce niente in rete, nemmeno i link | `LocalOnly` è vero e non è un parametro |
| l'analisi in cloud non la può ricevere | `MayLeave` rifiuta la sorgente *anche se qualcuno la aggiunge* all'elenco delle ammesse |

Dal lato della pagina vale la regola simmetrica: si legge **solo quello che arriva**. Quello che
scrive la persona che ha installato CetrAI non viene guardato, perché leggerlo sarebbe sorvegliare
lei invece di proteggerla — ed è la prima riga di `worthReading`, misurata in
`tools\prova-messaggi-privati.mjs`.

**Perché resta in corso.** Quali pezzi della pagina siano «un messaggio ricevuto» dipende dalla
forma delle tre pagine, che cambia senza avvisare. Quando cambia, questo file non sbaglia: **smette
di vedere**, e a schermo è identico a «nessuna truffa» — la bugia lenta descritta nel `CLAUDE.md`.
Va provato su un account vero prima di diventare verde.

### Il finto supporto tecnico — `content/support-scam.js`

L'unica truffa che non sta in un indirizzo. Il dominio è usa-e-getta, la pagina non ha link da
seguire né moduli da compilare: il carico è il **numero di telefono**, che la persona digita sul
proprio cellulare. Nessuna delle cose che il motore legge — indirizzo, testo, catalogo — può vederla.

La forma categorica la fornisce Microsoft: i suoi messaggi di errore **non contengono mai un numero
di telefono**. La regola accusa quando tutte e tre valgono, più una quarta:

1. la pagina dichiara che *questo* computer è bloccato, infetto o non va spento;
2. si presenta come Microsoft, Windows Defender o Apple;
3. non è su un dominio loro;
4. **e fa** una di queste quattro cose: prende lo schermo intero, impedisce di chiudere, suona un
   allarme, oppure dice «chiama subito» accanto a un numero **su una pagina corta**.

Poi agisce prima di parlare: zittisce l'audio ed esce dallo schermo intero — una persona spaventata
compone il numero prima di ragionare — e solo dopo scrive sopra la pagina la frase che nessuno le sta
dicendo.

**Misurato**, 11 casi su `tools/prova-supporto-falso.mjs`, dentro `tools\verifica.ps1`: 4 truffe e 7
pagine vere scelte per essere difficili. La più difficile è l'articolo di giornale **che racconta
questa truffa**: contiene ogni parola della regola — la frase, il nome, il numero, la fretta — perché
la sta citando. A separarli è la lunghezza: una schermata di truffa è un manifesto da leggere in un
colpo d'occhio, un articolo è prosa. Il quarto punto vale solo sotto i 1500 caratteri.

**Quello che questa regola non vede**, dichiarato: una trappola d'uscita installata con
`addEventListener` invece che sulla proprietà `onbeforeunload` (dal contenuto non si può rileggere),
e il testo dentro un `<iframe>` di terzi.

**Stato: costruita, non pubblicata in nessuno store.** Va aggiunta a mano. La metà della regola che
tocca la pagina è stata eseguita su un DOM finto — allarme fermato, trappola rimossa, avviso scritto
— e **mai in un browser vero**, che è la stessa frase dello store: senza pubblicazione non c'è
installazione, e senza installazione non c'è prova.

---

## 9. Aggiornamenti — `Core/Update/`, `tools/Firma/`

Firma ECDSA P-256 staccata, calcolata **sui byte esatti serviti**, mai su una riserializzazione. La
chiave privata non sta su nessun server e non entra nel repository (lo strumento si rifiuta di
scriverla lì dentro); il prodotto porta solo la metà pubblica.

Undici rifiuti in ordine, e ognuno può solo dire di no: spento, firma non valida, manifesto
illeggibile, versione illeggibile, **versione non più recente** (che è anche la difesa dal ritorno a
una vecchia), indirizzo non HTTPS, dimensione fuori scala, impronta malformata, lunghezza dichiarata
diversa, lunghezza reale diversa, impronta diversa.

`tools\Firma` **riverifica quello che ha appena scritto** con la funzione che gira dal cliente, e
pretende tre esiti: macchina vecchia → installa, macchina aggiornata → già aggiornata, **un bit
girato nella firma → rifiuta**.

Dopo **sette giorni** senza riuscire a raggiungere il manifesto il cruscotto smette di dire
«aggiornato» e dichiara il silenzio. L'ultimo contatto riuscito sta **su disco**, perché un contatore
in memoria si azzera a ogni riavvio e non raggiungerebbe mai la scadenza.

**Stato: attiva nel pacchetto pubblicato.** Provata da fuori: `0.1.5270 → Install → 0.1.5276`,
impronta corrispondente.

---

## 10. Free e Premium — `Licensing/FeatureGate.cs`

*«Free protegge, Premium risolve.»*

**Free**: rilevamento truffe senza limiti, protezione in tempo reale, estensione browser, stato reale
di Defender, avviso ransomware, controllo remoto, IBAN negli appunti.

**Premium**: analisi approfondita in cloud, copie dei file, ripristino.

Se il piano non è leggibile il prodotto sceglie **Free**: una build che non sa cosa è non deve
regalare funzioni a pagamento.

**Tre nomi Premium sono stati tolti** l'11 agosto 2026 — `ExtendedHistory`, `MultiDevice`,
`IdentityMonitoring`: ognuno aveva il suo messaggio di upgrade e nessuna riga che lo applicasse.
Due non potevano esistere qui (un account e un server che questo prodotto non ha; feed di violazioni
che nessuno regala). Il terzo si costruiva in un pomeriggio, **e costruirlo sarebbe stato peggio**:
oggi non c'è nessuna finestra di conservazione, ogni analisi resta e il cruscotto mostra le ultime
50, quindi «cronologia estesa» si vende solo *cancellando* prima quella di chi non paga. È il
contrario di «Free protegge, Premium risolve», e toglierebbe a un utente Free truffato proprio il
fascicolo per la denuncia, che si compone da quella cronologia.

Il test `EveryNameTheGateCanRefuse_IsRefusedSomewhere` tiene chiusa la porta: i nomi che il gate può
rifiutare sono esattamente tre, e accanto a ciascuno c'è scritto il file che lo applica.

### L'AI la porta l'utente — la tendina accanto a SCANSIONA

Quattro tipi di destinazione, e il perché sta in [ADR-0018](adr/ADR-0018-la-ai-la-porta-l-utente.md).

| voce | chi paga | cosa esce dal PC |
|---|---|---|
| Solo su questo PC | nessuno | niente |
| Un modello sul mio PC (Ollama) | nessuno | niente |
| Claude · ChatGPT · DeepSeek · Qwen | l'utente, al suo fornitore | il caso dubbio |
| Abbonamento CetrAI | noi | il caso dubbio |

Il predefinito di un'installazione nuova è **solo su questo PC**, e vale anche se il file della
scelta è assente o illeggibile.

**Serve una chiave API, non l'abbonamento alla chat.** ChatGPT Plus, Claude Pro, Gemini Advanced non
danno accesso a un programma. La finestra lo dice invece di lasciarlo scoprire.

**Tre regole**, e sono quelle che si verificano dall'esterno:

- **La scelta può solo restringere.** Nominare una destinazione senza chiave cambia una parola in un
  file e non manda niente — non ripiega su un'altra e non fallisce in modo che qualcuno debba
  occuparsene. Al canale locale parla qualsiasi processo dell'utente, quindi il peggio che ci si fa è
  far mandare fuori *meno*. Il test conta le chiamate all'analista, non il verdetto: fu proprio quel
  test a trovare che `solo su questo PC`, essendo una scelta che non fallisce mai, era finito
  nell'elenco delle «funzionanti» e quindi passava la guardia.
- **Nessuna richiesta può nominare un indirizzo.** Sul filo passa un valore di enum; gli indirizzi
  sono una tabella compilata dentro il prodotto.
- **La chiave viaggia solo in entrata.** Nessuna operazione del canale ne restituisce una.

**Dove finisce la chiave**, detto come sta: `%ProgramData%\CetrAI\chiavi.dat`, sigillata con DPAPI a
livello macchina — su un altro computer non si apre — e con i permessi ridotti a SYSTEM e agli
amministratori. A proteggerla è la cartella, non la parola «cifrato»: quello che il servizio sa
aprire per usarlo lo sa aprire anche un amministratore di quella macchina.

**Due difetti trovati eseguendo, contro un Ollama vero, il 17/08/2026:**

| cosa | misura |
|---|---|
| forma della risposta | il primo modello locale ha risposto `giudizio` e `motivazione` invece di `livello` e `motivi`. Solo Anthropic riceve uno schema; agli altri si chiede «un oggetto JSON», che promette la sintassi e non i nomi. Il prodotto avrebbe scartato **ogni** risposta |
| tempo | **346 s a freddo**, **137 s a caldo**, contro un timeout di 30 s. La voce locale avrebbe fallito sempre, in silenzio |

Il primo è chiuso scrivendo la forma a parole nel messaggio di sistema di quel percorso, con un test
che tiene legati i nomi chiesti a quelli letti; il secondo dando alla voce locale cinque minuti di
pazienza. Ne segue che la **prova** fatta in configurazione legge la risposta invece di contarla: una
prova ferma a «è arrivato del JSON» avrebbe detto «funziona» proprio al modello coi nomi sbagliati.

**Il nome del modello locale non lo scrive il prodotto.** La macchina di prova aveva quindici modelli
e nessuno si chiamava come il nome che stava per essere messo qui: si chiede a Ollama, saltando
quelli da embedding.

**Quello che non è misurato:** quanti utenti italiani non tecnici abbiano una chiave API. È la cifra
che decide se questa funzione serve a molti o a pochi.

**E la metà che non è stata eseguita:** la catena che parte dal cruscotto. Sostituire il servizio
installato con quello nuovo richiede una finestra da amministratore.

---|---|
| `"Profondita": "Fast"` | `Fast` |
| campo assente (copia installata prima della tendina) | `Thorough` |
| `"Profondita": "claude-opus-5"` | `Thorough` |

**Quello che non è misurato**, ed è scritto anche nel suggerimento della voce: di quanto la «veloce»
sia peggiore dell'approfondita sulla fascia ambigua non lo sa nessuno. Serve una chiave per
confrontarle sullo stesso insieme di casi. Fino ad allora la voce c'è e lo dichiara: un peggioramento
non misurato, a schermo, è indistinguibile da una buona risposta.

**E la metà che non è stata eseguita:** la catena che parte dal cruscotto. Sostituire il servizio
installato con quello nuovo richiede una finestra da amministratore, quindi il percorso
tendina → servizio → backend è provato solo dai test.

---

## 11. Cosa è spento, e perché

| cosa | perché |
|---|---|
| **Liste esterne di minacce** | Misurate e spente: URLhaus è un elenco di *pagine*, non di siti — bloccarne i domini avrebbe tolto `github.com` a tutti. Vale 10 domini su 155.927 |
| **Analisi approfondita in cloud** | Manca **un indirizzo pubblico**, non il codice: la catena intera gira su localhost (licenza valida → verdetto cambiato; licenza inventata → rifiutata dal server e verdetto locale intatto). Una build di rilascio **rifiuta** il trasporto diretto per costruzione, non per configurazione |
| **Esperienza condivisa** | Stesso indirizzo mancante. Di conseguenza la schermata di consenso non viene nemmeno compilata nel pacchetto: la domanda si fa solo quando esiste una risposta |
| **Estensione negli store** | Non pubblicata |
| **Firma del codice** | Nessun certificato EV: SmartScreen avvisa al primo avvio |
| **Cartelle ransomware personalizzate** | Solo quelle predefinite di Windows. Chi tiene il lavoro in `D:\Progetti` non è coperto |
| **Analisi approfondita per la navigazione** | `AllowedSources` non contiene `Browser`: quello che guardi nel browser **non esce mai**, e non è un'impostazione ma un elenco |

---

## 12. I numeri, col loro denominatore

| misura | valore | su cosa |
|---|---|---|
| Falsi allarmi | **0,032%** | 324 su 1.000.000 di siti veri (Tranco), 11 agosto 2026 — il 324° è `freethevbucks.com`, e il nome dice cosa promette: Tranco ordina per traffico, non per onestà |
| Conversazioni normali accusate | **0** | 4.827 messaggi veri |
| Phishing riconosciuto dove il catalogo conosce il marchio | **86,4%** | corpus OpenPhish — era 78,3% prima dei cinque marchi del 10 agosto |
| Phishing riconosciuto dove **non** lo conosce | **1,6%** | lo stesso corpus |
| Phishing attivo, indirizzo intero | **14,0%** | 300 indirizzi OpenPhish — era 7,67% |
| Truffe di compravendita | **5 su 5** | scritte a mano, con 5 legittimi somiglianti: 0 accusati |
| Truffe nei messaggi privati dei social | **10 su 12** | scritte a mano e analizzate dalla strada vera (`ForPrivateMessage`, ricerche di rete spente), con 8 mittenti veri difficili: 0 accusati. I due persi — il finto colloquio col file da eseguire e la truffa romantica — sono forme che un mittente onesto scrive uguali |
| Truffe di gioco che arrivano a parole | **11 su 19** | scritte a mano, con 16 messaggi veri che usano le stesse parole: 0 accusati. Era 7 su 7 su un corpus di sette casi scritti dalla stessa mano delle regole; sette degli otto persi restano persi per scelta, perché la frase è identica a quella di un amico |
| Le stesse truffe con un link dentro | **1 su 4** | era 0, e la diagnosi pubblicata («mancano i marchi in catalogo») era sbagliata: Roblox, Discord e Steam c'erano già, e `roblox-support.help` **da solo** prendeva 52. Dentro un messaggio prendeva zero perché `LinkFinder` non riconosceva `.help` come suffisso, quindi non vedeva l'indirizzo affatto. I tre persi hanno tre cause distinte, ognuna con la sua misura da fare prima |
| Test automatici | **890** | eseguiti il 13 agosto 2026 con gli avvisi trattati come errori, più le due regole in JavaScript che i test .NET non vedono (`tools\prova-supporto-falso.mjs`, `tools\prova-messaggi-privati.mjs`) |
| Tempo per verdetto | 0,041 ms | mediana, un thread |
| Memoria per verdetto | 4,7 KB | |
| Memoria del servizio | 18-20 MB all'avvio | il pacchetto non viene creato sopra i 24; 30 MB dopo 46 ore accese, di cui 4-7 di oggetti vivi |
| Allocazione a riposo, per lavoro di sfondo | sotto **7 MB l'ora** | ognuno pesato da solo sul cablaggio del prodotto (`ServiceWiring`), 10 agosto 2026 |

**L'1,6% è il numero che definisce il prodotto**, non l'86,4%: è il tetto di un motore a regole
fuori dalla conoscenza che ha. Chi valuta lo chiederà, ed è giusto che lo chieda.

### La memoria che si rifà, e come si è smesso di indovinare

Il servizio installato alloca **2,6 GB l'ora** stando fermo — tutto gen0, raccolto e rifatto, con la
memoria privata immobile a 30 MB e 4-7 MB di oggetti vivi. Costa circa 12 secondi di CPU l'ora (lo
0,33% di un core): un difetto vero, non un'emergenza. Per due settimane la caccia è consistita nel
leggere cicli e indovinare, e **le tre ipotesi più ovvie erano tutte sbagliate**:

| sospettato | quanto costa davvero |
|---|---|
| Il giro della lista dei processi, ogni 10 s | 0,26 MB a giro = 102 MB l'ora |
| Il sorvegliante delle cartelle personali | **0 eventi** in 3 minuti, 0 MB |
| Una richiesta di stato dal vassoio | 20 KB e 10 lavori nel pool (misurato con 3.000 richieste vere) |
| Una interrogazione WMI | 20 KB |

Il metodo che ha funzionato è stato smettere di leggere: il cablaggio del servizio è stato spostato
in `ServiceWiring` così che un banco costruisca **lo stesso prodotto** e accenda un lavoro di sfondo
per volta. Tutti sotto 0,2 MB l'ora tranne quello dei processi. E per sapere *di che cosa* fosse
fatta l'allocazione si è chiesto al runtime invece che al codice (`AllocationSample`, eventi
`AllocationTick` in-process): la risposta è stata `System.Diagnostics.ThreadInfo`, un oggetto per
ogni thread di ogni processo della macchina, costruito da `Process.GetProcesses()` per farci leggere
duecento nomi. Sostituito con la chiamata di Windows che dà i nomi e basta (`RunningPrograms`,
Toolhelp), quel lavoro è passato da **102 a 6,8 MB l'ora**.

Restavano gigabyte sulla copia installata che nessun lavoro pesato spiegava e che nessun profiler può
guardare — è un servizio che gira come la macchina. Perciò l'ultima misura la fa il prodotto da sé:
quando si accorge di allocare più di 200 MB l'ora, ascolta il runtime per un minuto e **scrive nel
registro i nomi dei tipi**, invece di lasciare un numero che invita a indovinare. È così che è
finita, l'11 agosto 2026: vedi «Chi allocava, detto dal runtime», più sotto.

### Il cruscotto in un processo suo

L'altra metà della memoria non sta nel servizio ma nell'icona, ed è più grande. Misurato sui processi
veri di questa macchina, in memoria privata:

| | privati | working set |
|---|---|---|
| icona che non ha mai aperto la finestra | 33 MB | — |
| la stessa icona dopo averla aperta una volta | **76 MB**, per sempre | 160 MB |
| una finestra WPF vuota con quaranta schede di testo | 42,8 MB | 97,8 MB |
| il cruscotto in un processo a parte | 64 MB **mentre è aperto** | 132 MB |

Chiudere la finestra non restituisce niente, e una raccolta compattante forzata rende due megabyte:
quello che Windows addebita a un processo è quasi il massimo che quel processo abbia mai chiesto. E
quasi tutto non è nostro — una finestra vuota pesa già 42,8. L'unica cosa che rende quella memoria è
**la fine del processo**, quindi la finestra è diventata un processo suo: si apre quando qualcuno la
chiede e sparisce quando la chiude. Quello che resta acceso sul computer di una persona tutto il
giorno è l'icona.

Rimisurato sul **prodotto installato** (0.1.5325, 11 agosto 2026), che è l'unica prova che conta:
vassoio 37,0 MB da solo, cruscotto 61,9 MB finché è aperto, e il vassoio resta a 37,0 dopo che la
finestra è stata aperta e chiusa — prima erano 76 MB per sempre. Aprirlo una seconda volta non avvia
un altro processo: il secondo esce con 0 e porta in primo piano la finestra che c'è già.

Due strumenti si sono rivelati bugiardi mentre si misurava, e valgono più della misura:
`Environment.TickCount64` conta anche il sonno pur chiamandosi «tick» (`AwakeClock` lo sostituisce:
un'ora dopo un risveglio il ritmo risultava un ventesimo del vero), e i «byte per lavoro nel pool»
sono una divisione, non una misura — restavano identici quando la macchina dormiva perché numeratore
e denominatore si fermavano insieme.

Lo stesso orologio ha prodotto un **falso allarme visibile all'utente**, ed è il difetto più grave
uscito da questa giornata. Il registro dei battiti (`Vitals`) serve proprio a non confondere «il
portatile era chiuso» con «il lavoro è morto», e la sua documentazione lo dice per esteso — ma il
valore predefinito del suo orologio era `Environment.TickCount64`, che il sonno lo conta. L'11 agosto
2026 questa macchina si è svegliata alle 11:25 dopo una notte sospesa e alle 11:38 ha scritto
«Protezione incompleta: da 14 ore la lista delle minacce non si aggiorna … riavvia il computer»,
tredici minuti dopo il risveglio. Ora l'orologio è un parametro **obbligatorio**: non c'è più un
valore predefinito su cui sbagliare, e il servizio passa `AwakeClock`.

E la correzione dell'orologio del ritmo era rimasta a metà, il che è peggio di non averla fatta:
`AwakeClock` era finito sull'**origine** dell'intervallo, mentre l'estremo che lo chiudeva veniva
ancora dal contatore che conta il sonno. La differenza fra i due orologi è **ogni ora che la macchina
ha dormito da quando è stata accesa**, non solo l'ultima notte, quindi la prima misura dopo un
risveglio esce divisa per quel totale più l'ora vera.

Misurato sul prodotto installato l'11 agosto 2026, e il numero è peggio della stima. Alle 11:43 il
registro diceva 3.946,6 MB allocati dall'avvio, alle 12:43 ne diceva 7.896,4: **3.949,8 MB in un'ora
sveglia**. La riga del ritmo, nello stesso istante, ne dichiarava **98,2** — un quarantesimo, perché
quella macchina aveva accumulato una quarantina di ore di sospensione dall'accensione. Sotto la
soglia di 200 che avvia la diagnosi: **taceva esattamente nelle mattine per cui era stata scritta.**
Ora l'aritmetica sta in `ChurnMeter`, che ha un solo orologio e non lo lascia scegliere a chi lo usa
— `FootprintWatch` non ha più nessun orologio proprio. Nessun test poteva vederlo: i due contatori
coincidono su una macchina che non dorme mai, cioè su qualunque macchina che esegua i test.

L'altra metà della stessa riga non è divisa da niente e quindi era già vera: **866 KB per lavoro nel
pool**, contro 793 KB misurati il giorno prima su un'altra sessione. Non qualcosa di raro ed enorme,
ma qualcosa che parte più di una volta al secondo e ogni volta chiede quasi un megabyte.

### Chi allocava, detto dal runtime

Corretto l'orologio, l'ora successiva ha superato la soglia (2.836 MB) e il servizio installato ha
ascoltato se stesso per un minuto:

```
13:44  23,9 MB di System.String
13:44   8,7 MB di System.Text.StringBuilder
13:44   7,6 MB di System.Char[]
13:44   2,6 MB di System.Text.Json.ArgumentState
13:44   2,2 MB di System.Text.Json.Arguments`4[String, String, Int64, DateTimeOffset]
```

L'ultima riga ha chiuso il caso in un minuto: `Arguments<…>` è quello che System.Text.Json costruisce
per invocare un **costruttore con parametri**, e `(string, string, long, DateTimeOffset)` in questo
prodotto è la firma di `SnapshotEntry` — una voce del manifesto delle copie di sicurezza. Nient'altro
nel repository ha quella forma.

Il percorso, una volta saputo dove guardare: il cruscotto chiede lo stato del ransomware ogni pochi
secondi → `RansomStatusNow()` chiede quale copia userebbe un ripristino → `MostRecentBefore()` chiama
`List()` → **`List()` leggeva e deserializzava per intero ogni manifesto** (367 voci l'uno) per
ricavarne tre numeri per copia: id, data e quanti file. **846 KB per richiesta, una richiesta al
secondo, 2.836 MB l'ora**, tutto raccolto subito dopo.

Un manifesto viene scritto quando la copia si prende e cancellato quando la copia si cancella: non
cambia mai. Quindi i due numeri si contano una volta per copia e si tengono. I fallimenti non si
tengono — un manifesto illeggibile *adesso* è un file bloccato per un istante, e «zero file» detto
per sempre a chi ha delle copie è la frase che questo archivio non può sbagliare. La prova nuova pesa
l'elenco contro la lettura di un manifesto e fallisce se qualcuno rimette il difetto: senza la
correzione, elencare costava 136 KB contro i 193 di leggere davvero.

---

## 13. Cosa manca — candidati, in ordine di quanto valgono

1. **Il catalogo, il resto del mondo.** Questa voce ha già cambiato nome due volte in due giorni, ed
   è la storia più istruttiva del progetto. Diceva «le esche non parlano francese né tedesco» e si
   chiamava il buco più economico da chiudere: le esche sono state aggiunte e misurate (15 parole
   entrate, 9 respinte, `sicherheit` fra queste) e il motore ha preso **esattamente gli stessi
   domini di prima**. Un'esca corrobora, non accusa, e non può corroborare un marchio che il
   prodotto non conosce. Aggiunti ANTAI, Ameli, Chronopost, Mondial Relay e Roblox, il phishing
   preso è passato da 403 a 470 domini e quello attivo dal 7,67% al 14,0%, con 7 falsi allarmi in
   più. Restano da fare gli altri paesi — e ogni candidato va **letto**, non contato: Sparkasse,
   Impots.gouv, Postbank e Fortnite sono stati provati e tolti perché accusavano rispettivamente le
   casse di risparmio tedesche, i fisci di quattro paesi africani, le banche postali di altri
   quattro e i fan site di un videogioco.
2. **Le cartelle sorvegliate sono solo quelle di Windows.** Dedurre quelle davvero usate invece di
   assumerle.
3. **Le tre funzioni Premium che non esistono.** Costruirle o toglierle: una funzione a pagamento che
   non c'è è la cosa peggiore da farsi trovare addosso.
4. **Il ponte con Defender guarda e basta.** Sa che la protezione in tempo reale è spenta e lo mostra;
   potrebbe riaccenderla, come già fa per le cartelle personali.
5. **Un modo per vedere che funziona senza aspettare una truffa.** L'EICAR esiste per questo: un
   indirizzo innocuo che il prodotto riconosce a comando.
6. **Il fascicolo dell'incidente.** Un file da allegare a una denuncia alla Polizia Postale: cosa è
   arrivato, quando, cosa è stato bloccato. Nessun concorrente lo fa, ed è quello che serve davvero a
   chi è stato truffato.
7. **La finestra a schermo intero «chiama Microsoft».** Forma riconoscibile, ma vive nel contenuto
   della pagina: lavoro sull'estensione, non sul motore.
8. **Il QR code delle bollette false.** Canale in crescita in Italia; su PC significa analizzare
   un'immagine incollata.

E due cose che non sono codice: certificato EV e validazione da un laboratorio terzo
(AV-Comparatives, AV-TEST).

### Il corpus italiano di messaggi — `tests/corpora/messaggi-italiani.txt`

Era la terza voce di questo elenco: il motore sui messaggi era misurato su 4.827 SMS britannici del
2011, cioè su un altro paese e un altro decennio. «Zero falsi allarmi» su quel corpus è vero e non
dice niente sull'Italia, dove i messaggi parlano di SPID, di giacenze, di verbali e di PagoPA.

**La provenienza prima del numero: 124 messaggi scritti qui, non raccolti.** Non è un campione, e un
corpus scritto da chi ha scritto le regole contiene solo gli errori a cui quella persona ha già
pensato — è la ragione per cui il prodotto continua a misurarsi su Tranco e su OpenPhish. Le 50
truffe seguono i temi che CERT-AgID riporta per l'Italia; le 74 conversazioni normali sono scritte
per essere difficili, con la fretta, i soldi, i link e le stesse parole delle campagne, perché le
usano anche i mittenti onesti.

**Il valore non è la percentuale: è la lista dei mancati.** Dei diciassette che passavano senza un
graffio, dieci non facevano scattare *niente* — e non erano casi limite, erano le truffe che in
Italia costano di più, nessuna delle quali contiene un link. Da lì sono usciti sei segnali nuovi
(`MSG_OTP_HANDOVER` 45, `MSG_SAFE_ACCOUNT` 45, `MSG_REMOTE_HELP` 45, `MSG_CARD_PHOTO` 30,
`MSG_FAKE_INFECTION` 30, `MSG_NEW_NUMBER_MONEY` 30).

| | truffe prese (soglia 25) | conversazioni vere accusate |
|---|---|---|
| prima | 66% (33/50) | 2 su 74 |
| dopo | **98% (49/50)** | **1 su 74** |

Sul corpus inglese di 5.574 SMS veri, misurato nello stesso momento, non è peggiorato niente: una
conversazione accusata prima, una dopo.

**Due correzioni che valgono più dei sei segnali.** `MSG_IBAN` pesava 25, cioè esattamente la soglia:
bastava un IBAN perché il prodotto gridasse, e l'unica conversazione vera accusata era «ti mando
l'IBAN per il regalo di Luca». Un IBAN in un messaggio lo manda chiunque abbia diviso una cena: ora
vale 20 e corrobora. E «in giacenza», aggiunto al vocabolario delle esche perché è il tema più
frequente delle campagne italiane, è stato tolto un'ora dopo: è anche la prima riga dell'avviso vero
di Poste, che ne manda milioni, e accusava «la raccomandata 15AB è in giacenza presso l'ufficio di
Via Verdi 3».

Il pavimento sta in `ItalianCorpusTests` e sotto i valori misurati, non sopra: serve a far fallire
una modifica che peggiora, non a certificare che oggi è perfetto.
