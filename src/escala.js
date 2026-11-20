// Adapta el panel al tamano de cada pantalla: letras, numeros, botones y columnas escalan juntos.
// En pantallas grandes se agranda, en las chicas se achica un poco, y en celulares queda normal.
// El kiosco (enlace con ?k=) se adapta solo, por eso no se toca.
var BASE = 1600; // ancho en el que el panel se ve "normal"

function aplicar() {
  var raiz = document.getElementById('root');
  if (!raiz) return;
  var esKiosco = new URLSearchParams(window.location.search).has('k');
  var z = 1;
  if (!esKiosco && window.innerWidth > 900) {
	z = Math.max(0.8, Math.min(1.6, window.innerWidth / BASE));
  }
  z = Math.round(z * 100) / 100;
  raiz.style.zoom = String(z);
  document.documentElement.style.setProperty('--z', String(z));
}

var pendiente = false;
function alCambiar() {
  if (pendiente) return;
  pendiente = true;
  window.requestAnimationFrame(function () {
	pendiente = false;
	aplicar();
  });
}

aplicar();
window.addEventListener('resize', alCambiar);
window.addEventListener('load', aplicar);
