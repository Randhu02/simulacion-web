const imagenesData = {
  "Producto_Bobinas": {
    "Desglose": ["MA-8.png", "MT21.png"],
    "Grafico_general": ["grafico_general.png"],
    "Mapa_calor": ["mapa_calor.png"],
    "Prediccion": {
      "Prediccion_bobinas": ["Área 2 (15x15)_fila_1.png"],
      "Prediccion_cemento": ["Área 2 (15x15)_fila_1.png"],
      "Prediccion_rollos": ["Área 3 (20x15)_fila_1.png"],
      "Prediccion_tubos": []
    }
  },
  "Producto_Tubos": {
    "Desglose": ["Vista_lateral_MAT13.png"],
    "Grafico_general": ["grafico_general.png"],
    "Mapa_calor": ["mapa_calor.png"],
    "Prediccion": {
      "Prediccion_bobinas": ["Área 1 (40x15)_fila_1.png"],
      "Prediccion_cemento": ["Área 1 (40x15)_fila_1.png"],
      "Prediccion_rollos": ["Área 1 (40x15)_fila_1.png"],
      "Prediccion_tubos": ["Área 1 (40x15)_fila_1.png"]
    }
  },
  "Producto_Cemento": {
    "Desglose": [],
    "Grafico_general": ["grafico_general.png"],
    "Mapa_calor": ["mapa_calor.png"],
    "Prediccion": {
      "Prediccion_bobinas": ["Área 3 (20x15)_fila_1.png"],
      "Prediccion_cemento": ["Área 3 (20x15)_fila_1.png"],
      "Prediccion_rollos": ["Área 3 (20x15)_fila_1.png"],
      "Prediccion_tubos": ["Área 3 (20x15)_fila_1.png"]
    }
  },
  "Producto_Rollos": {
    "Desglose": ["imagen_15x15_1x0.png"],
    "Grafico_general": ["grafico_general.png"],
    "Mapa_calor": ["mapa_calor.png"],
    "Prediccion": {
      "Prediccion_bobinas": ["Área 3 (20x15)_fila_1.png"],
      "Prediccion_cemento": ["Área 3 (20x15)_fila_1.png"],
      "Prediccion_rollos": ["Área 3 (20x15)_fila_1.png"],
      "Prediccion_tubos": ["Área 3 (20x15)_fila_1.png"]
    }
  }
};

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
    // Nota: encodeURIComponent para espacios y caracteres especiales en URL
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



