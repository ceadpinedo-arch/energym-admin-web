import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { telefonoValido, waLink } from './wa.js';

const etiqueta = (g) => String(g).charAt(0) + String(g).slice(1).toLowerCase().split('_').join(' ');
const itemVacio = { ejercicioId: '', dia: '', series: 4, repeticiones: '10-12' };

export default function Rutinas({ token, socios, gimnasio }) {
  const [plantillas, setPlantillas] = useState([]);
  const [ejercicios, setEjercicios] = useState([]);
  const [ed, setEd] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);
  const [asig, setAsig] = useState({});

  const cargar = () => {
    apiGet('/api/admin/plantillas', token).then(setPlantillas).catch(() => setError('No se pudieron cargar las rutinas.'));
  };

  useEffect(() => {
    cargar();
    apiGet('/api/admin/ejercicios', token).then(setEjercicios).catch(console.error);
  }, [token]);

  const porGrupo = {};
  ejercicios.forEach((e) => {
    (porGrupo[e.grupoMuscular] = porGrupo[e.grupoMuscular] || []).push(e);
  });
  const grupos = Object.keys(porGrupo).sort();

  const nueva = () => { setAviso(null); setError(''); setEd({ id: null, nombre: '', items: [{ ...itemVacio }] }); };

  const editar = (p) => {
    setAviso(null);
    setError('');
    setEd({
      id: p.id,
      nombre: p.nombre,
      items: p.items.map((it) => ({ ejercicioId: it.ejercicioId, dia: it.dia || '', series: it.series, repeticiones: it.repeticiones })),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setItem = (idx, campo, valor) => {
    setEd({ ...ed, items: ed.items.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)) });
  };

  const agregarItem = () => {
    const ultimo = ed.items.length ? ed.items[ed.items.length - 1].dia : '';
    setEd({ ...ed, items: [...ed.items, { ...itemVacio, dia: ultimo }] });
  };

  const quitarItem = (idx) => setEd({ ...ed, items: ed.items.filter((it, i) => i !== idx) });

  const moverItem = (idx, d) => {
    const j = idx + d;
    if (j < 0 || j >= ed.items.length) return;
    const copia = ed.items.slice();
    const t = copia[idx];
    copia[idx] = copia[j];
    copia[j] = t;
    setEd({ ...ed, items: copia });
  };

  const guardar = async () => {
    setError('');
    if (!ed.nombre.trim()) { setError('Poné un nombre para la rutina.'); return; }
    if (ed.items.length === 0) { setError('Agregá al menos un ejercicio.'); return; }
    if (ed.items.some((it) => !it.ejercicioId)) { setError('Elegí el ejercicio en todas las filas.'); return; }
    const body = {
      nombre: ed.nombre.trim(),
      items: ed.items.map((it) => {
        const s = parseInt(it.series, 10);
        return {
          ejercicioId: it.ejercicioId,
          dia: String(it.dia || '').trim() || null,
          series: isNaN(s) ? 4 : s,
          repeticiones: String(it.repeticiones || '10-12').trim() || '10-12',
        };
      }),
    };
    try {
      if (ed.id) await apiPut('/api/admin/plantillas/' + ed.id, token, body);
      else await apiPost('/api/admin/plantillas', token, body);
      setEd(null);
      cargar();
    } catch (e) {
      setError('No se pudo guardar la rutina.');
    }
  };

  const borrar = async (p) => {
    if (!window.confirm('¿Borrar la rutina "' + p.nombre + '"? Las rutinas ya asignadas a socios no cambian.')) return;
    try {
      await apiDelete('/api/admin/plantillas/' + p.id, token);
      cargar();
    } catch (e) {
      setError('No se pudo borrar la rutina.');
    }
  };

  const asignar = async (p) => {
    const socioId = asig[p.id];
    if (!socioId) { setError('Elegí un socio.'); return; }
    setError('');
    const s = socios.find((x) => x.id === socioId);
    try {
      await apiPost('/api/admin/socios/' + socioId + '/asignar-rutina', token, { plantillaId: p.id });
      const primero = String(s.nombre || '').split(' ')[0];
      const texto = 'Hola ' + primero + '! Ya cargué tu rutina "' + p.nombre + '" en la app de ' + ((gimnasio && gimnasio.nombre) || 'el gimnasio') + '. Abrila y empezá cuando quieras 💪';
      setAviso({
        msg: 'Rutina "' + p.nombre + '" asignada a ' + s.nombre + '.',
        wa: telefonoValido(s.telefono) ? waLink(s.telefono, texto) : null,
      });
    } catch (e) {
      setError('No se pudo asignar la rutina.');
    }
  };

  return (
    <>
      {aviso && (
        <div className="aviso-ok">
          {aviso.msg}{' '}
          {aviso.wa
            ? <a href={aviso.wa} target="_blank" rel="noreferrer">Avisarle por WhatsApp</a>
            : '(No tiene teléfono cargado, no puedo armar el WhatsApp.)'}
        </div>
      )}
      {error && <p className="error">{error}</p>}

      {ed && (
        <section className="panel">
          <h3>{ed.id ? 'Editar rutina' : 'Nueva rutina'}</h3>
          {ejercicios.length === 0 && <p className="error">Primero cargá ejercicios en la pestaña Ejercicios.</p>}
          <input className="campo" placeholder="Nombre de la rutina (ej: Principiante 3 días)" value={ed.nombre} onChange={(e) => setEd({ ...ed, nombre: e.target.value })} />
          <datalist id="dias-sugeridos">
            <option value="Día A" /><option value="Día B" /><option value="Día C" /><option value="Día D" />
          </datalist>
          <div style={{ marginTop: 12 }}>
            {ed.items.map((it, idx) => (
              <div className="item-fila" key={idx}>
                <select className="campo" value={it.ejercicioId} onChange={(e) => setItem(idx, 'ejercicioId', e.target.value)}>
                  <option value="">Elegí un ejercicio…</option>
                  {grupos.map((g) => (
                    <optgroup key={g} label={etiqueta(g)}>
                      {porGrupo[g].map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                    </optgroup>
                  ))}
                </select>
                <input className="campo" list="dias-sugeridos" placeholder="Día (opcional)" value={it.dia} onChange={(e) => setItem(idx, 'dia', e.target.value)} />
                <input className="campo" type="number" min="0" max="50" title="Series" value={it.series} onChange={(e) => setItem(idx, 'series', e.target.value)} />
                <input className="campo" title="Repeticiones" placeholder="Reps" value={it.repeticiones} onChange={(e) => setItem(idx, 'repeticiones', e.target.value)} />
                <div className="acciones">
                  <button className="btn-sec" onClick={() => moverItem(idx, -1)}>↑</button>
                  <button className="btn-sec" onClick={() => moverItem(idx, 1)}>↓</button>
                  <button className="btn-sec" onClick={() => quitarItem(idx)}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="acciones" style={{ marginTop: 8 }}>
            <button className="btn-sec" onClick={agregarItem}>+ Agregar ejercicio</button>
            <button className="btn-pri" onClick={guardar}>Guardar rutina</button>
            <button className="btn-sec" onClick={() => { setEd(null); setError(''); }}>Cancelar</button>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="acciones" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Rutinas modelo</h3>
          <button className="btn-pri" onClick={nueva}>+ Nueva rutina</button>
        </div>
        {plantillas.length === 0 && <p>Todavía no armaste ninguna rutina.</p>}
        {plantillas.map((p) => (
          <div key={p.id} className="plantilla">
            <strong>{p.nombre}</strong>
            <div className="chico">
              {p.items.length} ejercicios: {p.items.map((it) => (it.ejercicio ? it.ejercicio.nombre : '?')).join(' · ')}
            </div>
            <div className="acciones" style={{ marginTop: 8 }}>
              <button className="btn-sec" onClick={() => editar(p)}>Editar</button>
              <button className="btn-sec" onClick={() => borrar(p)}>Borrar</button>
              <select className="campo" style={{ maxWidth: 220 }} value={asig[p.id] || ''} onChange={(e) => setAsig({ ...asig, [p.id]: e.target.value })}>
                <option value="">Asignar a un socio…</option>
                {socios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button className="btn-pri" onClick={() => asignar(p)}>Asignar</button>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
