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

  let ruta = `imagenes/${producto}/${tipo}/`;
  if (tipo === "Prediccion" && subtipo) {
    ruta += `${subtipo}/`;
  } else if (tipo === "Prediccion") {
    return;
  }

  // Supongamos que hay 3 gráficos por carpeta (puedes cambiar esto)
  const totalImagenes = 3;

  for (let i = 1; i <= totalImagenes; i++) {
    const img = document.createElement("img");
    img.src = `${ruta}grafico${i}.png`;
    img.onerror = () => img.remove(); // Elimina si no existe
    contenedor.appendChild(img);
  }
}
