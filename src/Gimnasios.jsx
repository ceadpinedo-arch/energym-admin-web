import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from './api';

const soloNum = (v) => String(v || '').split('').filter((c) => c >= '0' && c <= '9').join('');
const fecha = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const vacio = { nombre: '', cuota: '', adminNombre: '', adminDni: '', adminPassword: '' };

export default function Gimnasios({ token }) {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [edit, setEdit] = useState(null);

  const cargar = () => {
    apiGet('/api/superadmin/gimnasios', token).then(setLista).catch(() => setError('No se pudo cargar la lista.'));
  };

  useEffect(() => { cargar(); }, [token]);

  const crear = async () => {
    setError('');
    setOk('');
    const cuota = Number(soloNum(form.cuota));
    const dni = soloNum(form.adminDni);
    if (!form.nombre.trim() || !form.adminNombre.trim() || dni.length < 6 || form.adminPassword.length < 8) {
      setError('Completá el nombre, el administrador, su DNI (6 a 9 números) y una contraseña de al menos 8 caracteres.');
      return;
    }
    const body = {
      nombre: form.nombre.trim(),
      adminNombre: form.adminNombre.trim(),
      adminDni: dni,
      adminPassword: form.adminPassword,
    };
    if (cuota) body.cuota = cuota;
    setGuardando(true);
    try {
      const r = await apiPost('/api/superadmin/gimnasios', token, body);
      setOk('Gimnasio "' + r.nombre + '" creado. Pasale al administrador su DNI (' + r.admin.dni + ') y la contraseña que elegiste.');
      setForm(vacio);
      cargar();
    } catch (e) {
      setError('No se pudo crear. Revisá que el DNI no esté usado por otro usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (g) => {
    setError('');
    setOk('');
    const desactivar = g.activo !== false;
    const msg = desactivar
      ? 'Vas a DESACTIVAR "' + g.nombre + '". Ni el administrador ni los socios van a poder entrar a la app ni al panel. Los datos se conservan. ¿Continuar?'
      : 'Vas a REACTIVAR "' + g.nombre + '". ¿Continuar?';
    if (!window.confirm(msg)) return;
    try {
      await apiPatch('/api/superadmin/gimnasios/' + g.id + '/activo', token, { activo: !desactivar });
      setOk('Gimnasio "' + g.nombre + '" ' + (desactivar ? 'desactivado.' : 'reactivado.'));
      cargar();
    } catch (e) {
      setError('No se pudo cambiar el estado. El gimnasio de tu propia cuenta no se puede desactivar.');
    }
  };

  const abrirEdicion = (g) => {
    setError('');
    setOk('');
    const a = g.admins && g.admins.length > 0 ? g.admins[0] : null;
    const orig = { nombre: g.nombre, cuota: String(g.cuota || ''), adminNombre: a ? a.nombre : '', adminDni: a ? a.dni : '' };
    setEdit({ id: g.id, nombre: orig.nombre, cuota: orig.cuota, adminId: a ? a.id : '', adminNombre: orig.adminNombre, adminDni: orig.adminDni, adminPassword: '', orig: orig });
    window.scrollTo(0, 0);
  };

  const guardarEdicion = async () => {
    setError('');
    setOk('');
    const o = edit.orig;
    const body = {};
    if (edit.nombre.trim() && edit.nombre.trim() !== o.nombre) body.nombre = edit.nombre.trim();
    const cuota = Number(soloNum(edit.cuota));
    if (cuota && String(cuota) !== o.cuota) body.cuota = cuota;
    if (edit.adminId) {
      if (edit.adminNombre.trim() && edit.adminNombre.trim() !== o.adminNombre) body.adminNombre = edit.adminNombre.trim();
      const dni = soloNum(edit.adminDni);
      if (dni && dni !== o.adminDni) body.adminDni = dni;
      if (edit.adminPassword) body.adminPassword = edit.adminPassword;
    }
    if (Object.keys(body).length === 0) {
      setError('No cambiaste nada.');
      return;
    }
    if (body.adminDni && (body.adminDni.length < 6 || body.adminDni.length > 9)) {
      setError('El DNI tiene que tener entre 6 y 9 números.');
      return;
    }
    if (body.adminPassword && body.adminPassword.length < 8) {
      setError('La contraseña nueva tiene que tener al menos 8 caracteres.');
      return;
    }
    if (edit.adminId) body.adminId = edit.adminId;
    try {
      await apiPatch('/api/superadmin/gimnasios/' + edit.id, token, body);
      setOk('Cambios guardados.' + (body.adminPassword ? ' Pasale la contraseña nueva al administrador.' : ''));
      setEdit(null);
      cargar();
      window.scrollTo(0, 0);
    } catch (e) {
      setError('No se pudo guardar. Revisá que el DNI nuevo no lo use otro usuario. Tu propia cuenta no se edita desde acá.');
    }
  };

  return (
    <>
      <section className="panel">
        <h2>Nuevo gimnasio</h2>
        <div className="form-ej">
          <input className="campo" placeholder="Nombre del gimnasio" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input className="campo" inputMode="numeric" placeholder="Cuota mensual ($, opcional)" value={form.cuota} onChange={(e) => setForm({ ...form, cuota: e.target.value })} />
          <input className="campo" placeholder="Nombre del administrador" value={form.adminNombre} onChange={(e) => setForm({ ...form, adminNombre: e.target.value })} />
          <input className="campo" inputMode="numeric" placeholder="DNI del administrador" value={form.adminDni} onChange={(e) => setForm({ ...form, adminDni: e.target.value })} />
          <input className="campo" placeholder="Contraseña inicial (mínimo 8)" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
        </div>
        {error && <p className="error">{error}</p>}
        {ok && <div className="aviso-ok">{ok}</div>}
        <button className="btn-pri" onClick={crear} disabled={guardando}>{guardando ? 'Creando...' : 'Crear gimnasio'}</button>
      </section>

      {edit && (
        <section className="panel">
          <h2>Editar gimnasio</h2>
          <div className="form-ej">
            <input className="campo" placeholder="Nombre del gimnasio" value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} />
            <input className="campo" inputMode="numeric" placeholder="Cuota mensual ($)" value={edit.cuota} onChange={(e) => setEdit({ ...edit, cuota: e.target.value })} />
            {edit.adminId ? (
              <>
                <input className="campo" placeholder="Nombre del administrador" value={edit.adminNombre} onChange={(e) => setEdit({ ...edit, adminNombre: e.target.value })} />
                <input className="campo" inputMode="numeric" placeholder="DNI del administrador" value={edit.adminDni} onChange={(e) => setEdit({ ...edit, adminDni: e.target.value })} />
                <input className="campo" placeholder="Contraseña nueva (vacío = no se cambia)" value={edit.adminPassword} onChange={(e) => setEdit({ ...edit, adminPassword: e.target.value })} />
              </>
            ) : (
              <p>Este gimnasio no tiene administrador.</p>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn-pri" onClick={guardarEdicion}>Guardar cambios</button>
          <button className="btn-sec" onClick={() => setEdit(null)}>Cancelar</button>
        </section>
      )}
      <section className="panel">
        <h2>Gimnasios ({lista.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Gimnasio</th><th>Socios</th><th>Administrador</th><th>Estado</th><th></th><th>Alta</th></tr>
            </thead>
            <tbody>
              {lista.map((g) => (
                <tr key={g.id}>
                  <td>{g.nombre}</td>
                  <td>{g.socios}</td>
                  <td>{g.admins.map((a) => a.nombre + ' (' + a.dni + ')').join(', ') || '-'}</td>
                  <td>{g.activo === false ? <span className="chico">Desactivado</span> : <span className="chico">Activo</span>} <button className="btn-sec" onClick={() => cambiarEstado(g)}>{g.activo === false ? 'Reactivar' : 'Desactivar'}</button></td>
                  <td><button className="btn-sec" onClick={() => abrirEdicion(g)}>Editar</button></td>
                  <td>{fecha(g.creadoEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
