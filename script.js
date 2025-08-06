let imagenesData = {};  // Aquí guardaremos la data cargada desde JSON

// Cargar JSON al iniciar la página
window.addEventListener('DOMContentLoaded', () => {
  fetch('imagenes.json')
    .then(response => response.json())
    .then(data => {
      imagenesData = data;
      // Opcional: cargar gráficos si ya hay selección previa
      mostrarGraficos();
    })
    .catch(error => {
      console.error('Error cargando imagenes.json:', error);
      const contenedor = document.getElementById("contenedor-imagenes");
      contenedor.innerHTML = "<p>Error cargando datos de imágenes.</p>";
    });
});

function cambiarProducto() {
  document.getElementById("subtipo-container").style.display = "none";
  document.getElementById("subtipo").value = "";
  mostrarGraficos();
}

function cambiarTipo() {
  const tipo = document.getElementById("tipo").value;
  const subtipoContainer = document.getElementById("subtipo-container");

  if (tipo === "Prediccion") {
    subtipoContainer.style.display = "inline";
  } else {
    subtipoContainer.style.display = "none";
    mostrarGraficos();
  }
}

function mostrarGraficos() {
  const producto = document.getElementById("producto").value;
  const tipo = document.getElementById("tipo").value;
  const subtipo = document.getElementById("subtipo").value;

  const contenedor = document.getElementById("contenedor-imagenes");
  contenedor.innerHTML = "";

  if (!producto || !tipo) return;

  let listaImagenes = [];

  if (tipo === "Prediccion") {
    if (!subtipo) return;
    listaImagenes = imagenesData[producto]?.Prediccion?.[subtipo] || [];
  } else {
    listaImagenes = imagenesData[producto]?.[tipo] || [];
  }

  if (listaImagenes.length === 0) {
    contenedor.innerHTML = "<p>No hay imágenes para mostrar</p>";
    return;
  }

  listaImagenes.forEach(nombreImg => {
    if (!nombreImg) return; // Ignorar cadenas vacías
    const img = document.createElement("img");
    let ruta = `imagenes/${producto}/${tipo}/`;
    if (tipo === "Prediccion") {
      ruta += `${subtipo}/`;
    }
    img.src = ruta + encodeURIComponent(nombreImg);
    img.alt = nombreImg;
    img.style.width = "300px";
    img.style.margin = "10px";
    contenedor.appendChild(img);
  });
}




