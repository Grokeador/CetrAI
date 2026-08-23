# ADR-0007 — Riconoscere la cifratura di massa senza conoscere il malware

- **Stato:** Accettata
- **Data:** 2026-07-27

## Contesto

Riconoscere un ransomware dalla firma è il mestiere di Defender, e lo fa bene. Ciò che una firma non
può fare è riconoscere una famiglia che nessuno ha ancora visto — ed è esattamente il caso che rovina
la giornata a qualcuno.

Quello che tutte le famiglie hanno in comune non è il codice ma il **comportamento**: in un paio di
minuti riscrivono centinaia di file personali sparsi su più cartelle, e dopo quei file non sono più
ciò che il loro nome dice.

La difficoltà non è accorgersene. È accorgersene **senza fermare i programmi onesti**, perché il
software legittimo fa pezzi della stessa cosa:

| Programma onesto | Cosa fa che assomiglia a un attacco |
|---|---|
| Convertitore di foto | riscrive 200 file in pochi secondi |
| Programma di backup | tocca l'intera cartella personale |
| Compressore (7-Zip, WinRAR) | produce contenuto ad alta entropia, di proposito |
| Sincronizzazione cloud | scrive di continuo in molte cartelle |

Un prodotto che blocca uno di questi è peggio di uno che non fa niente: viene disinstallato, e si
porta via anche la protezione anti-truffa che funzionava.

## Decisione

**Nessun segnale da solo può dare l'allarme.** Un attacco richiede tre cose insieme:

1. **Volume** — almeno 25 file distinti in due minuti.
2. **Ampiezza** — almeno 3 cartelle diverse.
3. **Prova che i file non siano più leggibili** — il contenuto non corrisponde più al tipo, oppure
   l'estensione è una di quelle da riscatto.

L'ampiezza è ciò che separa il convertitore dall'attacco: chi converte le foto lavora nella cartella
dove stanno le foto. Un ransomware non ha motivo di fermarsi a una cartella, e non lo fa.

Esiste una sola scorciatoia: la **richiesta di riscatto in più cartelle**. Nessun programma onesto
scrive "come decifrare i tuoi file" in Documenti e Immagini nello stesso momento.

### La misura che ha cambiato la regola

"Riconosciamo l'attacco" non vale niente senza un numero attaccato, ed è la prima cosa che chiede
chiunque conosca il campo. Misurato a ogni esecuzione dei test: **quanti file l'attacco tocca prima
dell'allarme**.

La prima misura ha mostrato un difetto che il ragionamento non aveva visto. Un attacco che procede
**cartella per cartella** — la forma più comune — restava non riconosciuto fino all'**81° file**,
perché l'ampiezza arriva solo alla terza cartella. Ottantuno file per una regola scritta per non
accusare un convertitore di foto.

Ma il convertitore non è ciò che quella soglia intercetta. **Un convertitore scrive file validi**: il
suo risultato è un vero JPEG. Venti file di fila il cui contenuto non corrisponde più al proprio nome
non sono un programma che lavora male, sono un programma che sostituisce contenuti. Quindi quella
prova da sola basta, senza pretendere anche l'ampiezza.

| Forma dell'attacco | Osservazione | Allarme (prima) | Allarme (ora) |
|---|---:|---:|---:|
| Cartella per cartella, 5 cartelle | 5 file | 81 file | **25 file** |
| Sparso su 5 cartelle | 5 file | 25 file | **25 file** |
| Sparso su 3 cartelle | 5 file | 25 file | **25 file** |
| Con rinomina in `.locked` | 5 file | 25 file | **25 file** |

I test sui programmi onesti — convertitore, backup, compressore — restano verdi: dipendono dal
contenuto *valido*, che questa soglia non tocca.

**Il numero che conta per l'utente non è però questo.** Un file danneggiato torna indietro
dall'archivio; ciò che non torna è il lavoro fatto *dopo* l'ultima copia. L'esposizione vera è
l'intervallo fra le copie, ed è per accorciarlo nell'unico momento in cui conta che esiste la regola
della fretta di [ADR-0008](ADR-0008-copie-che-sopravvivono-all-attacco.md): al primo segnale di
attività insolita — cioè al 5° file, non al 25° — si copia subito.

### Perché non l'entropia

L'entropia sarebbe la misura ovvia ed è una misura pessima: un JPEG, un MP4 e uno ZIP sono già
indistinguibili da dati casuali, quindi metà della cartella personale sembrerebbe cifrata in
permanenza.

Il controllo usato è il **numero magico del formato**: un `.docx` comincia per `PK`, un PDF per
`%PDF`, un JPEG per `FF D8 FF`. Se non comincia più così, il contenuto è stato sostituito — e non c'è
modo di sbagliarsi su un formato compresso. L'entropia rientra solo dove non c'è numero magico ma il
formato promette testo leggibile (`.txt`, `.csv`, `.log`, `.xml`): un file di testo con 7,9 bit per
byte non è un file di testo.

È anche il segnale che il ransomware non può evitare. Rinominare i file è una sua scelta, e diverse
famiglie **non** lo fanno apposta, così in Esplora risorse non sembra cambiato niente finché l'utente
non apre qualcosa. Riscrivere il contenuto invece deve farlo per forza.

## Conseguenze e limiti dichiarati

- **Non sappiamo quale programma lo sta facendo.** In user mode Windows dice che un file è cambiato,
  non chi l'ha cambiato. Servirebbe una sessione ETW kernel-file o un minifiltro con driver firmato
  WHQL, fuori portata oggi ([vincoli noti](ADR-0001-complementare-a-defender.md)). Riconosciamo che
  l'attacco è in corso e quanto è arrivato lontano; fermare *quel* processo è un problema separato.
  Dichiararlo risolto sarebbe il tipo di affermazione che crolla davanti a chi conosce Windows.
- **`FileSystemWatcher` perde eventi** quando arrivano più in fretta di quanto vengano letti — cioè
  proprio durante una cifratura di massa. Il buffer è al massimo pratico (64 KB) e l'overflow non
  viene ingoiato: un'attività troppo rapida da seguire è essa stessa un segnale.
- **Non è il rilevatore a decidere cosa fare.** Riporta un livello. Il ripristino dei file e
  l'eventuale intervento sul processo sono i prossimi due passi della Fase 4.
- La regola è una funzione pura su un elenco di modifiche: si prova senza cifrare niente e senza una
  macchina da rovinare. La suite ha 24 casi, metà dei quali sono programmi onesti che **non** devono
  far scattare l'allarme.
- Verificata end-to-end su una cartella usa e getta: 60 documenti riscritti su 5 cartelle passano da
  *osservazione* ad *attacco* con 49 file riconosciuti come non più corrispondenti al tipo.

## Alternative scartate

- **Entropia come segnale principale.** Metà dei file personali è già ad alta entropia. Falsi
  positivi garantiti su ogni cartella di foto.
- **Elenco di estensioni note da riscatto.** Utile come conferma, inutile da solo: le estensioni
  cambiano a ogni campagna e molte famiglie non rinominano affatto.
- **Bloccare al primo segnale, per sicurezza.** È il modo di fermare il convertitore di foto
  dell'utente e farsi disinstallare. L'asimmetria è la stessa del resto del prodotto.
- **Aspettare un minifiltro firmato per fare qualcosa.** Rimanderebbe la funzione di mesi per avere
  l'attribuzione del processo. Sapere che un attacco è in corso vale già oggi, se lo si dice per
  quello che è.
