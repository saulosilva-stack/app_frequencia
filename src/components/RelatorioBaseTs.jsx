import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table'
import { useState } from 'react'
import ExcelJS from 'exceljs'

function RelatorioBaseTS({ titulo, dados, colunas }) {

  const [sorting, setSorting] = useState([])

  function formatarValor(col, item) {
    const valor = item[col.campo]

    if (col.tipo === 'data') {
      if (!valor) return '-'
      const [ano, mes, dia] = valor.split('-')
      return `${dia}/${mes}/${ano}`
    }

    return valor ?? '-'
  }

  const columns = colunas.map(col => ({
    accessorKey: col.campo,
    header: col.label,

    cell: info => {
      const item = info.row.original

      if (col.render) {
        return col.render(item)
      }

      return formatarValor(col, item)
    }
  }))

  const table = useReactTable({
    data: dados,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // ================================
  // EXPORTAR EXCEL (ExcelJS)
  // ================================
  async function exportarExcel() {

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(titulo)

    // Cabeçalho
    worksheet.columns = colunas.map(col => ({
      header: col.label,
      key: col.campo,
      width: 20
    }))

    // Linhas
    dados.forEach(item => {
      const linha = {}

      colunas.forEach(col => {
        linha[col.campo] = formatarValor(col, item)
      })

      worksheet.addRow(linha)
    })

    // Estilo simples no header
    worksheet.getRow(1).font = { bold: true }

    // Gerar arquivo
    const buffer = await workbook.xlsx.writeBuffer()

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${titulo}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2>{titulo}</h2>

        <button onClick={exportarExcel}>
          Exportar Excel
        </button>
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: 20
      }}>

        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{
                    borderBottom: '2px solid #000',
                    cursor: 'pointer',
                    padding: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}

                    {{
                      asc: ' ↑',
                      desc: ' ↓'
                    }[header.column.getIsSorted()] ?? null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              style={{
                backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
              }}
            >
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  style={{
                    padding: '6px',
                    borderBottom: '1px solid #ddd'
                  }}
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  )
}

export default RelatorioBaseTS