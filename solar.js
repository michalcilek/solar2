/***********************
 *  VYLEPŠENÝ SOLAR.JS
 *  - layout pro mobil 9:16
 **********************/

// Seznam dostupných modelů MPPT (SmartSolar)
const mpptList = [
  { model: "SmartSolar 100/20",   maxVoc: 100, maxIsc: 20 },
  { model: "SmartSolar 150/35",   maxVoc: 150, maxIsc: 35 },
  { model: "SmartSolar 150/45",   maxVoc: 150, maxIsc: 45 },
  { model: "SmartSolar 150/60",   maxVoc: 150, maxIsc: 60 },
  { model: "SmartSolar 150/70",   maxVoc: 150, maxIsc: 70 },
  { model: "SmartSolar 150/85",   maxVoc: 150, maxIsc: 85 },
  { model: "SmartSolar 150/100",  maxVoc: 150, maxIsc: 100 },
  { model: "SmartSolar 250/60",   maxVoc: 250, maxIsc: 60 },
  { model: "SmartSolar 250/70",   maxVoc: 250, maxIsc: 70 },
  { model: "SmartSolar 250/85",   maxVoc: 250, maxIsc: 85 },
  { model: "SmartSolar 250/100",  maxVoc: 250, maxIsc: 100 }
];

// Konstantní napětí baterie
const baterieNapeti = 48; 

// Globální proměnné pro vstupní prvky:
let inpPanelCount; 
let selMPPT;

// Parametry panelu:
let inpPanelVykon;
let inpPanelVoc;
let inpPanelIsc;
let inpPanelVmp;
let inpPanelImp;
let inpAlphaVoc;

// Proměnné pro výstup:
let resultP; // P5 element, kam budeme vypisovat výsledky

function setup() {
  // Nepotřebujeme plátno pro kreslení, jen DOM rozhraní
  noCanvas();

  // Hlavní kontejner (použijeme style pro mobil-friendly layout)
  // maxWidth 320-400px je vhodné pro mobilní zobrazení, 
  // margin: auto vycentruje pro desktop
  let container = createDiv().style('width','95%')
                             .style('max-width','400px')
                             .style('margin','0 auto')
                             .style('font-size','16px')
                             .style('font-family','sans-serif');

  // 1) Baterie nahoře, zarovnáme doleva
  createP("Baterie: " + baterieNapeti + " V (konstantní)")
    .parent(container)
    .style('font-weight','bold')
    .style('margin','0 0 1em 0');

  // 2) Řádek pro "Počet panelů" a "Vyber MPPT"
  //    Dáme je pod sebe, aby to bylo přehledné v mobilu
  let row1 = createDiv().parent(container).style('margin','0 0 1em 0');
  
  createSpan("Počet panelů: ").parent(row1);
  inpPanelCount = createInput('36')
    .parent(row1)
    .style('width','60px')
    .style('margin-left','5px');

  createSpan("  Vyber MPPT model: ").parent(row1).style('margin-left','10px');
  selMPPT = createSelect().parent(row1);
  // Naplníme dropdown
  mpptList.forEach((reg) => {
    selMPPT.option(reg.model);
  });
  selMPPT.selected('SmartSolar 150/70'); // Výchozí

  // 3) Parametry panelu:
  createP("Parametry jednoho panelu:")
    .parent(container)
    .style('margin','0 0 0.5em 0')
    .style('font-weight','bold');

  // Vytvoříme svislou kolonku vstupů
  let panelParams = createDiv().parent(container).style('margin-bottom','1em');

  // Malá pomocná funkce:
  function addLabelInput(labelText, defaultVal) {
    let row = createDiv().parent(panelParams)
        .style('display','flex')
        .style('justify-content','space-between')
        .style('margin-bottom','4px');
    createSpan(labelText).parent(row);
    let inp = createInput(defaultVal).parent(row).style('width','60px');
    return inp;
  }

  inpPanelVykon = addLabelInput("Výkon (W)", "410.0");
  inpPanelVoc   = addLabelInput("Voc (V)", "37.60");
  inpPanelIsc   = addLabelInput("Isc (A)", "13.89");
  inpPanelVmp   = addLabelInput("Vmp (V)", "31.30");
  inpPanelImp   = addLabelInput("Imp (A)", "13.10");
  inpAlphaVoc   = addLabelInput("α Voc (např. -0.003)", "-0.003");

  // 4) Výsledky
  resultP = createP("").parent(container)
    .style('background','#f7f7f7')
    .style('border','1px solid #ddd')
    .style('padding','1em');

  // Po zmene vstupu budeme rovnou počítat
  inpPanelCount.input(updateCalc);
  selMPPT.changed(updateCalc);
  inpPanelVykon.input(updateCalc);
  inpPanelVoc.input(updateCalc);
  inpPanelIsc.input(updateCalc);
  inpPanelVmp.input(updateCalc);
  inpPanelImp.input(updateCalc);
  inpAlphaVoc.input(updateCalc);

  // Provedeme 1. výpočet
  updateCalc();
}

function draw() {
  // nepotřebujeme draw, nic nekreslíme
}

// Hlavní funkce pro výpočet a zobrazení
function updateCalc() {
  // 1) Načíst vstupy
  let numPanels = parseInt(inpPanelCount.value());
  if (isNaN(numPanels) || numPanels < 1) {
    resultP.html("Zadejte platný počet panelů (celé kladné číslo).");
    return;
  }

  let chosenModel = selMPPT.value();
  let sel = mpptList.find(m => m.model === chosenModel);
  if (!sel) {
    resultP.html("Chyba: Zvolený MPPT model nebyl nalezen.");
    return;
  }

  let panel_vykon = parseFloat(inpPanelVykon.value());
  let panel_Voc   = parseFloat(inpPanelVoc.value());
  let panel_Isc   = parseFloat(inpPanelIsc.value());
  let panel_Vmp   = parseFloat(inpPanelVmp.value());
  let panel_Imp   = parseFloat(inpPanelImp.value());
  let alphaVoc    = parseFloat(inpAlphaVoc.value());

  // 2) Výpočet Voc při -20°C
  let tempLow = -20;
  let vocColdOnePanel = panel_Voc * (1 + alphaVoc*(tempLow - 25));

  // 3) Procházíme (s, p) a hledáme maximum s*p
  let bestUsed = 0;
  let bestS = 0;
  let bestP = 0;

  for (let s = 1; s <= numPanels; s++) {
    let totalVocCold = s * vocColdOnePanel;
    if (totalVocCold > sel.maxVoc) {
      continue; // Napětí moc vysoké
    }
    for (let p = 1; p <= numPanels; p++) {
      if (s*p > numPanels) break; // Nepoužívat > numPanels
      let totalIsc = p * panel_Isc;
      if (totalIsc > sel.maxIsc) {
        continue; // Proud moc vysoký
      }
      let used = s * p;
      if (used > bestUsed) {
        bestUsed = used;
        bestS = s;
        bestP = p;
      }
    }
  }

  // 4) Zobrazit výsledky
  if (bestUsed === 0) {
    resultP.html(
      `Model: ${sel.model} (maxVoc=${sel.maxVoc} V, maxIsc=${sel.maxIsc} A)<br>
       Počet panelů k dispozici: ${numPanels}<br><br>
       <strong>Žádné zapojení nevyhovuje Voc / Isc limitům!</strong>`
    );
    return;
  }

  let totalVoc25    = bestS * panel_Voc;
  let totalVocCold  = bestS * vocColdOnePanel;
  let totalIscPar   = bestP * panel_Isc;
  let totalVmpSerie = bestS * panel_Vmp;
  let totalImpPar   = bestP * panel_Imp;
  let totalPower    = bestUsed * panel_vykon;

  let html = `
    Model: ${sel.model} (maxVoc=${sel.maxVoc} V, maxIsc=${sel.maxIsc} A)<br>
    Počet panelů k dispozici: ${numPanels}<br><br>

    <strong>Nejvíce využitých panelů:</strong> ${bestUsed} z ${numPanels}<br>
    <strong>Zapojení:</strong> ${bestS} v sérii × ${bestP} paralelně<br><br>

    <strong>Parametry výsledného zapojení:</strong><br>
    - Voc (25°C): ${totalVoc25.toFixed(2)} V<br>
    - Voc (-20°C): ${totalVocCold.toFixed(2)} V<br>
    - Isc (celkem): ${totalIscPar.toFixed(2)} A<br>
    - Vmp (série): ${totalVmpSerie.toFixed(2)} V<br>
    - Imp (paralelně): ${totalImpPar.toFixed(2)} A<br>
    - Teoretický výkon: ${totalPower.toFixed(2)} W
  `;
  resultP.html(html);
}
