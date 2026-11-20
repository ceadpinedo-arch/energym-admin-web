import { useEffect, useState } from 'react';
import { apiGet } from './api';

const pesos = (n) => `$${(n || 0).toLocaleString('es-AR')}`;
const fecha = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
const diaCorto = (dia) => new Date(`${dia}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short' });
const etiquetaMetodo = (m) => ({ EFECTIVO: 'Efectivo', MERCADO_PAGO: 'Mercado Pago' }[m] || m);

function ListaSocios({ socios, vacio }) {
  if (!socios.length) return <p className="vacio">{vacio}</p>;
  return (
    <ul className="lista">
      {socios.map((s) => (
        <li key={s.id}>
          <span>{s.nombre}<small> · {s.dni}</small></span>
          <span>{s.vencimiento ? fecha(s.vencimiento) : '—'}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Resumen({ token }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/pagos/resumen', token)
      .then(setD)
      .catch(() => setError('No se pudo cargar el resumen.'));
  }, [token]);

  if (error) return <p className="error">{error}</p>;
  if (!d) return <p className="vacio">Cargando...</p>;

  const maxAsist = Math.max(1, ...(d.asistenciaSemana || []).map((x) => x.cantidad));
  const variacion = d.totalMesAnterior > 0
    ? Math.round(((d.totalMes - d.totalMesAnterior) / d.totalMesAnterior) * 100)
    : null;

  return (
    <>
      <section className="stats">
        <div className="stat-card">
          <span>Socios activos</span>
          <strong>{d.sociosActivos}</strong>
          <small>{d.nuevosMes} nuevos este mes</small>
        </div>
        <div className="stat-card">
          <span>Ingresos del mes</span>
          <strong>{pesos(d.totalMes)}</strong>
          {variacion !== null && (
            <small>{variacion >= 0 ? '▲' : '▼'} {Math.abs(variacion)}% vs mes anterior</small>
          )}
        </div>
        <div className="stat-card">
          <span>Entradas hoy</span>
          <strong>{d.entradasHoy}</strong>
        </div>
        <div className={`stat-card ${d.vencidos > 0 ? 'stat-warn' : ''}`}>
          <span>Cuotas vencidas</span>
          <strong>{d.vencidos}</strong>
        </div>
      </section>

      <div className="resumen-grid">
        <section className="panel">
          <h3>Vencen en los próximos 7 días</h3>
          <ListaSocios socios={d.porVencer || []} vacio="Ninguna cuota vence esta semana." />
        </section>

        <section className="panel">
          <h3>Cuotas vencidas</h3>
          <ListaSocios socios={d.vencidosLista || []} vacio="No hay cuotas vencidas." />
        </section>

        <section className="panel">
          <h3>Asistencia, últimos 7 días</h3>
          <div className="barras">
            {(d.asistenciaSemana || []).map((x) => (
              <div className="barra-col" key={x.dia}>
                <span className="barra-num">{x.cantidad}</span>
                <div className="barra" style={{ height: `${(x.cantidad / maxAsist) * 100}%` }} />
                <span className="barra-dia">{diaCorto(x.dia)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3>Cobros del mes por método</h3>
          {!(d.porMetodo || []).length ? (
            <p className="vacio">Todavía no hay pagos este mes.</p>
          ) : (
            <ul className="lista">
              {d.porMetodo.map((m) => (
                <li key={m.metodo}>
                  <span>{etiquetaMetodo(m.metodo)}<small> · {m.cantidad} pagos</small></span>
                  <span>{pesos(m.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel panel-ancho">
          <h3>Últimos pagos</h3>
          {!(d.ultimosPagos || []).length ? (
            <p className="vacio">Sin pagos registrados.</p>
          ) : (
            <ul className="lista">
              {d.ultimosPagos.map((p) => (
                <li key={p.id}>
                  <span>{p.usuario?.nombre}<small> · {etiquetaMetodo(p.metodo)} · {fecha(p.pagadoEn)}</small></span>
                  <span>{pesos(p.monto)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
