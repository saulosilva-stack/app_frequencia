// ================================
// FORMATAR DATA (ISO → dd/mm/aaaa)
// ================================
export function formatarData(dataISO) {
  if (!dataISO) return '-'

  const data = new Date(dataISO)

  return data.toLocaleDateString('pt-BR')
}