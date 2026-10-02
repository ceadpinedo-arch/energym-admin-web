import { useEffect, useState } from 'react';
import { login, apiGet } from './api';
import Socios from './Socios';
import Gimnasio from './Gimnasio';
import Resumen from './Resumen';
import Pagos from './Pagos';
import Ejercicios from './Ejercicios.jsx';
import Rutinas from './Rutinas.jsx';
import ImportarSocios from './ImportarSocios';
import CheckIn from './CheckIn';
import './App.css';
import BotonTema from './Tema.jsx';
import Planes from './Planes.jsx';

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
        <div style={{ display: 'flex', gap: 8 }}>
          <BotonTema />
          <button onClick={onLogout}>Salir</button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'resumen' ? 'activo' : ''} onClick={() => setTab('resumen')}>Resumen</button>
        <button className={tab === 'socios' ? 'activo' : ''} onClick={() => setTab('socios')}>Socios</button>
    	<button className={tab === 'pagos' ? 'activo' : ''} onClick={() => setTab('pagos')}>Pagos</button>
    	<button className={tab === 'ejercicios' ? 'activo' : ''} onClick={() => setTab('ejercicios')}>Ejercicios</button>
    	<button className={tab === 'rutinas' ? 'activo' : ''} onClick={() => setTab('rutinas')}>Rutinas</button>
        <button className={tab === 'gimnasio' ? 'activo' : ''} onClick={() => setTab('gimnasio')}>Gimnasio</button>
      </nav>

      {tab === 'resumen' && <Resumen token={token} />}

  	{tab === 'socios' && (
    	<>
      	<ImportarSocios token={token} onDone={cargar} />
      	<Socios token={token} socios={socios} onRefresh={cargar} gimnasio={gimnasio} />
    	</>
  	)}

      {tab === 'pagos' && <Pagos token={token} />}
      {tab === 'ejercicios' && <Ejercicios token={token} />}
      {tab === 'rutinas' && <Rutinas token={token} socios={socios} gimnasio={gimnasio} />}

  	{tab === 'gimnasio' && (
        <>
          <Gimnasio token={token} gimnasio={gimnasio} onUpdate={setGimnasio} />
          <Planes token={token} />
        </>
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
