// Simple test suite for GeneSymbol Highlighter logic

function normalizeSymbol(text) {
  const greekMap = { 'α': 'A', 'β': 'B', 'γ': 'G', 'δ': 'D', 'ε': 'E', 'ζ': 'Z', 'η': 'E', 'θ': 'TH', 'ι': 'I', 'κ': 'K', 'λ': 'L', 'μ': 'M', 'ν': 'N', 'ξ': 'X', 'ο': 'O', 'π': 'P', 'ρ': 'R', 'ς': 'S', 'σ': 'S', 'τ': 'T', 'υ': 'Y', 'φ': 'PH', 'χ': 'CH', 'ψ': 'PS', 'ω': 'O' };
  let n = ''; for (let c of text) n += greekMap[c] || c; return n.toUpperCase();
}

function runTests() {
  const cases = [
    { input: 'cd4', expected: 'CD4' },
    { input: 'Nf-kb', expected: 'NF-KB' },
    { input: 'α-tubulin', expected: 'A-TUBULIN' },
    { input: 'β-actin', expected: 'B-ACTIN' },
    { input: 'p53', expected: 'P53' }
  ];

  console.log('Running Symbol Normalization Tests...');
  let passed = 0;
  cases.forEach(c => {
    const result = normalizeSymbol(c.input);
    if (result === c.expected) {
      console.log(`✅ PASS: ${c.input} -> ${result}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${c.input} expected ${c.expected} but got ${result}`);
    }
  });

  console.log(`
Tests Completed: ${passed}/${cases.length} passed.`);
}

runTests();
