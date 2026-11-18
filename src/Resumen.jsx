import { useEffect, useState } from 'react';
import { apiGet } from './api';
import './Resumen.css';

const pesos = (n) => '$' + (n || 0).toLocaleString('es-AR');
const fechaCorta = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
const diaCorto = (dia) => new Date(dia + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' });
const etiquetaMetodo = (m) => ({ EFECTIVO: 'Efectivo', MERCADO_PAGO: 'Mercado Pago' }[m] || m);
const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
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
  </Ico>
);
const IcoEntradas = (
  <Ico>
    <path d="M14 4h5v16h-5" />
    <path d="M3 12h11M10 8l4 4-4 4" />
  </Ico>
);
const IcoCampana = (
  <Ico>
    <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Ico>
);

// Curva suave que pasa por todos los puntos
function curva(pts) {
  let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
  }
  return d;
}

function GraficoAsistencia({ datos }) {
  const W = 620;
  const H = 230;
  const izq = 34;
  const der = 14;
  const arriba = 28;
  const abajo = 34;
  const maxReal = Math.max(1, ...datos.map((x) => x.cantidad));
  const tope = Math.max(4, Math.ceil(maxReal / 4) * 4);
  const ancho = W - izq - der;
  const alto = H - arriba - abajo;
  const n = Math.max(2, datos.length);
  const pts = datos.map((x, i) => [izq + (ancho * i) / (n - 1), arriba + alto - (x.cantidad / tope) * alto]);
  if (pts.length < 2) return <p className="vacio">Todavía no hay asistencias.</p>;
  const linea = curva(pts);
  const base = arriba + alto;
  const area = linea + ' L' + pts[pts.length - 1][0].toFixed(1) + ',' + base + ' L' + pts[0][0].toFixed(1) + ',' + base + ' Z';
  let iMax = 0;
  datos.forEach((x, i) => {
    if (x.cantidad > datos[iMax].cantidad) iMax = i;
  });
  const pico = pts[iMax];
  const guias = [0, 1, 2, 3, 4];
  return (
    <svg className="rs-svg" viewBox={'0 0 ' + W + ' ' + H} role="img" aria-label="Asistencia de los últimos 7 días">
      <defs>
        <linearGradient id="rs-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="rs-stop-a" />
          <stop offset="100%" className="rs-stop-b" />
        </linearGradient>
      </defs>
      {guias.map((g) => {
        const y = arriba + (alto * g) / 4;
        const valor = Math.round(tope - (tope * g) / 4);
        return (
          <g key={g}>
            <line x1={izq} x2={W - der} y1={y} y2={y} className="rs-guia" />
            <text x={izq - 8} y={y + 4} textAnchor="end" className="rs-eje">{valor}</text>
          </g>
        );
      })}
      <path d={area} className="rs-area" />
      <path d={linea} className="rs-linea" />
      <line x1={pico[0]} x2={pico[0]} y1={pico[1]} y2={base} className="rs-pico-linea" />
      <circle cx={pico[0]} cy={pico[1]} r="6" className="rs-pico-punto" />
      <text x={pico[0]} y={pico[1] - 14} textAnchor="middle" className="rs-pico-texto">{datos[iMax].cantidad}</text>
      {datos.map((x, i) => (
        <text key={x.dia} x={pts[i][0]} y={H - 10} textAnchor="middle" className="rs-eje">{diaCorto(x.dia)}</text>
      ))}
    </svg>
  );
}

function armarCalendario(porVencer, vencidos) {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const diasMes = new Date(anio, mes + 1, 0).getDate();
  const offset = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const marcas = {};
  const marcar = (lista, tipo) => {
    lista.forEach((s) => {
      if (!s.vencimiento) return;
      const f = new Date(s.vencimiento);
      if (f.getFullYear() === anio && f.getMonth() === mes) {
        const k = f.getDate();
        if (marcas[k] !== 'rojo') marcas[k] = tipo;
      }
    });
  };
  marcar(vencidos, 'rojo');
  marcar(porVencer, 'ambar');
  const celdas = [];
  for (let i = 0; i < offset; i++) celdas.push({ vacio: true, k: 'v' + i });
  for (let dia = 1; dia <= diasMes; dia++) {
    celdas.push({ dia: dia, hoy: dia === hoy.getDate(), marca: marcas[dia] || '', k: 'd' + dia });
  }
  return { titulo: mayuscula(hoy.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })), celdas: celdas };
}

function Calendario({ porVencer, vencidos }) {
  const cal = armarCalendario(porVencer, vencidos);
  const dias = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  return (
    <section className="panel rs-cal">
      <h3>{cal.titulo}</h3>
      <div className="rs-cal-grid">
        {dias.map((x, i) => (
          <span key={'c' + i} className="rs-cal-cab">{x}</span>
        ))}
        {cal.celdas.map((c) =>
          c.vacio ? (
            <span key={c.k} />
          ) : (
            <span key={c.k} className={'rs-cal-dia' + (c.hoy ? ' rs-cal-hoy' : '')}>
              {c.dia}
              {c.marca && <i className={'rs-punto rs-punto-' + c.marca} />}
            </span>
          )
        )}
      </div>
      <div className="rs-leyenda">
        <span><i className="rs-punto rs-punto-ambar" /> Por vencer</span>
        <span><i className="rs-punto rs-punto-rojo" /> Vencidas</span>
      </div>
    </section>
  );
}

function ChipFecha({ iso, tipo }) {
  const f = new Date(iso);
  return (
    <span className={'rs-chip-fecha rs-chip-' + tipo}>
      <b>{f.getDate()}</b>
      <small>{f.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</small>
    </span>
  );
}

export default function Resumen({ token, gimnasio, onIr }) {
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

  const nombreGym = gimnasio && gimnasio.nombre ? gimnasio.nombre : 'tu gimnasio';
  const logo = gimnasio && gimnasio.logoUrl ? gimnasio.logoUrl : null;
  const porVencer = d.porVencer || [];
  const vencidosLista = d.vencidosLista || [];
  const semana = d.asistenciaSemana || [];
  const metodos = d.porMetodo || [];
  const alertas = (d.vencidos || 0) + porVencer.length;
  const totalSemana = semana.reduce((a, x) => a + x.cantidad, 0);
  const promedio = semana.length ? Math.round(totalSemana / semana.length) : 0;
  const totalPagos = metodos.reduce((a, m) => a + (m.cantidad || 0), 0);
  const totalMetodos = metodos.reduce((a, m) => a + (m.total || 0), 0);
  const variacion = d.totalMesAnterior > 0
    ? Math.round(((d.totalMes - d.totalMesAnterior) / d.totalMesAnterior) * 100)
    : null;
  const totalSocios = Math.max(1, (d.sociosActivos || 0) + (d.vencidos || 0));
  const alDia = Math.max(0, (d.sociosActivos || 0) - porVencer.length);
  const estados = [
    { t: 'Al día', n: alDia, c: 'verde' },
    { t: 'Por vencer', n: porVencer.length, c: 'ambar' },
    { t: 'Vencidas', n: d.vencidos || 0, c: 'rojo' },
  ];
  const proximos = vencidosLista.slice(0, 3).map((s) => ({ s: s, tipo: 'rojo' }))
    .concat(porVencer.slice(0, 5).map((s) => ({ s: s, tipo: 'ambar' }))).slice(0, 5);

  return (
    <div className="rs-wrap">
      <div className="rs-main">
        <div className="rs-top">
          <div>
            <h2>¡{saludo()}!</h2>
            <p>Esto es lo que pasa hoy en {nombreGym}.</p>
          </div>
          <button type="button" className="rs-campana" onClick={ir('socios')} title="Ver alertas">
            {IcoCampana}
            {alertas > 0 && <span className="rs-badge">{alertas}</span>}
          </button>
        </div>

        <section className="rs-pasteles">
          <div className="rs-pastel rs-p-violeta">
            <div className="rs-p-ico">{IcoSocios}</div>
            <div className="rs-p-tit">Socios activos</div>
            <div className="rs-p-num">{d.sociosActivos}</div>
            <div className="rs-p-chips">
              <span>+{d.nuevosMes} este mes</span>
              <span>{porVencer.length} por vencer</span>
            </div>
          </div>
          <div className="rs-pastel rs-p-naranja">
            <div className="rs-p-ico">{IcoDinero}</div>
            <div className="rs-p-tit">Ingresos del mes</div>
            <div className="rs-p-num">{pesos(d.totalMes)}</div>
            <div className="rs-p-chips">
              <span>{totalPagos} pagos</span>
              <span>
                {variacion !== null
                  ? (variacion >= 0 ? '▲ ' : '▼ ') + Math.abs(variacion) + '% vs mes anterior'
                  : 'Sin mes anterior'}
              </span>
            </div>
          </div>
          <div className="rs-pastel rs-p-verde">
            <div className="rs-p-ico">{IcoEntradas}</div>
            <div className="rs-p-tit">Entradas hoy</div>
            <div className="rs-p-num">{d.entradasHoy}</div>
            <div className="rs-p-chips">
              <span>{totalSemana} esta semana</span>
              <span>~{promedio} por día</span>
            </div>
          </div>
        </section>

        <div className="rs-fila2">
          <section className="panel">
            <div className="rs-cab">
              <h3>Asistencia de la semana</h3>
              <span className="rs-tag-gris">Últimos 7 días</span>
            </div>
            <GraficoAsistencia datos={semana} />
          </section>

          <section className="panel rs-estado">
            <div className="rs-cab">
              <h3>Estado de las cuotas</h3>
            </div>
            {estados.map((e) => (
              <div className="rs-est-fila" key={e.t}>
                <div className="rs-est-txt">
                  <span>{e.t}</span>
                  <strong>{e.n}</strong>
                </div>
                <div className="rs-pista">
                  <span className={'rs-relleno rs-r-' + e.c} style={{ width: Math.min(100, Math.round((e.n / totalSocios) * 100)) + '%' }} />
                </div>
              </div>
            ))}
            <button type="button" className="rs-link" onClick={ir('pagos')}>Ir a pagos →</button>
          </section>
        </div>

        <div className="rs-fila3">
          <section className="panel">
            <div className="rs-cab">
              <h3>Próximos vencimientos</h3>
              <button type="button" className="rs-link" onClick={ir('socios')}>Ver todos</button>
            </div>
            {proximos.length === 0 ? (
              <p className="vacio">No hay cuotas vencidas ni por vencer.</p>
            ) : (
              <ul className="rs-items">
                {proximos.map((x) => (
                  <li key={x.tipo + x.s.id}>
                    {x.s.vencimiento ? <ChipFecha iso={x.s.vencimiento} tipo={x.tipo} /> : <span className="rs-chip-fecha rs-chip-gris"><b>—</b></span>}
                    <span className="rs-item-txt">{x.s.nombre}<small>{x.tipo === 'rojo' ? 'Vencida' : 'Por vencer'} · {x.s.dni}</small></span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="rs-cab">
              <h3>Últimos pagos</h3>
              <button type="button" className="rs-link" onClick={ir('pagos')}>Ver pagos</button>
            </div>
            {!(d.ultimosPagos || []).length ? (
              <p className="vacio">Sin pagos registrados.</p>
            ) : (
              <ul className="rs-items">
                {d.ultimosPagos.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <span className="rs-avatar">{String((p.usuario && p.usuario.nombre) || '?').trim().charAt(0).toUpperCase()}</span>
                    <span className="rs-item-txt">{p.usuario && p.usuario.nombre}<small>{etiquetaMetodo(p.metodo)} · {fechaCorta(p.pagadoEn)}</small></span>
                    <strong>{pesos(p.monto)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="rs-cab">
              <h3>Cobros por método</h3>
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
                        <strong>{pesos(m.total)}</strong>
                      </div>
                      <div className="rs-pista"><span className="rs-relleno rs-r-marca" style={{ width: pct + '%' }} /></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      <aside className="rs-lado">
        <section className="panel rs-gym">
          <div className="rs-gym-logo">
            {logo ? <img src={logo} alt="" /> : <span>{nombreGym.trim().charAt(0).toUpperCase()}</span>}
          </div>
          <h3>{nombreGym}</h3>
          <div className="rs-gym-stats">
            <div><small>Socios</small><strong>{d.sociosActivos}</strong></div>
            <div><small>Hoy</small><strong>{d.entradasHoy}</strong></div>
            <div><small>Vencidas</small><strong>{d.vencidos}</strong></div>
          </div>
        </section>
        <Calendario porVencer={porVencer} vencidos={vencidosLista} />
      </aside>
    </div>
  );
}
