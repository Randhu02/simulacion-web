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
  }
  mostrarGraficos();  // Llamar siempre al cambiar tipo para refrescar
}

// Función para cargar y mostrar tabla desde archivo JSON
async function cargarYMostrarTabla(archivoJSON) {
  try {
    const respuesta = await fetch(`data/${archivoJSON}`);
    if (!respuesta.ok) {
      throw new Error(`No se pudo cargar el archivo: ${archivoJSON}`);
    }
    const datos = await respuesta.json();

    const contenedor = document.getElementById("tabla-container");
    contenedor.innerHTML = ""; // Limpiar contenido previo

    if (!Array.isArray(datos) || datos.length === 0) {
      contenedor.innerHTML = "<p>No hay datos para mostrar.</p>";
      return;
    }

    const tabla = document.createElement("table");
    tabla.border = "1";
    tabla.style.borderCollapse = "collapse";
    tabla.style.marginTop = "10px";
    tabla.style.width = "100%";

    // Crear encabezado
    const encabezado = tabla.insertRow();
    Object.keys(datos[0]).forEach(clave => {
      const th = document.createElement("th");
      th.textContent = clave;
      th.style.padding = "5px";
      th.style.backgroundColor = "#eee";
      encabezado.appendChild(th);
    });

    // Crear filas
    datos.forEach(fila => {
      const tr = tabla.insertRow();
      Object.values(fila).forEach(valor => {
        const td = tr.insertCell();
        td.textContent = valor;
        td.style.padding = "5px";
      });
    });

    contenedor.appendChild(tabla);
  } catch (error) {
    console.error("Error al cargar el archivo JSON:", error);
    const contenedor = document.getElementById("tabla-container");
    contenedor.innerHTML = `<p>Error cargando datos: ${error.message}</p>`;
  }
}

function mostrarGraficos() {
  const producto = document.getElementById("producto").value;
  const tipo = document.getElementById("tipo").value;
  const subtipo = document.getElementById("subtipo").value;

  const contenedor = document.getElementById("contenedor-imagenes");
  const contenedorTabla = document.getElementById("tabla-container");
  contenedor.innerHTML = "";
  contenedorTabla.innerHTML = "";

  if (!producto || !tipo) return;

if (tipo === "Tabla") {
  const archivosPorProducto = {
    "Producto_Bobinas": "03_BOBINAS_Mejores_Simulaciones_Todos_Los_Clientes_Combinados.json",
    "Producto_Rollos": "04_Rollos_Apilamiento_Resultado_Completo.json",
    "Producto_Cemento": "06_Resultado_Cemento_Asfaltico.json",
    "Producto_Tubos": "07_TUBOS_Resultado_Apilamiento_Todos.json"
  };

  const archivoJSON = archivosPorProducto[producto];
  if (!archivoJSON) {
    contenedorTabla.innerHTML = "<p>No se encontró el archivo para este producto.</p>";
    return;
  }

  cargarYMostrarTabla(archivoJSON);
  return; // Importante para evitar que siga a la parte de imágenes
}

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






