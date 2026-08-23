# ADR-0013 — Come si aggiorna il prodotto

- **Stato:** Accettata
- **Data:** 2026-07-28

## Contesto

Il [modello di minaccia](../modello-di-minaccia.md) mette al primo posto, fra le cose che mancano,
una che non è una funzione: **non esisteva un modo di aggiornare il prodotto**. Un difetto trovato
dopo l'installazione sarebbe rimasto sulla macchina del cliente per sempre.

Per un prodotto di sicurezza è peggio che per un altro. Chi lo installa smette di guardare: il
programma sta lì, dice che va tutto bene, e invecchia. Ogni difetto che troveremo — e questo mese ne
abbiamo trovati sei — resterebbe su ogni macchina dove il prodotto è già stato installato.

Ma è anche la superficie più pericolosa che il prodotto possa avere. Un aggiornamento è un programma
che il servizio installa **come LocalSystem**: chi riesce a farci accettare un pacchetto possiede
ogni macchina su cui CetrAI è installato. Vale la pena scriverlo per esteso, perché decide tutto
il resto: *il canale di aggiornamento è il modo più efficiente per compromettere in blocco tutti i
clienti di un prodotto di sicurezza*, e succede davvero.

## Decisione

### 1. Il manifesto è firmato, e HTTPS non basta

HTTPS dimostra **chi ha servito** il file, non **chi lo ha scritto**. Un host web compromesso, un
certificato emesso per errore, un dominio scaduto e ricomprato: tutte cose che succedono, e tutte
sufficienti se la difesa fosse solo il trasporto.

Il manifesto porta una firma staccata, fatta con una chiave privata che **non tocca mai un server
web**. Il prodotto porta solo la metà pubblica. ECDSA su P-256 perché è nel framework: un prodotto
di sicurezza non è il posto dove qualcuno si scrive la crittografia a mano.

### 2. La firma copre i byte serviti, non l'oggetto riletto

Due documenti JSON che si leggono allo stesso modo non hanno gli stessi byte. Verificare dopo aver
riscritto il manifesto permetterebbe di firmarne uno e consegnarne un altro.

### 3. Ogni regola è un rifiuto

- **Senza chiave pubblica non si accetta niente.** Un prodotto che accetterebbe qualunque cosa
  perché qualcuno si è dimenticato di configurare la chiave è peggio di un prodotto che non si
  aggiorna.
- **Una versione più vecchia non si installa.** Non è "niente da fare": è un vecchio manifesto
  **nostro**, ripubblicato al momento giusto, per rimettere una versione di cui si conoscono i
  difetti. Un attacco di downgrade porta la nostra firma; l'unica cosa che lo distingue è il numero
  di versione.
- **Solo HTTPS**, dimensione entro un tetto, impronta ben formata.
- **L'impronta lega il pacchetto al manifesto.** Senza, la firma proverebbe soltanto che qualcuno
  ha firmato un indirizzo — e l'indirizzo può servire un file diverso domani.

### 4. Spento finché non c'è una chiave

Il valore distribuito è `Enabled: false`, e il servizio **lo dice a ogni avvio**: una macchina che
non riceverà correzioni non deve scoprirlo dopo. Non è una funzione facoltativa: è una funzione che
non deve potersi accendere per sbaglio prima che esista una chiave la cui metà privata sta dove
nessun server web arriva.

### 5. L'installazione è staccata dal servizio

Il pacchetto ferma il servizio per sostituirlo. Un processo figlio che morisse col padre lascerebbe
la macchina a metà aggiornamento.

### 6. Nessun pulsante, ma lo stato è visibile

Non esiste un «aggiorna adesso» e non deve esistere: una correzione di sicurezza che aspetta che
qualcuno noti un pulsante è una correzione che non è installata. Il controllo è ogni 24 ore,
l'installazione è silenziosa, e all'utente non viene chiesto niente — nemmeno un riavvio.

Quello che l'utente deve poter vedere è **se sta accadendo**. Nel cruscotto, sotto il pulsante della
scansione, una riga con un punto colorato: verde «si aggiorna da solo», ambra «aggiornamenti non ancora
attivi», ambra «non riesco a controllare gli aggiornamenti» (punto 7), ciano mentre una versione si
sta installando. Il testo lungo — perché non è attivo, cosa è stato rifiutato, da quanti giorni non
si riesce a guardare — sta nel suggerimento del mouse.

Questo è deliberatamente l'opposto di un segno di spunta rassicurante: finché mancano la chiave e il
posto da cui pubblicare, la riga è **ambra**, su ogni macchina, ogni volta che si apre la finestra. Una
lacuna che si vede è una lacuna che qualcuno chiude.

### 7. Il silenzio ha una scadenza

Un controllo che non riesce non è un errore: la macchina può essere spenta o senza rete, e si
riprova domani. Ma **restava tale per sempre**: il controllo fallito usciva subito e lasciava lo
stato com'era, così una macchina che non contattava il server da mesi mostrava al cruscotto la
stessa riga verde di una che aveva guardato stamattina.

Dopo sette tentativi quotidiani a vuoto la riga diventa ambra e dice che non si riesce a
controllare, con da quanti giorni. Sette e non uno: un portatile chiuso per una settimana è offline,
non abbandonato, e un avviso che scattasse a ogni vacanza insegnerebbe a chiuderlo senza leggerlo.

Il momento dell'ultimo contatto sta **su disco** (`updates\ultimo-contatto`) e non in memoria, perché
il servizio riparte con la macchina: un contatore azzerato a ogni riavvio non arriverebbe mai a sette
giorni su un computer che di notte si spegne, cioè su ogni computer per cui questo prodotto è fatto.

## Dove si pubblica: una release di GitHub

Il repository pubblico che porta già il pacchetto di valutazione porta anche il manifesto. Tre
allegati per ogni versione, sotto l'indirizzo stabile `releases/latest/download/`:

```
aggiornamento.json        il manifesto
aggiornamento.json.firma  la firma staccata (il prodotto aggiunge «.firma» da sé)
CetrAI-x.y.z-x64.msi  il pacchetto
```

**Il manifesto sta su un puntatore che si muove, il pacchetto su uno fisso.** Il prodotto legge il
manifesto da `releases/latest/download/`, che è l'unico indirizzo che può restare scritto dentro un
pacchetto costruito mesi prima. L'indirizzo del pacchetto dentro il manifesto è invece ancorato al
tag (`releases/download/v0.1.5248/…`): fra il momento in cui una macchina legge il manifesto e quello
in cui scarica possono passare minuti, e se in mezzo esce una versione nuova un indirizzo `latest`
consegnerebbe un file diverso da quello di cui il manifesto porta l'impronta. Con il tag, quel caso
non consegna il file sbagliato: dà 404, il controllo fallisce e si riprova domani.

**Quello che GitHub può e non può fare** — è il «quasi» della frase qui sopra, scritto per esteso.
Chi controlla l'account, o GitHub stesso, può servire un manifesto qualunque: senza la chiave privata
nessuno di quei manifesti viene accettato, e il peggio che ottiene è **non farci aggiornare**. Il
punto 3 copre il vecchio manifesto ripubblicato; il punto 7 copre il silenzio, che era l'unico dei
due attacchi che nessuno avrebbe visto. Non copre nulla il caso in cui la chiave privata esca da qui:
per questo non sta nel repository, non sta nei secret delle Actions, e lo strumento che la genera si
**rifiuta** di scriverla dentro l'albero del sorgente.

### Come si pubblica

```
tools\Firma chiave %USERPROFILE%\.cetrai\firma-aggiornamenti.pem      (una volta sola)
installer\build.ps1 -Aggiornamenti <url del manifesto> -ChiavePubblica <base64>
tools\Firma manifesto --pacchetto <msi> --indirizzo <url del pacchetto> --chiave <pem>
```

`manifesto` non si limita a firmare: rilegge quello che ha scritto con `UpdatePolicy` — la stessa
funzione che gira dal cliente — e stampa tre decisioni che devono essere *installa*, *già aggiornato*
e *rifiuto della firma manomessa*. Se una delle tre non torna, esce con errore e dice di non
pubblicare.

Dopo il caricamento degli allegati, `tools\Firma verifica --da <url> --chiave-pubblica <base64>
--completo` chiede a GitHub esattamente quello che chiederebbe il prodotto, scarica il pacchetto e ne
ricontrolla impronta e dimensione. Il nome di un allegato, il reindirizzamento di
`releases/latest/download` e il suffisso `.firma` sono tre cose che nessun test vede.

## Cosa serve ancora

1. **Chi custodisce la chiave privata.** Deve stare offline, meglio su un token hardware. Se si
   perde, i clienti installati non ricevono più niente; se si ruba, si perdono i clienti.
2. **Il certificato di firma del codice** è un'altra cosa ancora e serve comunque: la firma del
   manifesto protegge dal pacchetto falso, la firma Authenticode toglie l'avviso di SmartScreen al
   momento dell'installazione ([ADR-0009](ADR-0009-come-si-installa.md)). Le due cose sono
   indipendenti: l'aggiornamento automatico si può accendere prima, perché il servizio scarica da sé
   e installa come LocalSystem, dove SmartScreen non interviene.

## Conseguenze

- **Provato:** la decisione — la parte pericolosa — è una funzione pura, ed è coperta da 22 casi con
  chiavi vere generate nel test: pacchetto firmato da un altro, manifesto modificato dopo la firma,
  nessuna chiave, downgrade con la nostra firma, pacchetto non su HTTPS, dimensioni e impronte
  malformate, e il silenzio che scade. Il servizio avviato dice che l'aggiornamento non è
  configurato. La firma è provata anche fuori dai test: `tools\Firma manifesto` genera una chiave
  vera, firma, riverifica e manomette, e si rifiuta di dire «fatto» se una delle tre risposte cambia.
- **Non provato:** nessun `msiexec` è ancora stato eseguito da qui, e nessun aggiornamento è mai
  arrivato a una macchina installata. È la voce che si chiude solo pubblicando una versione e
  guardandola arrivare su un secondo PC — non con un test.
- **Manca ancora:** nessun ritorno indietro automatico se un aggiornamento rompe qualcosa, e nessuna
  distribuzione graduale — oggi un pacchetto sbagliato arriverebbe a tutti insieme.
