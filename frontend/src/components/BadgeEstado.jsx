const LABELS = {
  nueva: 'Nueva',
  presupuestada: 'Presupuestada',
  en_proceso: 'En proceso',
  lista: 'Lista',
  entregada: 'Entregada',
};

const DOTS = {
  nueva: '●',
  presupuestada: '●',
  en_proceso: '●',
  lista: '●',
  entregada: '✓',
};

export default function BadgeEstado({ estado }) {
  return (
    <span className={`badge badge-${estado}`}>
      {DOTS[estado]} {LABELS[estado] ?? estado}
    </span>
  );
}
