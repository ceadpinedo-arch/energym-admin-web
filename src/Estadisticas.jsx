import { useEffect, useRef, useState } from 'react';
import { apiGet, apiPut, API_URL } from './api';

const moneda = (n) => '$' + Math.round(n || 0).toLocaleString('es-AR');
const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const mesCorto = (k) => NOMBRES_MES[Number(k.split('-')[1]) - 1];

function Barras({ titulo, datos, formato, nota }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <div className="panel">
      <h3 className="est-titulo">{titulo}</h3>
      <p className="est-sub">{nota || '\u00a0'}</p>
      <div className="est-barras">
        {datos.map((d, i) => (
          <div key={i} className="est-col">
            <div className="est-val">{d.valor > 0 ? (formato ? formato(d.valor) : d.valor) : ''}</div>
            <div className="est-barra" style={{ height: Math.max(3, Math.round((d.valor / max) * 100)) + '%', opacity: d.valor > 0 ? 1 : 0.25 }} />
            <div className="est-et">{d.etiqueta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Texto({ contenido }) {
  const lineas = String(contenido || '').split('\n');
  return (
    <div>
      {lineas.map((l, i) => {
        const t = l.trim();
        if (!t) return <div key={i} style={{ height: 6 }} />;
        const esVineta = /^[*-]\s+/.test(t);
        const limpio = t.replace(/^[*-]\s+/, '').replace(/^#+\s*/, '');
        const partes = limpio.split(/\*\*(.+?)\*\*/g);
        return (
          <div key={i} style={{ paddingLeft: esVineta ? 14 : 0, textIndent: esVineta ? -10 : 0, marginBottom: 2 }}>
            {esVineta ? '• ' : ''}
            {partes.map((p, j) => (j % 2 ? <strong key={j}>{p}</strong> : p))}
          </div>
        );
      })}
    </div>
  );
}

const RAPIDAS = [
  '¿Dónde estoy fallando?',
  'Dame una idea de campaña',
  '¿Cómo ajusto la cuota?',
  'Resumen del mes',
];

export default function Estadisticas({ token }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [gastos, setGastos] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [pregunta, setPregunta] = useState('');
  const [pensando, setPensando] = useState(false);
  const chatRef = useRef(null);

  const cargar = () => {
    apiGet('/api/estadisticas', token)
      .then((r) => { setD(r); setGastos(r.gastosFijosCargados ? String(r.gastosFijosCargados) : ''); setError(''); })
      .catch(() => setError('No se pudieron cargar las estadísticas.'));
  };
  useEffect(() => { cargar(); }, [token]);
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [mensajes, pensando]);

  const guardarGastos = async () => {
    setGuardando(true);
    try {
      await apiPut('/api/estadisticas/gastos', token, { gastosFijos: Number(gastos) || 0 });
      cargar();
    } catch (e) {
      alert('No se pudo guardar el monto.');
    } finally {
      setGuardando(false);
    }
  };

  const preguntar = async (texto) => {
    const q = (texto || pregunta).trim();
    if (!q || pensando) return;
    const historial = mensajes.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    setMensajes((prev) => [...prev, { role: 'user', content: q }]);
    setPregunta('');
    setPensando(true);
    try {
      const res = await fetch(API_URL + '/api/estadisticas/consejero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ pregunta: q, historial }),
      });
      let j = {};
      try { j = await res.json(); } catch (e) { j = {}; }
      const texto2 = res.ok ? j.respuesta : (j.error || 'No se pudo obtener respuesta.');
      setMensajes((prev) => [...prev, { role: 'assistant', content: texto2 }]);
    } catch (e) {
      setMensajes((prev) => [...prev, { role: 'assistant', content: 'No se pudo conectar. Probá de nuevo.' }]);
    } finally {
      setPensando(false);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!d) return <p>Cargando estadísticas...</p>;

  const m = d.meses;
  const act = m[m.length - 1];
  const flecha = (p) => (p === null || p === undefined ? '' : (p > 0 ? '▲ ' : p < 0 ? '▼ ' : '') + p + '% vs mes anterior');
  const k = (v) => (v >= 1000 ? Math.round(v / 1000) + 'k' : v);

  return (
    <div className="est">
      <section className="stats">
        <div className="stat-card"><span>Socios</span><strong>{d.socios.total}</strong></div>
        <div className="stat-card"><span>Activos este mes</span><strong>{act.activos}</strong></div>
        <div className="stat-card"><span>Sin venir hace 30 días</span><strong>{d.socios.sinVenir30dias}</strong></div>
        <div className="stat-card"><span>Ingresos del mes</span><strong>{moneda(act.ingresos)}</strong><small>{flecha(d.mesActualVsAnterior.ingresosPct)}</small></div>
        {d.balance ? (
          <div className={'stat-card' + (d.balance.balanceMesAnterior < 0 ? ' stat-warn' : '')}>
            <span>Balance mes anterior</span><strong>{moneda(d.balance.balanceMesAnterior)}</strong>
          </div>
        ) : null}
      </section>
      <p className="est-nota">{'El mes en curso está incompleto (día ' + d.hoy.diaDelMes + ' de ' + d.hoy.diasDelMes + ').'}</p>

      <div className="est-graficos est-g3">
        <Barras titulo="Socios activos por mes" nota="Con al menos una visita" datos={m.map((x) => ({ etiqueta: mesCorto(x.mes), valor: x.activos }))} />
        <Barras titulo="Altas por mes" nota="Socios nuevos" datos={m.map((x) => ({ etiqueta: mesCorto(x.mes), valor: x.altas }))} />
        <Barras titulo="Ingresos por mes" nota="Pagos cobrados" datos={m.map((x) => ({ etiqueta: mesCorto(x.mes), valor: x.ingresos }))} formato={k} />
      </div>
      <div className="est-graficos est-g2">
        <Barras titulo="Visitas por día de la semana" nota="Últimos 90 días" datos={d.visitasPorDiaSemana90dias.map((x) => ({ etiqueta: x.dia.slice(0, 3), valor: x.visitas }))} />
        <Barras titulo="Visitas por franja horaria" nota="Últimos 90 días" datos={d.visitasPorFranja90dias.map((x) => ({ etiqueta: x.franja.replace(' hs', ''), valor: x.visitas }))} />
      </div>

      <div className="est-dos">
        <div className="panel">
          <h3 className="est-titulo">Gastos fijos del mes</h3>
          <p className="est-sub">Alquiler, sueldos, luz, etc. Sirve para calcular tu balance y cuántos pagos necesitás para no perder plata. Solo lo ves vos.</p>
          <div className="est-gastos">
            <input type="number" min="0" placeholder="Ej: 800000" value={gastos} onChange={(e) => setGastos(e.target.value)} />
            <button className="est-btn" onClick={guardarGastos} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
          </div>
          {d.balance ? (
            <p className="est-resumen">
              {'Mes anterior: ' + moneda(d.balance.ingresosMesAnterior) + ' de ingresos, balance ' + moneda(d.balance.balanceMesAnterior) + (d.balance.margenMesAnteriorPct !== null ? ' (margen ' + d.balance.margenMesAnteriorPct + '%)' : '') + '.'}
              {d.balance.pagosNecesariosPorMesParaEquilibrio ? ' Necesitás unos ' + d.balance.pagosNecesariosPorMesParaEquilibrio + ' pagos por mes para cubrir los gastos.' : ''}
            </p>
          ) : null}
        </div>

        <div className="panel">
          <h3 className="est-titulo">Consejero IA</h3>
          <p className="est-sub">Analiza los números de tu gimnasio y te da ideas sobre campañas, cuotas y balance. Recibe solo totales, sin nombres ni DNI. Son orientaciones, no garantías.</p>
          <div className="est-chips">
            {RAPIDAS.map((r) => (
              <button key={r} className="est-chip" onClick={() => preguntar(r)} disabled={pensando}>{r}</button>
            ))}
          </div>
          <div className="est-chat" ref={chatRef}>
            {mensajes.length === 0 && !pensando ? <p className="est-sub">Tocá una pregunta rápida o escribí la tuya.</p> : null}
            {mensajes.map((x, i) => (
              <div key={i} className={'est-msg ' + (x.role === 'user' ? 'user' : 'ia')}>
                {x.role === 'user' ? x.content : <Texto contenido={x.content} />}
              </div>
            ))}
            {pensando ? <p className="est-sub">Analizando tus números...</p> : null}
          </div>
          <div className="est-envio">
            <input placeholder="Preguntale algo a tu consejero..." value={pregunta} onChange={(e) => setPregunta(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') preguntar(); }} />
            <button className="est-btn" onClick={() => preguntar()} disabled={pensando || !pregunta.trim()}>Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
