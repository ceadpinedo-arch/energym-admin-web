import Cobros from './Cobros.jsx';
import Kiosco from './Kiosco.jsx';
import { useEffect, useState } from 'react';
import { login, apiGet } from './api';
import Socios from './Socios';
import Gimnasio from './Gimnasio';
import Resumen from './Resumen';
import Estadisticas from './Estadisticas.jsx';
import Pagos from './Pagos';
import Ejercicios from './Ejercicios.jsx';
import Rutinas from './Rutinas.jsx';
import ImportarSocios from './ImportarSocios';
import CheckIn from './CheckIn';
import './App.css';
import './Menu.css';
import BotonTema from './Tema.jsx';
import Planes from './Planes.jsx';
import Gimnasios from './Gimnasios.jsx';

function LoginForm({ onLogin }) {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = await login(dni, password);
      if (data.usuario.rol !== 'ADMIN') {
        setError('Esta cuenta no es de administrador.');
        return;
      }
      onLogin(data);
    } catch (err) {
      setError(err && err.message && err.message.indexOf('suspendido') >= 0 ? err.message : 'DNI o contrase\u00f1a incorrectos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={enviar}>
        <h1>Energym Admin</h1>
        <input placeholder="DNI" value={dni} onChange={(e) => setDni(e.target.value)} />
        <input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={cargando}>{cargando ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
    </div>
  );
}

function Ico(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {props.children}
    </svg>
  );
}

const IcoResumen = (
  <Ico>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </Ico>
);
const IcoSocios = (
  <Ico>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c2.2.7 3.5 2.6 3.5 5.6" />
  </Ico>
);
const IcoPagos = (
  <Ico>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
    <path d="M2.5 10h19M6.5 15h3" />
  </Ico>
);
const IcoEstadisticas = (
  <Ico>
    <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
  </Ico>
);
const IcoEjercicios = (
  <Ico>
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
  </Ico>
);
const IcoRutinas = (
  <Ico>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
  </Ico>
);
const IcoGimnasio = (
  <Ico>
    <path d="M4 20V8l8-5 8 5v12" />
    <path d="M9 20v-6h6v6M3 20h18" />
  </Ico>
);
const IcoIngreso = (
  <Ico>
    <path d="M14 4h5v16h-5" />
    <path d="M3 12h11M10 8l4 4-4 4" />
  </Ico>
);
const IcoCobros = (
  <Ico>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9z" />
    <path d="M19 9.5h-3.5a1.8 1.8 0 0 0 0 3.6H19" />
  </Ico>
);
const IcoGimnasios = (
  <Ico>
    <path d="M3 21V9l5-3v15M8 21V4l7 3v14M15 21V11l6 2v8M2 21h20" />
  </Ico>
);

function Dashboard({ token, gimnasioInicial, onLogout }) {
  const [socios, setSocios] = useState([]);
  const [resumen, setResumen] = useState({ totalMes: 0 });
  const [gimnasio, setGimnasio] = useState(gimnasioInicial);
  const [tab, setTab] = useState(window.location.search.indexOf('mp=') >= 0 ? 'cobros' : 'resumen');
  const [esSuper, setEsSuper] = useState(false);

  const cargar = async () => {
    apiGet('/api/socios', token).then(setSocios).catch(console.error);
    apiGet('/api/pagos/resumen', token).then(setResumen).catch(console.error);
  };

  useEffect(() => { cargar(); }, [token]);
  useEffect(() => { apiGet('/api/superadmin/yo', token).then((r) => setEsSuper(!!r.super)).catch(() => setEsSuper(false)); }, [token]);

  const vencidos = socios.filter((s) => s.estadoPago === 'VENCIDO').length;

  const items = [
    { id: 'resumen', texto: 'Resumen', icono: IcoResumen },
    { id: 'socios', texto: 'Socios', icono: IcoSocios },
    { id: 'pagos', texto: 'Pagos', icono: IcoPagos },
  ];
  if (!esSuper) items.push({ id: 'estadisticas', texto: 'Estadísticas', icono: IcoEstadisticas });
  items.push({ id: 'ejercicios', texto: 'Ejercicios', icono: IcoEjercicios });
  items.push({ id: 'rutinas', texto: 'Rutinas', icono: IcoRutinas });
  items.push({ id: 'gimnasio', texto: 'Gimnasio', icono: IcoGimnasio });
  if (!esSuper) items.push({ id: 'kiosco', texto: 'Ingreso DNI', icono: IcoIngreso });
  if (!esSuper) items.push({ id: 'cobros', texto: 'Cobros', icono: IcoCobros });
  if (esSuper) items.push({ id: 'gimnasios', texto: 'Gimnasios', icono: IcoGimnasios });

  const actual = items.filter((x) => x.id === tab)[0];
  const nombreGym = (gimnasio && gimnasio.nombre) || 'Energym';
  const logo = gimnasio && gimnasio.logoUrl ? gimnasio.logoUrl : null;

  return (
    <div className="app-shell">
      <aside className="side">
        <div className="side-logo">
          <div className="side-logo-img">
            {logo ? <img src={logo} alt="" /> : <span>{nombreGym.trim().charAt(0).toUpperCase()}</span>}
          </div>
          <strong>{nombreGym}</strong>
        </div>
        <nav className="side-nav">
          {items.map((it) => (
            <button key={it.id} type="button" className={'side-item' + (tab === it.id ? ' activo' : '')} onClick={() => setTab(it.id)}>
              {it.icono}
              <span>{it.texto}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="dashboard contenido">
        <header>
          <h1>{actual ? actual.texto : nombreGym}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <BotonTema />
            <button onClick={onLogout}>Salir</button>
          </div>
        </header>

        {tab === 'resumen' && <Resumen token={token} gimnasio={gimnasio} onIr={setTab} />}

        {tab === 'socios' && (
          <>
            <ImportarSocios token={token} onDone={cargar} />
            <Socios token={token} socios={socios} onRefresh={cargar} gimnasio={gimnasio} />
          </>
        )}

        {tab === 'pagos' && <Pagos token={token} />}
        {tab === 'estadisticas' && <Estadisticas token={token} />}
        {tab === 'kiosco' && <Kiosco token={token} />}
        {tab === 'cobros' && <Cobros token={token} />}
        {tab === 'gimnasios' && esSuper && <Gimnasios token={token} />}
        {tab === 'ejercicios' && <Ejercicios token={token} />}
        {tab === 'rutinas' && <Rutinas token={token} socios={socios} gimnasio={gimnasio} />}

        {tab === 'gimnasio' && (
          <>
            <Gimnasio token={token} gimnasio={gimnasio} onUpdate={setGimnasio} />
            <Planes token={token} />
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  if (window.location.pathname === '/checkin') {
    return <CheckIn />;
  }

  const [sesion, setSesion] = useState(() => {
    const guardada = localStorage.getItem('energym-admin-token');
    return guardada ? JSON.parse(guardada) : null;
  });

  const onLogin = (data) => {
    const sesionData = { token: data.token, gimnasio: data.usuario.gimnasio };
    localStorage.setItem('energym-admin-token', JSON.stringify(sesionData));
    setSesion(sesionData);
  };

  const onLogout = () => {
    localStorage.removeItem('energym-admin-token');
    setSesion(null);
  };

  if (!sesion) return <LoginForm onLogin={onLogin} />;
  return <Dashboard token={sesion.token} gimnasioInicial={sesion.gimnasio} onLogout={onLogout} />;
}

export default App;
