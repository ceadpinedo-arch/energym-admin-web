import { useEffect, useState } from 'react';
import { apiGet, apiPut } from './api';

const pesos = (n) => '$' + Number(n || 0).toLocaleString('es-AR');
let cachePlanes = null;

export default function PlanSocio({ token, socioId }) {
  const [planes, setPlanes] = useState(cachePlanes || []);
  const [planId, setPlanId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let vivo = true;
    setMsg('');
    setPlanId('');
    setCargando(true);
    const pPlanes = apiGet('/api/admin/planes', token).then((l) => {
      cachePlanes = l;
      if (vivo) setPlanes(l);
    });
    const pDetalle = apiGet('/api/socios/' + socioId + '/detalle', token).then((d) => {
      if (vivo) setPlanId(d.planId || '');
    });
    Promise.all([pPlanes, pDetalle])
      .catch(console.error)
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [token, socioId]);

  const cambiar = async (valor) => {
    setPlanId(valor);
    setMsg('');
    try {
      await apiPut('/api/admin/socios/' + socioId + '/plan', token, { planId: valor || null });
      setMsg('Plan guardado.');
    } catch (e) {
      setMsg('No se pudo guardar el plan.');
    }
  };

  const plan = planes.find((p) => p.id === planId);

  return (
    <div className="plan-socio">
      <label>Plan de cuota</label>
      <select className="campo" value={planId} disabled={cargando} onChange={(e) => cambiar(e.target.value)}>
        <option value="">{cargando ? 'Cargando…' : 'Sin plan (cuota general del gimnasio)'}</option>
        {planes.map((p) => (
          <option key={p.id} value={p.id}>{p.nombre} · {pesos(p.precio)} · {p.meses} {p.meses === 1 ? 'mes' : 'meses'}</option>
        ))}
      </select>
      {!cargando && plan && <p className="chico">Cada pago suma {plan.meses} {plan.meses === 1 ? 'mes' : 'meses'} de vencimiento y se cobra {pesos(plan.precio)}.</p>}
      {msg && <p className="chico">{msg}</p>}
    </div>
  );
}
