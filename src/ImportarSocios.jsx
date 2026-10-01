import { useState } from 'react';
import { apiPost } from './api';

const TANDA = 100;

const norm = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const ALIAS = {
  dni: ['dni', 'documento', 'doc', 'nro documento', 'numero de documento'],
  nombre: ['nombre', 'nombre y apellido', 'apellido y nombre', 'nombre completo', 'socio', 'cliente'],
  apellido: ['apellido', 'apellidos'],
  email: ['email', 'e-mail', 'mail', 'correo', 'correo electronico'],
  telefono: ['telefono', 'celular', 'cel', 'tel', 'whatsapp', 'movil'],
  password: ['password', 'contrasena', 'clave'],
};

const soloDigitos = (v) => String(v || '').replace(/\D/g, '');
const emailOk = (v) => /\S+@\S+\.\S+/.test(v) && !/\s/.test(v);

async function leerArchivo(file) {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch (e) {
    return new TextDecoder('windows-1252').decode(buf);
  }
}

function parseCSV(texto) {
  const primera = texto.split(/\r?\n/, 1)[0] || '';
  const delim = [';', ',', '\t']
    .map((d) => [d, primera.split(d).length])
    .sort((a, b) => b[1] - a[1])[0][0];
  const filas = [];
  let fila = [];
  let campo = '';
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else comillas = false;
      } else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === delim) { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

function analizar(filas) {
  if (!filas.length) return { validas: [], errores: [{ linea: 1, motivo: 'el archivo está vacío' }] };
  const col = {};
  filas[0].map(norm).forEach((h, i) => {
    Object.keys(ALIAS).forEach((campo) => {
      if (col[campo] === undefined && ALIAS[campo].includes(h)) col[campo] = i;
    });
  });
  if (col.dni === undefined || col.nombre === undefined) {
    return { validas: [], errores: [{ linea: 1, motivo: 'la primera fila tiene que traer las columnas dni y nombre' }] };
  }
  const validas = [];
  const errores = [];
  const vistos = new Set();
  for (let i = 1; i < filas.length; i++) {
    const f = filas[i];
    if (f.every((x) => String(x).trim() === '')) continue;
    const get = (campo) => (col[campo] === undefined ? '' : String(f[col[campo]] || '').trim());
    const dni = soloDigitos(get('dni'));
    let nombre = get('nombre');
    if (get('apellido')) nombre = (nombre + ' ' + get('apellido')).trim();
    nombre = nombre.slice(0, 80);
    const email = get('email');
    const telefono = soloDigitos(get('telefono')).replace(/^0+/, '');
    const password = get('password');
    let motivo = '';
    if (dni.length < 6 || dni.length > 9) motivo = 'DNI inválido';
    else if (nombre.length < 2) motivo = 'falta el nombre';
    else if (email && !emailOk(email)) motivo = 'email inválido';
    else if (telefono && (telefono.length < 6 || telefono.length > 15)) motivo = 'teléfono inválido';
    else if (password && password.length < 4) motivo = 'contraseña muy corta (mínimo 4)';
    else if (vistos.has(dni)) motivo = 'DNI repetido en el archivo';
    if (motivo) {
      errores.push({ linea: i + 1, dni: get('dni'), motivo });
      continue;
    }
    vistos.add(dni);
    validas.push({ dni, nombre, email, telefono, password });
  }
  return { validas, errores };
}

export default function ImportarSocios({ token, onDone }) {
  const [abierto, setAbierto] = useState(false);
  const [archivo, setArchivo] = useState('');
  const [analisis, setAnalisis] = useState(null);
  const [passwordInicial, setPasswordInicial] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const onArchivo = async (e) => {
    const file = e.target.files && e.target.files[0];
    setResultado(null);
    setError('');
    setAnalisis(null);
    if (!file) return;
    setArchivo(file.name);
    try {
      setAnalisis(analizar(parseCSV(await leerArchivo(file))));
    } catch (err) {
      setError('No se pudo leer el archivo.');
    }
    e.target.value = '';
  };

  const descargarPlantilla = () => {
    const csv = 'dni;nombre;email;telefono;contraseña\n30111222;Ana Pérez;ana@mail.com;3731123456;\n28333444;Luis Gómez;;;\n';
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-socios.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importar = async () => {
    if (!analisis || !analisis.validas.length) return;
    setEnviando(true);
    setError('');
    let creados = 0;
    let yaExistian = 0;
    const erroresServidor = [];
    try {
      for (let i = 0; i < analisis.validas.length; i += TANDA) {
        const r = await apiPost('/api/socios/importar', token, {
          socios: analisis.validas.slice(i, i + TANDA),
          passwordInicial: passwordInicial.trim(),
        });
        if (!r || typeof r.creados !== 'number') throw new Error('respuesta inesperada');
        creados += r.creados;
        yaExistian += r.yaExistian;
        (r.errores || []).forEach((x) => erroresServidor.push(x));
      }
      setResultado({ creados, yaExistian, errores: erroresServidor });
      setAnalisis(null);
    } catch (err) {
      setError('La importación se cortó. Revisá la lista de socios antes de reintentar: los que ya se crearon se saltean solos.');
    } finally {
      setEnviando(false);
      if (onDone) await onDone();
    }
  };

  return (
    <section className="panel" style={{ marginBottom: 16 }}>
      <div className="acciones" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Importar socios desde Excel / CSV</h3>
        <button onClick={() => setAbierto(!abierto)}>{abierto ? 'Cerrar' : 'Importar CSV'}</button>
      </div>

      {abierto && (
        <div style={{ marginTop: 12 }}>
          <p className="vacio">
            Guardá tu Excel como «CSV UTF-8». Las columnas dni y nombre son obligatorias;
            email, telefono y contraseña son opcionales. Se pueden separar con coma o punto y coma.
          </p>
          <div className="acciones" style={{ margin: '12px 0' }}>
            <button onClick={descargarPlantilla}>Descargar plantilla</button>
            <input type="file" accept=".csv,text/csv" onChange={onArchivo} />
          </div>
          <input
            type="text"
            placeholder="Contraseña inicial (si la dejás vacía, usan su DNI)"
            value={passwordInicial}
            onChange={(e) => setPasswordInicial(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 44, padding: '0 12px', borderRadius: 12 }}
          />

          {error && <p className="error">{error}</p>}

          {analisis && (
            <div style={{ marginTop: 12 }}>
              <p><strong>{archivo}</strong>: {analisis.validas.length} filas listas, {analisis.errores.length} con errores.</p>
              {analisis.validas.length > 0 && (
                <ul className="lista">
                  {analisis.validas.slice(0, 5).map((s) => (
                    <li key={s.dni}>
                      <span>{s.nombre}</span>
                      <span>{s.dni}</span>
                    </li>
                  ))}
                </ul>
              )}
              {analisis.validas.length > 5 && <p className="vacio">y {analisis.validas.length - 5} más…</p>}
              {analisis.errores.length > 0 && (
                <>
                  <p className="error" style={{ marginBottom: 4 }}>Filas que no se van a importar:</p>
                  <ul className="lista">
                    {analisis.errores.slice(0, 10).map((x, i) => (
                      <li key={i}>
                        <span>Fila {x.linea}{x.dni ? ' · ' + x.dni : ''}</span>
                        <span>{x.motivo}</span>
                      </li>
                    ))}
                  </ul>
                  {analisis.errores.length > 10 && <p className="vacio">y {analisis.errores.length - 10} más…</p>}
                </>
              )}
              <div style={{ marginTop: 12 }}>
                <button onClick={importar} disabled={enviando || !analisis.validas.length}>
                  {enviando ? 'Importando...' : 'Importar ' + analisis.validas.length + ' socios'}
                </button>
              </div>
            </div>
          )}

          {resultado && (
            <div style={{ marginTop: 12 }}>
              <p><strong>Listo:</strong> {resultado.creados} socios creados, {resultado.yaExistian} ya existían.</p>
              {resultado.errores.length > 0 && <p className="error">{resultado.errores.length} filas rechazadas por el servidor.</p>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
