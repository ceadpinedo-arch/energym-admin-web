import { useEffect, useState } from 'react';
import { login, apiGet } from './api';
import Socios from './Socios';
import Gimnasio from './Gimnasio';
import CheckIn from './CheckIn';
import './App.css';

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
      setError('DNI o contraseña incorrectos.');
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

function Dashboard({ token, gimnasioInicial, onLogout }) {
  const [socios, setSocios] = useState([]);
  const [resumen, setResumen] = useState({ totalMes: 0 });
  const [gimnasio, setGimnasio] = useState(gimnasioInicial);
  const [tab, setTab] = useState('resumen');

  const cargar = async () => {
    apiGet('/api/socios', token).then(setSocios).catch(console.error);
    apiGet('/api/pagos/resumen', token).then(setResumen).catch(console.error);
  };

  useEffect(() => { cargar(); }, [token]);

  const vencidos = socios.filter((s) => s.estadoPago === 'VENCIDO').length;

  return (
    <div className="dashboard">
      <header>
        <h1>{gimnasio?.nombre || 'Energym'}</h1>
        <button onClick={onLogout}>Salir</button>
      </header>

      <nav className="tabs">
        <button className={tab === 'resumen' ? 'activo' : ''} onClick={() => setTab('resumen')}>Resumen</button>
        <button className={tab === 'socios' ? 'activo' : ''} onClick={() => setTab('socios')}>Socios</button>
        <button className={tab === 'gimnasio' ? 'activo' : ''} onClick={() => setTab('gimnasio')}>Gimnasio</button>
      </nav>

      {tab === 'resumen' && (
        <>
          <section className="stats">
            <div className="stat-card">
              <span>Socios activos</span>
              <strong>{socios.length}</strong>
            </div>
            <div className="stat-card">
              <span>Ingresos del mes</span>
              <strong>${(resumen.totalMes || 0).toLocaleString('es-AR')}</strong>
            </div>
            {vencidos > 0 && (
              <div className="stat-card stat-warn">
                <span>Cuotas vencidas</span>
                <strong>{vencidos}</strong>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'socios' && <Socios token={token} socios={socios} onRefresh={cargar} />}

      {tab === 'gimnasio' && (
        <Gimnasio token={token} gimnasio={gimnasio} onUpdate={setGimnasio} />
      )}
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
