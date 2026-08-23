# ADR-0001 — CetrAI affianca Windows Defender, non lo sostituisce

- **Stato:** Accettata
- **Data:** 2026-07-26

## Contesto

Il prodotto nasce per il mercato consumer italiano. Microsoft Defender è preinstallato su ogni PC
Windows, è gratuito e nei test indipendenti raggiunge circa il 98,5% di rilevamento, contro il
~99,5% dei leader a pagamento. Il divario di detection pura è quindi marginale.

Registrarsi come antivirus primario (e mettere Defender in modalità passiva) richiede l'adesione al
**Microsoft Virus Initiative**, che comporta:

- accordo di riservatezza e licenza con Microsoft;
- reputazione già consolidata nel settore antimalware, dimostrata da certificazioni indipendenti
  (AV-Comparatives, OPSWAT) e presenza nel settore;
- certificazione **WHQL** per ogni singola release del driver kernel.

Per un nuovo entrante si tratta di anni di percorso, non di mesi.

## Decisione

CetrAI **non** si registra come antivirus. Defender resta il motore antimalware del sistema.
CetrAI opera come livello complementare e copre ciò che Defender non fa:

1. truffe localizzate italiane (PEC con finte fatture, SPID, PagoPA, rimborsi IRPEF);
2. anti-phishing su qualsiasi browser, non solo su Edge;
3. attivazione e orchestrazione delle difese anti-ransomware presenti in Windows ma disattivate,
   con ripristino dei file.

Tutte le funzioni dell'MVP si realizzano con **API Windows documentate in user-mode**, senza driver
kernel: il blocco di rete usa `FwpmFilterAdd0` (fwpmu.h) sul layer `ALE_AUTH_CONNECT`, i callout
driver servono solo per la deep packet inspection, che non ci serve.

## Conseguenze

**Positive**

- Nessun requisito MVI, nessuna certificazione WHQL, nessun driver kernel: time-to-market in mesi.
- Nessun conflitto tra due motori antivirus in tempo reale, quindi nessun impatto sulle prestazioni.
- Il posizionamento commerciale diventa chiaro e non competitivo con il prodotto gratuito già
  installato: *"Windows ti protegge dai virus, CetrAI dalle truffe"*.
- Neutralizza l'obiezione "ho già Defender gratis" invece di scontrarsi con essa.

**Negative**

- Non possiamo dichiararci "antivirus" né partecipare ai test comparativi classici (fase 5).
- Dipendiamo dalla stabilità di API di terze parti (CFA, ETW, WFP) tra le versioni di Windows.
- Il valore percepito va costruito con la comunicazione: l'utente deve capire *perché* serve un
  livello in più.

## Alternative scartate

- **Costruire un motore antivirus proprio.** Competere sul terreno dove i leader hanno vent'anni di
  vantaggio, con barriere di certificazione insormontabili per un nuovo entrante.
- **Licenziare un motore antivirus di terze parti.** Costo per licenza su un prodotto freemium, e
  soprattutto duplicherebbe una protezione che l'utente ha già gratis: nessun valore aggiunto.
