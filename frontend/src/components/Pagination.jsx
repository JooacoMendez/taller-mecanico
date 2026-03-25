export default function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
      <button 
        className="btn btn-secondary btn-sm" 
        disabled={currentPage === 1} 
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Anterior
      </button>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button 
          key={p} 
          className={`btn btn-sm ${currentPage === p ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onPageChange(p)}
          style={{ minWidth: '32px' }}
        >
          {p}
        </button>
      ))}

      <button 
        className="btn btn-secondary btn-sm" 
        disabled={currentPage === totalPages} 
        onClick={() => onPageChange(currentPage + 1)}
      >
        Siguiente →
      </button>
    </div>
  );
}
