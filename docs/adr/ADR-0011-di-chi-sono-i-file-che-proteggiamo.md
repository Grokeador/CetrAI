# ADR-0011 — Di chi sono i file che proteggiamo

- **Stato:** Accettata
- **Data:** 2026-07-28

## Contesto

La protezione ransomware sorveglia «le cartelle personali». Le risolveva con
`Environment.GetFolderPath`, che risponde **per l'account che esegue il processo**.

In sviluppo il servizio è un'applicazione console avviata dall'utente: la risposta era giusta e
tutto sembrava funzionare — 60 file cifrati, rilevato, congelato, ripristinato, test verdi.

Installato, il servizio gira come **LocalSystem**. Per quell'account "Documenti" è
`C:\Windows\system32\config\systemprofile\Documents`, che non esiste. Il codice scartava le cartelle
inesistenti e restituiva una lista **vuota**: nessuna cartella, nessun errore, nessuna riga di
registro. Il prodotto installato avrebbe sorvegliato il nulla, in silenzio, proprio sulle macchine
dove serviva.

Lo stesso vale per ciò che il prodotto tiene da parte: `LocalApplicationData` per LocalSystem sta
dentro la cartella di Windows, in un posto dove il cruscotto e `cetrai` — che girano come l'utente —
non guarderebbero mai. Le copie dei documenti di qualcuno sarebbero finite dove nessuno può
trovarle, e ogni promessa fatta su quella cartella sarebbe stata fatta sulla cartella sbagliata.

**Nessun test poteva vederlo:** i test girano come l'utente, ed è il cambio di account a rompere
tutto. È lo stesso motivo per cui l'MSI che non si avviava è passato sotto 277 test verdi.

## Decisione

### 1. Se siamo la macchina, chiediamo al registro di chi sono i file

`WindowsUserFolders` distingue i due casi:

- **processo di una persona** → le cartelle di quell'account, come prima;
- **processo della macchina** (LocalSystem) → le cartelle di **ogni utente vero**, lette da
  `HKLM\...\ProfileList` per i profili e da `HKU\<SID>\...\User Shell Folders` per le cartelle.

Si leggono le cartelle *redirette*, non i nomi convenzionali. Su questa macchina di sviluppo i
Documenti sono `C:\Users\jorge\OneDrive\Documentos`: OneDrive sposta le cartelle personali per
impostazione predefinita, quindi `<profilo>\Documents` — la scelta ovvia — avrebbe protetto una
cartella vuota mentre i file veri stavano altrove.

Sono esclusi i profili di SYSTEM, LOCAL SERVICE e NETWORK SERVICE: hanno un profilo anche loro, e
nessuno ci tiene documenti.

### 2. Una sola cartella per lo stato, `%ProgramData%\CetrAI`

Non i dati locali dell'utente. È lo stesso percorso per il servizio e per uno strumento che l'utente
lancia a mano, ed è quello che li tiene d'accordo senza che nessuno debba ricordarsene. I permessi
predefiniti di ProgramData sono anche quelli giusti per l'archivio delle copie: ciò che SYSTEM crea
lì, i programmi dell'utente non lo riscrivono ([ADR-0008](ADR-0008-copie-che-sopravvivono-all-attacco.md)).

Sostituisce `%LOCALAPPDATA%\CetrAI` in [ADR-0009](ADR-0009-come-si-installa.md): la
disinstallazione non deve cancellare **questa**.

### 3. Sorvegliare niente non è più silenzioso

Il servizio scrive quante cartelle sta sorvegliando, e se sono zero lo scrive come **errore**. Metà
del difetto era che la lista vuota si comportava esattamente come una lista piena.

### 4. La lista si ricalcola finché non trova qualcosa

Il servizio parte all'avvio del computer, **prima che qualcuno abbia fatto l'accesso**, e il registro
di un utente che non c'è ancora non è caricato. Risolta una volta sola all'avvio, la lista sarebbe
rimasta vuota per il resto della giornata. Ora, finché è vuota, viene ricalcolata a ogni giro del
minuto.

## Conseguenze

- Il servizio installato sorveglia i file veri di tutti gli utenti della macchina, comprese le
  cartelle spostate su OneDrive.
- Un utente che non ha mai fatto l'accesso da quando il servizio è partito, e che ha le cartelle
  redirette, resta scoperto finché non entra: il suo registro non è leggibile. Accettato: entra e
  viene coperto entro un minuto.
- **Provato:** l'enumerazione dei profili gira come utente normale ed è coperta dai test
  (`tests/CetrAI.Platform.Tests`) — è la strada che prima falliva in silenzio. Il servizio
  avviato scrive «Sorveglianza attiva su 5 cartelle personali» e crea il suo stato in
  `C:\ProgramData\CetrAI`. Resta non provato il caso vero come LocalSystem: serve installare
  l'MSI, ed è la stessa prova che manca a [ADR-0009](ADR-0009-come-si-installa.md).
