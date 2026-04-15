// Periodic Table Data & Weights
const atomicWeights = {
  "H": 1.008, "He": 4.0026, "Li": 6.94, "Be": 9.0122, "B": 10.81, "C": 12.011, "N": 14.007, "O": 15.999, "F": 18.998, "Ne": 20.180,
  "Na": 22.990, "Mg": 24.305, "Al": 26.982, "Si": 28.085, "P": 30.974, "S": 32.06, "Cl": 35.45, "Ar": 39.95, "K": 39.098, "Ca": 40.078,
  "Fe": 55.845, "Cu": 63.546, "Zn": 65.38, "Ag": 107.87, "I": 126.90, "Au": 196.97, "Hg": 200.59, "Pb": 207.2
};

// Periodic Table Layout for CSS Grid (Simplified for UI scale)
const periodicTableLayout = [
  "H", "", "", "", "", "", "He",
  "Li", "Be", "B", "C", "N", "O", "F",
  "Na", "Mg", "Al", "Si", "P", "S", "Cl",
  "K", "Ca", "Fe", "Cu", "Zn", "Ag", "I",
  "1", "2",  "3",  "4",  "5",  "6", "7", "8", "9", "0", "DEL"
];

const AVOGADRO = 6.02214076e23;

// Tab Switching
function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.main-nav button').forEach(el => el.classList.remove('active'));
  
  const targetView = document.getElementById('view-' + viewId);
  const targetBtn = document.querySelector(`.main-nav button[data-target="${viewId}"]`);
  
  if(targetView) targetView.classList.add('active');
  if(targetBtn) targetBtn.classList.add('active');
}

// Limpiar vistas
function clearView(viewId) {
  const targetView = document.getElementById('view-' + viewId);
  if (!targetView) return;
  
  // Limpiar inputs
  targetView.querySelectorAll('input').forEach(input => {
    input.value = '';
  });
  
  // Ocultar resultados
  const resultsArea = targetView.querySelector('.results-area');
  if (resultsArea) {
    resultsArea.classList.remove('active');
  }
}

// Initialize Keyboard based on target classes
function initKeyboard() {
  const keyboardContainers = document.querySelectorAll('.keyboard-target');
  
  keyboardContainers.forEach(container => {
    container.innerHTML = '';
    // Let's make it a tighter grid
    // Dejamos que el CSS maneje las columnas con media queries
    // Number keys row gets special handle
    
    periodicTableLayout.forEach(el => {
      const btn = document.createElement('button');
      if (el === "") {
        btn.className = "empty-cell";
      } else {
        btn.className = "element-btn";
        btn.textContent = el;
        btn.type = 'button';
        btn.onclick = () => appendToFormula(el, container);
      }
      container.appendChild(btn);
    });
  });
}

function appendToFormula(value, container) {
  // Find relative input
  const parent = container.parentElement;
  const input = parent.querySelector('.formula-input');
  if (!input) return;

  if(value === "DEL") {
    input.value = input.value.slice(0, -1);
    return;
  }

  const start = input.selectionStart || input.value.length;
  const end = input.selectionEnd || input.value.length;
  const text = input.value;
  input.value = text.slice(0, start) + value + text.slice(end);
  input.focus();
}

function setFormula(formula) {
  // Set in whichever is active
  const activeSection = document.querySelector('.view-section.active');
  if(!activeSection) return;
  const input = activeSection.querySelector('.formula-input');
  if(input) {
    input.value = formula;
  }
}

// ---- Chemistry Logic ---- //

function parseFormula(formula) {
  if(!formula) throw new Error("Fórmula vacía");
  const regex = /([A-Z][a-z]*)(\d*)/g;
  let match;
  const elements = {};
  
  while ((match = regex.exec(formula)) !== null) {
    const element = match[1];
    const count = match[2] ? parseInt(match[2], 10) : 1;
    
    if (elements[element]) {
      elements[element] += count;
    } else {
      elements[element] = count;
    }
  }
  if(Object.keys(elements).length === 0) throw new Error("Fórmula no válida");
  return elements;
}

function calculateMolarMass(formula) {
  const parsed = parseFormula(formula);
  let totalMass = 0;
  
  for (const [element, count] of Object.entries(parsed)) {
    if (atomicWeights[element]) {
      totalMass += atomicWeights[element] * count;
    } else {
      throw new Error(`Elemento no en teclado numérico/desconocido: ${element}`);
    }
  }
  
  return { mass: totalMass, composition: parsed };
}

// Function per page
function executeMasaMolar() {
  const formula = document.getElementById('formula-input-masa').value;
  try {
    const { mass } = calculateMolarMass(formula);
    document.getElementById('result-masa-val').textContent = `${mass.toFixed(2)} g/mol`;
    document.getElementById('results-masa-section').classList.add('active');
  } catch (err) {
    alert(err.message);
  }
}

function formatScientific(num) {
  if (num === 0) return "0";
  let expStr = num.toExponential(4);
  let parts = expStr.split('e');
  let coeff = parts[0];
  let exp = parseInt(parts[1], 10);
  
  if (exp === 0) return coeff;
  return `${coeff} &times; 10<sup>${exp}</sup>`;
}

function executeMoles() {
  const formula = document.getElementById('formula-input-moles').value;
  const massInput = parseFloat(document.getElementById('mass-input').value);
  if (isNaN(massInput)) {
    alert("Ingresa una masa válida.");
    return;
  }
  try {
    const { mass, composition } = calculateMolarMass(formula);
    const moles = massInput / mass;
    const molecules = moles * AVOGADRO;
    
    let totalAtomsPerMolecule = 0;
    for (const count of Object.values(composition)) {
      totalAtomsPerMolecule += count;
    }
    const atoms = molecules * totalAtomsPerMolecule;
    
    // Moles in exact decimal representation (e.g. 4 decimals)
    document.getElementById('result-moles').innerHTML = moles.toFixed(4) + " mol";
    
    // Molecules in standard scientific formats
    document.getElementById('result-molecules').innerHTML = formatScientific(molecules);
    
    // Atoms with coefficient rounded up to 2 digits ("aproximado al mayor del segundo decimal")
    let atomsExp = atoms.toExponential();
    let partsA = atomsExp.split('e');
    let coeffA = parseFloat(partsA[0]);
    // Ceil to 2 decimals
    coeffA = Math.ceil(coeffA * 100) / 100;
    
    let expA = parseInt(partsA[1], 10);
    let strAtoms = expA !== 0 ? `${coeffA} &times; 10<sup>${expA}</sup>` : coeffA.toString();
    
    document.getElementById('result-atoms').innerHTML = strAtoms;
    
    document.getElementById('results-moles-section').classList.add('active');
  } catch(err) {
    alert(err.message);
  }
}

function executeComposicion() {
  const formula = document.getElementById('formula-input-composicion').value;
  try {
    const { mass, composition } = calculateMolarMass(formula);
    const container = document.getElementById('composition-results');
    container.innerHTML = '';
    
    for (const [element, count] of Object.entries(composition)) {
      const elMass = atomicWeights[element] * count;
      const percent = (elMass / mass) * 100;
      
      const div = document.createElement('div');
      div.className = 'result-card';
      div.innerHTML = `<h3>${element}</h3><div class="value">${percent.toFixed(2)} %</div>`;
      container.appendChild(div);
    }
    
    document.getElementById('results-comp-section').classList.add('active');
  } catch(err) {
    alert(err.message);
  }
}

function executeEmpiricalFormula() {
  const pC = parseFloat(document.getElementById('pct-c').value) || 0;
  const pH = parseFloat(document.getElementById('pct-h').value) || 0;
  const pO = parseFloat(document.getElementById('pct-o').value) || 0;
  const targetMass = parseFloat(document.getElementById('target-mass').value);

  if (pC + pH + pO === 0) {
    alert("Ingresa al menos un porcentaje.");
    return;
  }

  const molC = pC / atomicWeights['C'];
  const molH = pH / atomicWeights['H'];
  const molO = pO / atomicWeights['O'];

  let molesArray = [];
  if(molC > 0) molesArray.push(molC);
  if(molH > 0) molesArray.push(molH);
  if(molO > 0) molesArray.push(molO);
  
  const minMolar = Math.min(...molesArray);

  let ratioC = Math.round(molC > 0 ? (molC / minMolar) : 0);
  let ratioH = Math.round(molH > 0 ? (molH / minMolar) : 0);
  let ratioO = Math.round(molO > 0 ? (molO / minMolar) : 0);

  let empiricalFormula = "";
  if(ratioC > 0) empiricalFormula += "C" + (ratioC > 1 ? ratioC : "");
  if(ratioH > 0) empiricalFormula += "H" + (ratioH > 1 ? ratioH : "");
  if(ratioO > 0) empiricalFormula += "O" + (ratioO > 1 ? ratioO : "");

  document.getElementById('result-empirical').textContent = empiricalFormula;

  if (targetMass && targetMass > 0) {
    const empMass = (ratioC * atomicWeights['C']) + (ratioH * atomicWeights['H']) + (ratioO * atomicWeights['O']);
    const factor = Math.round(targetMass / empMass);
    
    let molecularFormula = "";
    if(ratioC > 0) molecularFormula += "C" + ((ratioC * factor) > 1 ? (ratioC * factor) : "");
    if(ratioH > 0) molecularFormula += "H" + ((ratioH * factor) > 1 ? (ratioH * factor) : "");
    if(ratioO > 0) molecularFormula += "O" + ((ratioO * factor) > 1 ? (ratioO * factor) : "");
    
    document.getElementById('result-molecular').textContent = molecularFormula;
  } else {
    document.getElementById('result-molecular').textContent = "Faltan datos de masa m.";
  }

  document.getElementById('results-formula-section').classList.add('active');
}

window.onload = () => {
  initKeyboard();
};
