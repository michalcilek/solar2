// -------------------------------------------------------
// Kalkulačka v p5.js pro zadaný počet panelů a vybraný MPPT
// Zobrazuje Voc(25 °C) a Voc(-20 °C), kontroluje proud a napětí
// Baterie: 48 V (jen informativně).
// -------------------------------------------------------

// 1) Seznam regulátorů (SmartSolar) pro dropdown menu
const mpptList = [
  { model: "SmartSolar 100/20",   maxVoc: 100, maxIsc: 20 },
  { model: "SmartSolar 150/35",   maxVoc: 150, maxIsc: 35 },
  { model: "SmartSolar 150/45",   maxVoc: 150, maxIsc: 45 },  // Oprava překlepu
  { model: "SmartSolar 150/60",   maxVoc: 150, maxIsc: 60 },
  { model: "SmartSolar 150/70",   maxVoc: 150, maxIsc: 70 },
  { model: "SmartSolar 150/85",   maxVoc: 150, maxIsc: 85 },
  { model: "SmartSolar 150/100",  maxVoc: 150, maxIsc: 100 },
  { model: "SmartSolar 250/60",   maxVoc: 250, maxIsc: 60 },
  { model: "SmartSolar 250/70",   maxVoc: 250, maxIsc: 70 },
  { model: "SmartSolar 250/85",   maxVoc: 250, maxIsc: 85 },
  { model: "SmartSolar 250/100",  maxVoc: 250, maxIsc: 100 }
];

// 2) Globální proměnné pro p5
let inpPanelCount;    // Textový vstup: počet panelů
let selMPPT;          // Dropdown (select) pro volbu modelu

// Vstupy pro parametry panelu:
let inpPanelVykon;
let inpPanelVoc;
let inpPanelIsc;
let inpPanelVmp;
let inpPanelImp;
let inpAlphaVoc;

// Konstantní napětí baterie (48 V)
const baterieNapeti = 48; // jen zobrazujeme (v tomto kódu neužíváme v logice)

// Teplota pro výpočet Voc za studena
const tempLow = -20; // °C

function setup() {
  createCanvas(900, 520);
  textSize(14);
  noStroke();

  // 1) Vstup pro počet panelů:
  inpPanelCount = createInput('36'); // výchozí třeba 36
  inpPanelCount.position(20, 40);
  inpPanelCount.size(60);

  // Popisek k inputu
  // (Samotný text nakreslíme v draw)

  // 2) Dropdown pro výběr modelu MPPT:
  selMPPT = createSelect();
  selMPPT.position(120, 40);
  for (let reg of mpptList) {
    selMPPT.option(reg.model);
  }
  // Můžeme nastavit výchozí volbu:
  selMPPT.selected('SmartSolar 150/70');

  // 3) Parametry panelu
  inpPanelVykon = createInput('410.0'); // W
  inpPanelVykon.position(20, 100);
  inpPanelVykon.size(70);

  inpPanelVoc = createInput('37.60');   // V
  inpPanelVoc.position(20, 130);
  inpPanelVoc.size(70);

  inpPanelIsc = createInput('13.89');   // A
  inpPanelIsc.position(20, 160);
  inpPanelIsc.size(70);

  inpPanelVmp = createInput('31.30');   // V
  inpPanelVmp.position(20, 190);
  inpPanelVmp.size(70);

  inpPanelImp = createInput('13.10');   // A
  inpPanelImp.position(20, 220);
  inpPanelImp.size(70);

  inpAlphaVoc = createInput('-0.003');  // Teplotní koeficient Voc
  inpAlphaVoc.position(20, 250);
  inpAlphaVoc.size(70);
}

function draw() {
  background(245);

  fill(0);
  text("Počet panelů:", 20, 35);
  text("(Zadejte integer)", 20, 55);

  text("Vyber MPPT model:", 120, 35);

  // Baterie:
  text(`Baterie: ${baterieNapeti} V (konstantní)`, 300, 35);

  text("Parametry jednoho panelu:", 20, 85);
  text("Výkon (W)", 100, 115);
  text("Voc (V)",   100, 145);
  text("Isc (A)",   100, 175);
  text("Vmp (V)",   100, 205);
  text("Imp (A)",   100, 235);
  text("α Voc",     100, 265);
  text("(např. -0.003)", 100, 280);

  // 1) Načteme uživatelské vstupy
  let numPanels = parseInt(inpPanelCount.value());
  let chosenModel = selMPPT.value();

  let panel_vykon = parseFloat(inpPanelVykon.value());
  let panel_Voc   = parseFloat(inpPanelVoc.value());
  let panel_Isc   = parseFloat(inpPanelIsc.value());
  let panel_Vmp   = parseFloat(inpPanelVmp.value());
  let panel_Imp   = parseFloat(inpPanelImp.value());
  let alphaVoc    = parseFloat(inpAlphaVoc.value());

  // Ověření platnosti
  if (isNaN(numPanels) || numPanels < 1) {
    fill('red');
    text("Chyba: Počet panelů musí být kladné číslo!", 20, 320);
    return;
  }

  // Najdeme zvolený model v seznamu (vrátí např. {model:..., maxVoc:..., maxIsc:...})
  let selectedReg = mpptList.find(item => item.model === chosenModel);
  if (!selectedReg) {
    fill('red');
    text("Chyba: Vybraný MPPT model nebyl nalezen v seznamu.", 20, 320);
    return;
  }

  // 2) Přečteme maxVoc a maxIsc z vybraného modelu
  let maxVoc = selectedReg.maxVoc;
  let maxIsc = selectedReg.maxIsc;

  // Vypíšeme zvolený model a parametry
  fill(0);
  let yBase = 320;
  text(`Model: ${selectedReg.model} (maxVoc=${maxVoc} V, maxIsc=${maxIsc} A)`, 20, yBase);
  yBase += 20;
  text(`Počet panelů k dispozici: ${numPanels}`, 20, yBase);
  yBase += 20;

  // 3) Voc za studena (-20 °C) pro 1 panel
  let vocColdOnePanel = panel_Voc * (1 + alphaVoc*(tempLow - 25));

  // 4) Hledáme (s, p): s * p <= numPanels, s*vocColdOnePanel <= maxVoc, p*panel_Isc <= maxIsc
  let bestUsed = 0;
  let bestS = 0;
  let bestP = 0;

  for (let s = 1; s <= numPanels; s++) {
    let totalVocCold = s * vocColdOnePanel;
    if (totalVocCold > maxVoc) {
      // napětí by překročilo limit MPPT
      continue;
    }
    for (let p = 1; p <= numPanels; p++) {
      if (s * p > numPanels) {
        // víc panelů, než máme
        continue;
      }
      let totalIsc = p * panel_Isc;
      if (totalIsc > maxIsc) {
        // proud příliš vysoký
        continue;
      }
      // Jinak feasible
      let used = s * p;
      if (used > bestUsed) {
        bestUsed = used;
        bestS = s;
        bestP = p;
      }
    }
  }

  yBase += 20;
  if (bestUsed === 0) {
    fill('red');
    text("CHYBA: Žádné zapojení nevyhovuje Voc a Isc limitům!", 20, yBase);
    return;
  }

  fill(0);
  text(`Nejvíce využitých panelů: ${bestUsed} z ${numPanels}`, 20, yBase);
  yBase += 20;
  text(`Zapojení: ${bestS} v sérii × ${bestP} paralelně`, 20, yBase);
  yBase += 30;

  // 5) Výpočet Voc(25°C), Voc(-20°C), Isc, atd.
  let totalVoc25    = bestS * panel_Voc;
  let totalVocCold  = bestS * vocColdOnePanel;
  let totalIscPar   = bestP * panel_Isc;
  let totalVmpSerie = bestS * panel_Vmp;
  let totalImpPar   = bestP * panel_Imp;
  let totalPower    = bestUsed * panel_vykon;

  text("Parametry výsledného zapojení:", 20, yBase);
  yBase += 20;
  text("- Voc (25°C): " + totalVoc25.toFixed(2) + " V", 40, yBase);
  yBase += 20;
  text("- Voc (-20°C): " + totalVocCold.toFixed(2) + " V", 40, yBase);
  yBase += 20;
  text("- Isc (celkem): " + totalIscPar.toFixed(2) + " A", 40, yBase);
  yBase += 20;
  text("- Vmp (série): " + totalVmpSerie.toFixed(2) + " V", 40, yBase);
  yBase += 20;
  text("- Imp (paralelně): " + totalImpPar.toFixed(2) + " A", 40, yBase);
  yBase += 20;
  text("- Teoretický výkon: " + totalPower.toFixed(2) + " W", 40, yBase);
}
