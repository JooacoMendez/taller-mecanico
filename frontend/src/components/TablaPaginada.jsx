import { useState } from 'react';

export default function TablaPaginada({ columns, data, pageSize = 10, emptyText = 'No hay registros', onRowClick }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const pageData = data.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={col.width ? { width: col.width } : {}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <div className="empty-state-text">{emptyText}</div>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onClick={() => onRowClick?.(row)}
                  style={onRowClick ? { cursor: 'pointer' } : {}}
                >
                  {columns.map(col => (
                    <td key={col.key} className={col.muted ? 'muted' : ''}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span>
            Mostrando {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} de {data.length}
          </span>
          <div className="pagination-btns">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              ← Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i).map(p => (
              <button
                key={p}
                className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPage(p)}
                style={{ minWidth: '30px' }}
              >
                {p + 1}
              </button>
            ))}

            <button
              className="btn btn-secondary btn-sm"
              disabled={page === totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
