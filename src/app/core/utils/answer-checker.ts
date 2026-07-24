export function isAnswerCorrect(rawActual: string | undefined, rawExpected: string | undefined): boolean {
  if (!rawExpected || !rawExpected.trim()) {
    return false;
  }
  if (!rawActual || !rawActual.trim()) {
    return false;
  }

  const actual = rawActual.trim().toLowerCase();
  const expectedList = rawExpected
    .split(/[\/\;\,\|]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (expectedList.length === 0) {
    return false;
  }

  for (const exp of expectedList) {
    // 1. Exact string match
    if (actual === exp) {
      return true;
    }

    // 2. Option letter prefix match (e.g. actual = "b. option text", expected = "b")
    if (exp.length === 1 && /^[a-z]$/.test(exp)) {
      if (
        actual === exp ||
        actual.startsWith(`${exp}.`) ||
        actual.startsWith(`${exp})`) ||
        actual.startsWith(`${exp} `)
      ) {
        return true;
      }
    }

    // 3. Boolean values and abbreviations
    if (exp === 'true' || exp === 't') {
      if (actual === 'true' || actual === 't') return true;
    }
    if (exp === 'false' || exp === 'f') {
      if (actual === 'false' || actual === 'f') return true;
    }
    if (exp === 'yes' || exp === 'y') {
      if (actual === 'yes' || actual === 'y') return true;
    }
    if (exp === 'no' || exp === 'n') {
      if (actual === 'no' || actual === 'n') return true;
    }
    if (exp === 'not given' || exp === 'ng') {
      if (actual === 'not given' || actual === 'ng') return true;
    }
  }

  return false;
}
