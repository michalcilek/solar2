{\rtf1\ansi\ansicpg1250\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // -------------------------------------------------------\
// Kalkula\uc0\u269 ka v p5.js pro zadan\'fd po\u269 et panel\u367  a vybran\'fd MPPT\
// Zobrazuje Voc(25 \'b0C) a Voc(-20 \'b0C), kontroluje proud a nap\uc0\u283 t\'ed\
// Baterie: 48 V (jen informativn\uc0\u283 ).\
// -------------------------------------------------------\
\
// 1) Seznam regul\'e1tor\uc0\u367  (SmartSolar) pro dropdown menu\
const mpptList = [\
  \{ model: "SmartSolar 100/20",   maxVoc: 100, maxIsc: 20 \},\
  \{ model: "SmartSolar 150/35",   maxVoc: 150, maxIsc: 35 \},\
  \{ model: "SmartSolar 150/45",   maxVoc: 150, maxIsc: 45 \},  // Oprava p\uc0\u345 eklepu\
  \{ model: "SmartSolar 150/60",   maxVoc: 150, maxIsc: 60 \},\
  \{ model: "SmartSolar 150/70",   maxVoc: 150, maxIsc: 70 \},\
  \{ model: "SmartSolar 150/85",   maxVoc: 150, maxIsc: 85 \},\
  \{ model: "SmartSolar 150/100",  maxVoc: 150, maxIsc: 100 \},\
  \{ model: "SmartSolar 250/60",   maxVoc: 250, maxIsc: 60 \},\
  \{ model: "SmartSolar 250/70",   maxVoc: 250, maxIsc: 70 \},\
  \{ model: "SmartSolar 250/85",   maxVoc: 250, maxIsc: 85 \},\
  \{ model: "SmartSolar 250/100",  maxVoc: 250, maxIsc: 100 \}\
];\
\
// 2) Glob\'e1ln\'ed prom\uc0\u283 nn\'e9 pro p5\
let inpPanelCount;    // Textov\'fd vstup: po\uc0\u269 et panel\u367 \
let selMPPT;          // Dropdown (select) pro volbu modelu\
\
// Vstupy pro parametry panelu:\
let inpPanelVykon;\
let inpPanelVoc;\
let inpPanelIsc;\
let inpPanelVmp;\
let inpPanelImp;\
let inpAlphaVoc;\
\
// Konstantn\'ed nap\uc0\u283 t\'ed baterie (48 V)\
const baterieNapeti = 48; // jen zobrazujeme (v tomto k\'f3du neu\'9e\'edv\'e1me v logice)\
\
// Teplota pro v\'fdpo\uc0\u269 et Voc za studena\
const tempLow = -20; // \'b0C\
\
function setup() \{\
  createCanvas(900, 520);\
  textSize(14);\
  noStroke();\
\
  // 1) Vstup pro po\uc0\u269 et panel\u367 :\
  inpPanelCount = createInput('36'); // v\'fdchoz\'ed t\uc0\u345 eba 36\
  inpPanelCount.position(20, 40);\
  inpPanelCount.size(60);\
\
  // Popisek k inputu\
  // (Samotn\'fd text nakresl\'edme v draw)\
\
  // 2) Dropdown pro v\'fdb\uc0\u283 r modelu MPPT:\
  selMPPT = createSelect();\
  selMPPT.position(120, 40);\
  for (let reg of mpptList) \{\
    selMPPT.option(reg.model);\
  \}\
  // M\uc0\u367 \'9eeme nastavit v\'fdchoz\'ed volbu:\
  selMPPT.selected('SmartSolar 150/70');\
\
  // 3) Parametry panelu\
  inpPanelVykon = createInput('410.0'); // W\
  inpPanelVykon.position(20, 100);\
  inpPanelVykon.size(70);\
\
  inpPanelVoc = createInput('37.60');   // V\
  inpPanelVoc.position(20, 130);\
  inpPanelVoc.size(70);\
\
  inpPanelIsc = createInput('13.89');   // A\
  inpPanelIsc.position(20, 160);\
  inpPanelIsc.size(70);\
\
  inpPanelVmp = createInput('31.30');   // V\
  inpPanelVmp.position(20, 190);\
  inpPanelVmp.size(70);\
\
  inpPanelImp = createInput('13.10');   // A\
  inpPanelImp.position(20, 220);\
  inpPanelImp.size(70);\
\
  inpAlphaVoc = createInput('-0.003');  // Teplotn\'ed koeficient Voc\
  inpAlphaVoc.position(20, 250);\
  inpAlphaVoc.size(70);\
\}\
\
function draw() \{\
  background(245);\
\
  fill(0);\
  text("Po\uc0\u269 et panel\u367 :", 20, 35);\
  text("(Zadejte integer)", 20, 55);\
\
  text("Vyber MPPT model:", 120, 35);\
\
  // Baterie:\
  text(`Baterie: $\{baterieNapeti\} V (konstantn\'ed)`, 300, 35);\
\
  text("Parametry jednoho panelu:", 20, 85);\
  text("V\'fdkon (W)", 100, 115);\
  text("Voc (V)",   100, 145);\
  text("Isc (A)",   100, 175);\
  text("Vmp (V)",   100, 205);\
  text("Imp (A)",   100, 235);\
  text("\uc0\u945  Voc",     100, 265);\
  text("(nap\uc0\u345 . -0.003)", 100, 280);\
\
  // 1) Na\uc0\u269 teme u\'9eivatelsk\'e9 vstupy\
  let numPanels = parseInt(inpPanelCount.value());\
  let chosenModel = selMPPT.value();\
\
  let panel_vykon = parseFloat(inpPanelVykon.value());\
  let panel_Voc   = parseFloat(inpPanelVoc.value());\
  let panel_Isc   = parseFloat(inpPanelIsc.value());\
  let panel_Vmp   = parseFloat(inpPanelVmp.value());\
  let panel_Imp   = parseFloat(inpPanelImp.value());\
  let alphaVoc    = parseFloat(inpAlphaVoc.value());\
\
  // Ov\uc0\u283 \u345 en\'ed platnosti\
  if (isNaN(numPanels) || numPanels < 1) \{\
    fill('red');\
    text("Chyba: Po\uc0\u269 et panel\u367  mus\'ed b\'fdt kladn\'e9 \u269 \'edslo!", 20, 320);\
    return;\
  \}\
\
  // Najdeme zvolen\'fd model v seznamu (vr\'e1t\'ed nap\uc0\u345 . \{model:..., maxVoc:..., maxIsc:...\})\
  let selectedReg = mpptList.find(item => item.model === chosenModel);\
  if (!selectedReg) \{\
    fill('red');\
    text("Chyba: Vybran\'fd MPPT model nebyl nalezen v seznamu.", 20, 320);\
    return;\
  \}\
\
  // 2) P\uc0\u345 e\u269 teme maxVoc a maxIsc z vybran\'e9ho modelu\
  let maxVoc = selectedReg.maxVoc;\
  let maxIsc = selectedReg.maxIsc;\
\
  // Vyp\'ed\'9aeme zvolen\'fd model a parametry\
  fill(0);\
  let yBase = 320;\
  text(`Model: $\{selectedReg.model\} (maxVoc=$\{maxVoc\} V, maxIsc=$\{maxIsc\} A)`, 20, yBase);\
  yBase += 20;\
  text(`Po\uc0\u269 et panel\u367  k dispozici: $\{numPanels\}`, 20, yBase);\
  yBase += 20;\
\
  // 3) Voc za studena (-20 \'b0C) pro 1 panel\
  let vocColdOnePanel = panel_Voc * (1 + alphaVoc*(tempLow - 25));\
\
  // 4) Hled\'e1me (s, p): s * p <= numPanels, s*vocColdOnePanel <= maxVoc, p*panel_Isc <= maxIsc\
  let bestUsed = 0;\
  let bestS = 0;\
  let bestP = 0;\
\
  for (let s = 1; s <= numPanels; s++) \{\
    let totalVocCold = s * vocColdOnePanel;\
    if (totalVocCold > maxVoc) \{\
      // nap\uc0\u283 t\'ed by p\u345 ekro\u269 ilo limit MPPT\
      continue;\
    \}\
    for (let p = 1; p <= numPanels; p++) \{\
      if (s * p > numPanels) \{\
        // v\'edc panel\uc0\u367 , ne\'9e m\'e1me\
        continue;\
      \}\
      let totalIsc = p * panel_Isc;\
      if (totalIsc > maxIsc) \{\
        // proud p\uc0\u345 \'edli\'9a vysok\'fd\
        continue;\
      \}\
      // Jinak feasible\
      let used = s * p;\
      if (used > bestUsed) \{\
        bestUsed = used;\
        bestS = s;\
        bestP = p;\
      \}\
    \}\
  \}\
\
  yBase += 20;\
  if (bestUsed === 0) \{\
    fill('red');\
    text("CHYBA: \'8e\'e1dn\'e9 zapojen\'ed nevyhovuje Voc a Isc limit\uc0\u367 m!", 20, yBase);\
    return;\
  \}\
\
  fill(0);\
  text(`Nejv\'edce vyu\'9eit\'fdch panel\uc0\u367 : $\{bestUsed\} z $\{numPanels\}`, 20, yBase);\
  yBase += 20;\
  text(`Zapojen\'ed: $\{bestS\} v s\'e9rii \'d7 $\{bestP\} paraleln\uc0\u283 `, 20, yBase);\
  yBase += 30;\
\
  // 5) V\'fdpo\uc0\u269 et Voc(25\'b0C), Voc(-20\'b0C), Isc, atd.\
  let totalVoc25    = bestS * panel_Voc;\
  let totalVocCold  = bestS * vocColdOnePanel;\
  let totalIscPar   = bestP * panel_Isc;\
  let totalVmpSerie = bestS * panel_Vmp;\
  let totalImpPar   = bestP * panel_Imp;\
  let totalPower    = bestUsed * panel_vykon;\
\
  text("Parametry v\'fdsledn\'e9ho zapojen\'ed:", 20, yBase);\
  yBase += 20;\
  text("- Voc (25\'b0C): " + totalVoc25.toFixed(2) + " V", 40, yBase);\
  yBase += 20;\
  text("- Voc (-20\'b0C): " + totalVocCold.toFixed(2) + " V", 40, yBase);\
  yBase += 20;\
  text("- Isc (celkem): " + totalIscPar.toFixed(2) + " A", 40, yBase);\
  yBase += 20;\
  text("- Vmp (s\'e9rie): " + totalVmpSerie.toFixed(2) + " V", 40, yBase);\
  yBase += 20;\
  text("- Imp (paraleln\uc0\u283 ): " + totalImpPar.toFixed(2) + " A", 40, yBase);\
  yBase += 20;\
  text("- Teoretick\'fd v\'fdkon: " + totalPower.toFixed(2) + " W", 40, yBase);\
\}\
}