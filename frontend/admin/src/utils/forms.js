export function createPenaltyForm() {
  return { name: '', preset: '60', custom: '', playerId: '', freeThrows: false, freeThrowCount: '2' };
}

export function createPenaltyForms() {
  return {
    a: createPenaltyForm(),
    b: createPenaltyForm()
  };
}
