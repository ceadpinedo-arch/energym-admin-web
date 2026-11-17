import { useEffect, useState } from 'react';
import { apiGet } from './api';
import './Resumen.css';

const pesos = (n) => '$' + (n || 0).toLocaleString('es-AR');
const fecha = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
const diaCorto = (dia) => new Date(dia + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' });
const etiquetaMetodo = (m) => ({ EFECTIVO: 'Efectivo', MERCADO_PAGO: 'Mercado Pago' }[m] || m);

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function fechaLarga() {
  const t = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function Ico(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {props.children}
    </svg>
  );
}

const IcoSocios = (
  <Ico>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c2.2.7 3.5 2.6 3.5 5.6" />
  </Ico>
);
const IcoDinero = (
  <Ico>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M6 9.5v.01M18 14.5v.01" />
  </Ico>
);
const IcoEntradas = (
  <Ico>
    <path d="M14 4h5v16h-5" />
    <path d="M3 12h11M10 8l4 4-4 4" />
  </Ico>
);
const IcoReloj = (
  <Ico>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Ico>
);
const IcoAlerta = (
  <Ico>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M12 10v4M12 17.5v.01" />
  </Ico>
);

function Filas({ socios, max }) {
  const lista = socios.slice(0, max);
  return (
    <>
      <ul className="lista">
        {lista.map((s) => (
          <li key={s.id}>
            <span>{s.nombre}<small> · {s.dni}</small></span>
            <span>{s.vencimiento ? fecha(s.vencimiento) : '—'}</span>
          </li>
        ))}
      </ul>
      {socios.length > max && <small className="rs-mas">y {socios.length - max} más</small>}
    </>
  );
}

export default function Resumen({ token, onIr }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/pagos/resumen', token)
      .then(setD)
      .catch(() => setError('No se pudo cargar el resumen.'));
  }, [token]);

  if (error) return <p className="error">{error}</p>;
  if (!d) return <p className="vacio">Cargando...</p>;

  const ir = (tab) => () => {
    if (onIr) onIr(tab);
  };

  const porVencer = d.porVencer || [];
  const vencidosLista = d.vencidosLista || [];
  const alertas = (d.vencidos || 0) + porVencer.length;
  const maxAsist = Math.max(1, ...(d.asistenciaSemana || []).map((x) => x.cantidad));
  const variacion = d.totalMesAnterior > 0
    ? Math.round(((d.totalMes - d.totalMesAnterior) / d.totalMesAnterior) * 100)
    : null;
  const metodos = d.porMetodo || [];
  const totalMetodos = metodos.reduce((a, m) => a + (m.total || 0), 0);

  return (
    <>
      <section className="rs-hero">
        <h2>¡{saludo()}, Administrador!</h2>
        <div className="rs-fecha">{fechaLarga()}</div>
        <div className="rs-acciones">
          <button type="button" className="rs-btn rs-btn-pri" onClick={ir('socios')}>+ Nuevo socio</button>
          <button type="button" className="rs-btn" onClick={ir('pagos')}>Pagos</button>
          <button type="button" className="rs-btn" onClick={ir('rutinas')}>Rutinas</button>
          <button type="button" className="rs-btn" onClick={ir('socios')}>
            Alertas
            {alertas > 0 && <span className="rs-badge">{alertas}</span>}
          </button>
        </div>
      </section>

      <section className="rs-kpis">
        <div className="panel rs-kpi">
          <div className="rs-kpi-info">
            <span>Socios activos</span>
            <strong>{d.sociosActivos}</strong>
            <small>{d.nuevosMes} nuevos este mes</small>
          </div>
          <div className="rs-icono rs-i-violeta">{IcoSocios}</div>
        </div>

        <div className="panel rs-kpi">
          <div className="rs-kpi-info">
            <span>Ingresos del mes</span>
            <strong>{pesos(d.totalMes)}</strong>
            <small>
              {variacion !== null
                ? (variacion >= 0 ? '▲ ' : '▼ ') + Math.abs(variacion) + '% vs mes anterior'
                : 'Sin datos del mes anterior'}
            </small>
          </div>
          <div className="rs-icono rs-i-verde">{IcoDinero}</div>
        </div>

        <div className="panel rs-kpi">
          <div className="rs-kpi-info">
            <span>Entradas hoy</span>
            <strong>{d.entradasHoy}</strong>
            <small>Asistencias registradas</small>
          </div>
          <div className="rs-icono rs-i-azul">{IcoEntradas}</div>
        </div>

        <div className="panel rs-kpi">
          <div className="rs-kpi-info">
            <span>Por vencer (7 días)</span>
            <strong>{porVencer.length}</strong>
            <small>{porVencer.length > 0 ? 'Avisales antes de que venzan' : 'Nada por vencer'}</small>
          </div>
          <div className="rs-icono rs-i-ambar">{IcoReloj}</div>
        </div>

        <div className={'panel rs-kpi' + (d.vencidos > 0 ? ' rs-kpi-warn' : '')}>
          <div className="rs-kpi-info">
            <span>Cuotas vencidas</span>
            <strong>{d.vencidos}</strong>
            <small>{d.vencidos > 0 ? 'Requieren seguimiento' : 'Todo al día'}</small>
          </div>
          <div className="rs-icono rs-i-rojo">{IcoAlerta}</div>
        </div>
      </section>

      <div className="rs-grid">
        <section className="panel">
          <div className="rs-card-cab">
            <h3>Vencimientos inmediatos</h3>
            <button type="button" className="rs-link" onClick={ir('socios')}>Ver todos ({alertas})</button>
          </div>
          {vencidosLista.length === 0 && porVencer.length === 0 && (
            <p className="vacio">No hay cuotas vencidas ni por vencer.</p>
          )}
          {vencidosLista.length > 0 && (
            <>
              <span className="rs-tag rs-tag-rojo">Vencidas</span>
              <Filas socios={vencidosLista} max={5} />
            </>
          )}
          {porVencer.length > 0 && (
            <>
              <span className="rs-tag rs-tag-ambar">Vencen en 7 días</span>
              <Filas socios={porVencer} max={5} />
            </>
          )}
        </section>

        <section className="panel">
          <div className="rs-card-cab">
            <h3>Cobros del mes por método</h3>
          </div>
          {metodos.length === 0 ? (
            <p className="vacio">Todavía no hay pagos este mes.</p>
          ) : (
            <ul className="rs-dist">
              {metodos.map((m) => {
                const pct = totalMetodos > 0 ? Math.round((m.total / totalMetodos) * 100) : 0;
                return (
                  <li key={m.metodo}>
                    <div className="rs-dist-fila">
                      <span>{etiquetaMetodo(m.metodo)}<small> · {m.cantidad} pagos</small></span>
                      <strong>{pesos(m.total)} <small>({pct}%)</small></strong>
                    </div>
                    <div className="rs-pista"><span style={{ width: pct + '%' }} /></div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="rs-card-cab">
            <h3>Asistencia, últimos 7 días</h3>
          </div>
          <div className="barras">
            {(d.asistenciaSemana || []).map((x) => (
              <div className="barra-col" key={x.dia}>
                <span className="barra-num">{x.cantidad}</span>
                <div className="barra" style={{ height: (x.cantidad / maxAsist) * 100 + '%' }} />
                <span className="barra-dia">{diaCorto(x.dia)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="rs-card-cab">
            <h3>Últimos pagos</h3>
            <button type="button" className="rs-link" onClick={ir('pagos')}>Ver pagos</button>
          </div>
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
