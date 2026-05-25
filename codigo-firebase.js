// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBdiAPbAJ5MZZDYSJYyx9QWpBahcPq156g",
    authDomain: "inventario-ceres.firebaseapp.com",
    databaseURL: "https://inventario-ceres-default-rtdb.firebaseio.com/",
    projectId: "inventario-ceres",
    storageBucket: "inventario-ceres.firebasestorage.app",
    messagingSenderId: "831673885062",
    appId: "1:831673885062:web:d188c71340919255d40c07"
};

// Inicializar Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado correctamente");
} catch (error) {
    console.error("Error al inicializar Firebase:", error);
}

const database = firebase.database();
const auth = firebase.auth();

// Mapeo de productos
const productosItem = {
    "UREA FERTI * 50 KG.": 1,
    "FOSFATO DIAMONICO FERTI * 50 KG.": 2,
    "SULFATO DE AMONIO FERTI * 50 KG.": 3,
    "ADITIVO MARRON - BOLSAS * 20 KG.": 4,
    "NITRATO DE AMONIO * 50 KG.": 5,
    "NITRATO DE AMONIO * 50 KG. - POLIPROPILENO": 6,
    "CLORURO DE POTASIO *50 KG.": 7,
    "NITRO S PREMIUM AMARILLO * 50 KG": 8,
    "SUPER BLUE * 50 KG": 9,
    "NPK 20-20-20 * 50 KG": 10,
    "PAPA SIERRA * 50 KG": 11,
    "ADITIVO AMARILLO * 20KG": 12
};

// Variables globales
let usuarioAutenticado = null;
let modoActual = 'vista';
let stockResumen = {};
let sortableInstance = null;
let movimientosActuales = [];
let itemProductoActual = null;

// ==================== FUNCIONES DE VISUALIZACIÓN ====================

function mostrarInicio() {
    document.getElementById('inicioContainer').style.display = 'flex';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'none';
}

function mostrarLogin() {
    document.getElementById('inicioContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainContainer').style.display = 'none';
}

function mostrarApp(modo) {
    modoActual = modo;
    document.getElementById('inicioContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
    
    actualizarInterfazSegunModo();
    cargarResumenStock();
}

function actualizarInterfazSegunModo() {
    const userEmail = document.getElementById('userEmail');
    const formContainer = document.getElementById('formContainer');
    const btnLogout = document.getElementById('btnLogout');
    const btnCambiar = document.getElementById('btnCambiarModo');
    const infoModo = document.getElementById('infoModo');
    const btnRecalcular = document.getElementById('btnRecalcular');
    
    if (modoActual === 'admin' && usuarioAutenticado) {
        userEmail.textContent = `Modo: Administrador (${usuarioAutenticado.email})`;
        formContainer.style.display = 'block';
        btnLogout.style.display = 'inline-block';
        btnCambiar.textContent = 'Cambiar a Modo Vista';
        btnCambiar.style.background = '#6c757d';
        
        infoModo.innerHTML = `
            <div class="admin-message">
                ✅ <strong>Estás en modo Administrador</strong><br>
                Puedes agregar, editar y eliminar registros.
            </div>
        `;
    } else {
        userEmail.textContent = 'Modo: Visitante (Solo lectura)';
        formContainer.style.display = 'none';
        btnLogout.style.display = 'none';
        btnCambiar.textContent = 'Cambiar a Modo Admin';
        btnCambiar.style.background = '#0d6efd';
        
        infoModo.innerHTML = `
            <div class="vista-message">
                👁️ <strong>Estás en modo Vista</strong><br>
                Solo puedes consultar el inventario.
            </div>
        `;
    }
    
    if (btnRecalcular) {
        btnRecalcular.style.display = 'none';
    }
}

// ==================== FUNCIONES DE UTILIDAD ====================

function formatearNumero(num) {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '-';
    
    try {
        const partes = fechaStr.split('-');
        if (partes.length === 3) {
            const fechaUTC = new Date(Date.UTC(
                parseInt(partes[0]),
                parseInt(partes[1]) - 1,
                parseInt(partes[2])
            ));
            
            return fechaUTC.toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'UTC'
            });
        }
        
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) {
            return fechaStr;
        }
        
        return fecha.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
    } catch (error) {
        console.error("Error formateando fecha:", fechaStr, error);
        return fechaStr;
    }
}

function fechaParaInputDate(fechaStr) {
    if (!fechaStr) return '';
    
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) {
            return fechaStr;
        }
        
        const fechaAjustada = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
        return fechaAjustada.toISOString().split('T')[0];
        
    } catch (error) {
        console.error("Error convirtiendo fecha para input:", fechaStr, error);
        return fechaStr;
    }
}

// ==================== FUNCIÓN PARA RECALCULAR STOCK ====================

async function recalcularStock(itemProducto, nuevosMovimientos) {
    if (!confirm("⚠️ ¿Estás seguro de recalcular el stock?\n\nEsto actualizará todos los stocks según el orden actual de las filas. ¿Deseas continuar?")) {
        return false;
    }
    
    // IMPORTANTE: Mantener el orden que el usuario estableció (NO reordenar por fecha)
    // Recalcular stocks en el orden actual (el que el usuario arrastró)
    let stockAcumulado = 0;
    const movimientosRecalculados = nuevosMovimientos.map((mov, idx) => {
        stockAcumulado = stockAcumulado + mov.ingreso - mov.salida;
        // Actualizar el stock y guardar el ordenManual
        const movActualizado = { 
            ...mov, 
            stock: stockAcumulado,
            ordenManual: idx,  // Guardar el orden manual
            fechaOriginal: mov.fecha  // Preservar fecha original
        };
        console.log(`${idx + 1}. ${mov.fecha} - ${mov.operacion} | Ingreso: ${mov.ingreso} | Salida: ${mov.salida} | Stock: ${stockAcumulado}`);
        return movActualizado;
    });
    
    // Guardar en Firebase (manteniendo el orden manual)
    try {
        await database.ref("inventario/" + itemProducto).set(movimientosRecalculados);
        alert("✅ Stock recalculado correctamente!");
        
        // Recargar la tabla manteniendo el orden manual
        await mostrarTablaConOrdenManual(itemProducto, movimientosRecalculados);
        cargarResumenStock();
        return true;
    } catch (error) {
        alert("❌ Error al guardar: " + error.message);
        return false;
    }
}

// Nueva función para mostrar tabla respetando el orden manual
async function mostrarTablaConOrdenManual(itemProducto, movimientosGuardados) {
    const descripcion = Object.keys(productosItem).find(key => productosItem[key] === itemProducto);
    const contenedor = document.getElementById("contenedorTablas");
    const btnRecalcular = document.getElementById("btnRecalcular");
    
    if (btnRecalcular) {
        btnRecalcular.style.display = 'none';
    }
    
    if (!contenedor) return;
    
    contenedor.innerHTML = "";
    
    // Usar los movimientos ya guardados (con el orden manual)
    let movimientos = [...movimientosGuardados];
    
    // Ordenar por ordenManual si existe, si no, por fecha descendente
    if (movimientos[0] && movimientos[0].ordenManual !== undefined) {
        // Ordenar por ordenManual (el orden que el usuario estableció)
        movimientos.sort((a, b) => (a.ordenManual || 0) - (b.ordenManual || 0));
    } else {
        // Si no hay ordenManual, ordenar por fecha descendente
        movimientos.sort((a, b) => {
            const fechaA = new Date(a.fecha);
            const fechaB = new Date(b.fecha);
            if (fechaA.getTime() !== fechaB.getTime()) {
                return fechaB - fechaA;
            }
            const tsA = a.timestamp || 0;
            const tsB = b.timestamp || 0;
            return tsA - tsB;
        });
    }
    
    const titulo = document.createElement("h3");
    titulo.textContent = `${descripcion} (Orden manual - arrastra las filas)`;
    contenedor.appendChild(titulo);
    
    if (modoActual === 'admin' && usuarioAutenticado) {
        const instruccion = document.createElement("p");
        instruccion.innerHTML = "💡 <strong>Modo administrador:</strong> Arrastra las filas usando las ⋮⋮ para reordenar, luego haz clic en 'Recalcular Stock'";
        instruccion.style.backgroundColor = "#e7f3ff";
        instruccion.style.padding = "8px";
        instruccion.style.borderRadius = "5px";
        instruccion.style.fontSize = "14px";
        contenedor.appendChild(instruccion);
    }
    
    const tabla = document.createElement("table");
    tabla.border = "1";
    tabla.style.width = "100%";
    tabla.style.borderCollapse = "collapse";
    
    let cabecera = `
        <thead>
            <tr>
                <th style="width: 40px;">⋮⋮</th>
                <th>Item</th>
                <th>Fecha</th>
                <th>Operación</th>
                <th>Ingreso</th>
                <th>Salida</th>
                <th>Stock</th>
                <th>Observaciones</th>`;
    
    if (modoActual === 'admin' && usuarioAutenticado) {
        cabecera += `<th>Acción</th>`;
    }
    
    cabecera += `</tr></thead><tbody></tbody>`;
    tabla.innerHTML = cabecera;
    
    const tbody = tabla.querySelector("tbody");
    
    movimientos.forEach((item, index) => {
        const esPrimero = (index === 0);
        const claseDestacada = esPrimero ? 'ultimo-stock' : '';
        
        let fila = `
            <td style="cursor: grab; text-align: center; ${claseDestacada ? 'background-color: #e8f5e9;' : ''}">⋮⋮</td>
            <td class="numero-formateado ${claseDestacada}">${item.item}</td>
            <td ${claseDestacada ? 'class="ultimo-stock"' : ''}>${formatearFecha(item.fecha)}</td>
            <td ${claseDestacada ? 'class="ultimo-stock"' : ''}>${item.operacion}</td>
            <td class="numero-formateado ${claseDestacada}">${formatearNumero(item.ingreso)}</td>
            <td class="numero-formateado ${claseDestacada}">${formatearNumero(item.salida)}</td>
            <td class="numero-formateado ${claseDestacada}"><strong>${formatearNumero(item.stock)}</strong></td>
            <td ${claseDestacada ? 'class="ultimo-stock"' : ''}>${item.observaciones || '-'}</td>`;
        
        if (modoActual === 'admin' && usuarioAutenticado) {
            fila += `
            <td ${claseDestacada ? 'class="ultimo-stock"' : ''}>
                <button class="btn-editar" data-item="${itemProducto}" data-index="${index}">
                    Editar
                </button>
                <button class="btn-eliminar" data-item="${itemProducto}" data-index="${index}">
                    Eliminar
                </button>
            </td>`;
        }
        
        const tr = document.createElement("tr");
        if (claseDestacada) tr.className = claseDestacada;
        tr.setAttribute('data-original-item', JSON.stringify(item));
        tr.innerHTML = fila;
        tbody.appendChild(tr);
    });
    
    contenedor.appendChild(tabla);
    
    if (modoActual === 'admin' && usuarioAutenticado) {
        activarDragAndDrop();
        if (btnRecalcular) {
            btnRecalcular.style.display = 'inline-block';
        }
    }
    
    // Eventos de botones
    if (modoActual === 'admin' && usuarioAutenticado) {
        document.querySelectorAll(".btn-editar").forEach(btn => {
            btn.addEventListener("click", function() {
                const itemProd = this.getAttribute("data-item");
                const idx = this.getAttribute("data-index");
                mostrarModalEditar(parseInt(itemProd), parseInt(idx));
            });
        });
        
        document.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", function() {
                const itemProd = this.getAttribute("data-item");
                const idx = this.getAttribute("data-index");
                eliminarRegistro(parseInt(itemProd), parseInt(idx));
            });
        });
    }
}

// ==================== ACTIVAR DRAG & DROP ====================

function activarDragAndDrop() {
    const tbody = document.querySelector("#contenedorTablas table tbody");
    if (!tbody) return;
    
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    
    sortableInstance = new Sortable(tbody, {
        animation: 300,
        handle: 'td:first-child',
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        onEnd: function() {
            const btnRecalcular = document.getElementById("btnRecalcular");
            if (btnRecalcular) {
                btnRecalcular.style.display = 'inline-block';
                btnRecalcular.style.animation = 'pulse 0.5s';
            }
        }
    });
}

// ==================== FUNCIÓN MOSTRAR TABLA (UNIFICADA) ====================

function mostrarTabla() {
    console.log("Función mostrarTabla() ejecutada - Modo:", modoActual);
    
    const descripcion = document.getElementById("productoFiltro").value;
    const contenedor = document.getElementById("contenedorTablas");
    const btnRecalcular = document.getElementById("btnRecalcular");
    
    if (btnRecalcular) {
        btnRecalcular.style.display = 'none';
    }
    
    if (!contenedor) {
        console.error("ERROR: contenedorTablas no encontrado");
        return;
    }
    
    contenedor.innerHTML = "";

    if (!descripcion) {
        alert("Por favor seleccione un producto");
        return;
    }

    const itemProducto = productosItem[descripcion];
    itemProductoActual = itemProducto;

    database.ref("inventario/" + itemProducto).once("value", snapshot => {
        let movimientos = snapshot.val();

        if (!movimientos || movimientos.length === 0) {
            contenedor.innerHTML = `
                <div class="info-box">
                    <h3>${descripcion}</h3>
                    <p>No hay registros para este producto.</p>
                </div>`;
            return;
        }

        if (!Array.isArray(movimientos)) {
            movimientos = Object.values(movimientos);
        }
        
        movimientosActuales = [...movimientos];
        
        // ========== ORDENAR: PRIORIDAD AL ORDEN MANUAL ==========
        // Verificar si existe ordenManual en los registros
        const tieneOrdenManual = movimientos.some(m => m.ordenManual !== undefined);

        if (tieneOrdenManual) {
            // Ordenar por ordenManual (el orden que el usuario estableció)
            movimientos.sort((a, b) => (a.ordenManual || 0) - (b.ordenManual || 0));
            console.log("📌 Usando orden manual para mostrar");
        } else {
            // Si no hay ordenManual, ordenar por fecha ascendente (antiguo primero)
            movimientos.sort((a, b) => {
                const fechaA = new Date(a.fecha);
                const fechaB = new Date(b.fecha);
                if (fechaA.getTime() !== fechaB.getTime()) {
                    return fechaA - fechaB;  // ← ASCENDENTE (antiguo primero)
                }
                const tsA = a.timestamp || 0;
                const tsB = b.timestamp || 0;
                return tsA - tsB;
            });
            console.log("📅 Usando orden por fecha ascendente para mostrar");
        }

        const titulo = document.createElement("h3");
        titulo.textContent = tieneOrdenManual ? 
            `${descripcion} (Orden manual - arrastra las filas)` : 
            `${descripcion} (Historial - más reciente primero)`;
        contenedor.appendChild(titulo);
        
        // Instrucción para modo admin
        if (modoActual === 'admin' && usuarioAutenticado) {
            const instruccion = document.createElement("p");
            instruccion.innerHTML = "💡 <strong>Modo administrador:</strong> Arrastra las filas usando las ⋮⋮ para reordenar, luego haz clic en 'Recalcular Stock'";
            instruccion.style.backgroundColor = "#e7f3ff";
            instruccion.style.padding = "8px";
            instruccion.style.borderRadius = "5px";
            instruccion.style.fontSize = "14px";
            contenedor.appendChild(instruccion);
        }

        const tabla = document.createElement("table");
        tabla.border = "1";
        tabla.style.width = "100%";
        tabla.style.borderCollapse = "collapse";
        
        let cabecera = `
            <thead>
                <tr>
                    <th style="width: 40px;">⋮⋮</th>
                    <th>Item</th>
                    <th>Fecha</th>
                    <th>Operación</th>
                    <th>Ingreso</th>
                    <th>Salida</th>
                    <th>Stock</th>
                    <th>Observaciones</th>`;
        
        if (modoActual === 'admin' && usuarioAutenticado) {
            cabecera += `<th>Acción</th>`;
        }
        
        cabecera += `<tr></thead><tbody></tbody>`;
        tabla.innerHTML = cabecera;

        const tbody = tabla.querySelector("tbody");

        movimientos.forEach((item, index) => {
            const esUltimo = (index === movimientos.length - 1);
            const claseDestacada = esUltimo ? 'ultimo-stock' : '';
            
            let fila = `
                <td style="cursor: grab; text-align: center; ${claseDestacada ? 'background-color: #e8f5e9;' : ''}">⋮⋮</td>
                <td class="numero-formateado ${claseDestacada}">${item.item}</td>
                <td ${claseDestacada ? 'class="ultimo-stock"' : ''}>${formatearFecha(item.fecha)}</td>
                <td ${claseDestacada ? 'class="ultimo-stock"' : ''}>${item.operacion}</td>
                <td class="numero-formateado ${claseDestacada}">${formatearNumero(item.ingreso)}</td>
                <td class="numero-formateado ${claseDestacada}">${formatearNumero(item.salida)}</td>
                <td class="numero-formateado ${claseDestacada}"><strong>${formatearNumero(item.stock)}</strong></td>
                <td ${claseDestacada ? 'class="ultimo-stock"' : ''}>${item.observaciones || '-'}</td>`;
            
            if (modoActual === 'admin' && usuarioAutenticado) {
                fila += `
                <td ${claseDestacada ? 'class="ultimo-stock"' : ''}>
                    <button class="btn-editar" data-item="${itemProducto}" data-index="${index}">
                        Editar
                    </button>
                    <button class="btn-eliminar" data-item="${itemProducto}" data-index="${index}">
                        Eliminar
                    </button>
                </td>`;
            }
            
            const tr = document.createElement("tr");
            if (claseDestacada) tr.className = claseDestacada;
            tr.setAttribute('data-original-item', JSON.stringify(item));
            tr.innerHTML = fila;
            tbody.appendChild(tr);
        });

        contenedor.appendChild(tabla);
        
        // Activar drag & drop solo en modo admin
        if (modoActual === 'admin' && usuarioAutenticado) {
            activarDragAndDrop();
            if (btnRecalcular) {
                btnRecalcular.style.display = 'inline-block';
            }
        }
        
        // Eventos de botones
        if (modoActual === 'admin' && usuarioAutenticado) {
            document.querySelectorAll(".btn-editar").forEach(btn => {
                btn.addEventListener("click", function() {
                    const itemProd = this.getAttribute("data-item");
                    const idx = this.getAttribute("data-index");
                    mostrarModalEditar(parseInt(itemProd), parseInt(idx));
                });
            });
            
            document.querySelectorAll(".btn-eliminar").forEach(btn => {
                btn.addEventListener("click", function() {
                    const itemProd = this.getAttribute("data-item");
                    const idx = this.getAttribute("data-index");
                    eliminarRegistro(parseInt(itemProd), parseInt(idx));
                });
            });
        }
    });
}

// ==================== ELIMINAR REGISTRO ====================

function eliminarRegistro(itemProducto, index) {
    if (modoActual !== 'admin' || !usuarioAutenticado) {
        alert("Debe estar en modo Administrador para eliminar registros");
        return;
    }
    
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;

    database.ref("inventario/" + itemProducto).once("value", snapshot => {
        let movimientos = snapshot.val() || [];

        movimientos.splice(index, 1);

        let stock = 0;
        movimientos = movimientos.map(m => {
            stock = stock + m.ingreso - m.salida;
            return { ...m, stock };
        });

        database.ref("inventario/" + itemProducto).set(movimientos, () => {
            mostrarTabla();
            cargarResumenStock();
        });
    });
}

// ==================== FUNCIONES PARA EDITAR REGISTROS ====================

let registroEditando = null;

function mostrarModalEditar(itemProducto, index) {
    if (modoActual !== 'admin' || !usuarioAutenticado) {
        alert("Debe estar en modo Administrador para editar registros");
        return;
    }
    
    registroEditando = { itemProducto, index };
    
    database.ref("inventario/" + itemProducto).once("value", snapshot => {
        const movimientos = snapshot.val() || [];
        
        if (index >= movimientos.length) {
            alert("Registro no encontrado");
            return;
        }
        
        const registro = movimientos[index];
        
        document.getElementById("editItemProducto").value = itemProducto;
        document.getElementById("editIndex").value = index;
        document.getElementById("editDescripcion").value = registro.descripcion;
        document.getElementById("editFecha").value = fechaParaInputDate(registro.fecha);
        document.getElementById("editOperacion").value = registro.operacion;
        document.getElementById("editIngreso").value = registro.ingreso;
        document.getElementById("editSalida").value = registro.salida;
        document.getElementById("editObservaciones").value = registro.observaciones || '';
        
        document.getElementById("modalEditar").style.display = 'flex';
    });
}

function cerrarModalEditar() {
    document.getElementById("modalEditar").style.display = 'none';
    registroEditando = null;
}

function guardarEdicion(e) {
    e.preventDefault();
    
    if (!registroEditando) return;
    
    const itemProducto = parseInt(document.getElementById("editItemProducto").value);
    const index = parseInt(document.getElementById("editIndex").value);
    const fecha = document.getElementById("editFecha").value;
    const operacion = document.getElementById("editOperacion").value;
    const ingreso = Number(document.getElementById("editIngreso").value);
    const salida = Number(document.getElementById("editSalida").value);
    const observaciones = document.getElementById("editObservaciones").value;
    const descripcion = document.getElementById("editDescripcion").value;
    
    database.ref("inventario/" + itemProducto).once("value", snapshot => {
        let movimientos = snapshot.val() || [];
        
        if (index >= movimientos.length) {
            alert("Error: registro no encontrado");
            return;
        }
        
        const usuarioOriginal = movimientos[index].usuario;
        
        movimientos[index] = {
            ...movimientos[index],
            descripcion,
            fecha,
            operacion,
            ingreso,
            salida,
            observaciones: observaciones || '',
            usuario: usuarioOriginal,
            editadoPor: usuarioAutenticado.email,
            editadoEn: firebase.database.ServerValue.TIMESTAMP
        };
        
        let stock = 0;
        if (index > 0) {
            stock = movimientos[index - 1].stock;
        }
        
        for (let i = index; i < movimientos.length; i++) {
            stock = stock + movimientos[i].ingreso - movimientos[i].salida;
            movimientos[i].stock = stock;
        }
        
        database.ref("inventario/" + itemProducto).set(movimientos, () => {
            alert("✅ Registro actualizado correctamente!");
            cerrarModalEditar();
            mostrarTabla();
            cargarResumenStock();
        });
    });
}

// ==================== TABLA RESUMEN ====================

function cargarResumenStock() {
    console.log("Cargando resumen de stock...");
    const container = document.getElementById("tablaResumenContainer");
    
    if (!container) {
        console.error("ERROR: tablaResumenContainer no encontrado");
        return;
    }
    
    container.innerHTML = '<p>Cargando resumen...</p>';
    
    const promesas = Object.keys(productosItem).map(descripcion => {
        const itemProducto = productosItem[descripcion];
        return database.ref("inventario/" + itemProducto).once("value")
            .then(snapshot => {
                const movimientos = snapshot.val();
                let stockActual = 0;
                
                if (movimientos && movimientos.length > 0) {
                    stockActual = movimientos[movimientos.length - 1].stock;
                }
                
                return {
                    item: itemProducto,
                    descripcion: descripcion,
                    stock: stockActual
                };
            });
    });
    
    Promise.all(promesas)
        .then(datos => {
            datos.sort((a, b) => a.item - b.item);
            stockResumen = datos;
            
            const tabla = document.createElement("table");
            tabla.innerHTML = `
                <thead>
                    <tr><th>ITEM</th><th>DESCRIPCIÓN DEL ARTICULO</th><th>STOCK ACTUALIZADO</th></tr>
                </thead>
                <tbody></tbody>
            `;
            
            const tbody = tabla.querySelector("tbody");
            let totalStock = 0;
            
            datos.forEach(item => {
                totalStock += item.stock;
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td class="numero-formateado">${item.item}</td>
                    <td>${item.descripcion}</td>
                    <td class="numero-formateado"><strong>${formatearNumero(item.stock)}</strong></td>
                `;
                tbody.appendChild(fila);
            });
            
            const filaTotal = document.createElement("tr");
            filaTotal.className = "resumen-total";
            filaTotal.innerHTML = `
                <td colspan="2"><strong>TOTAL GENERAL</strong></td>
                <td class="numero-formateado"><strong>${formatearNumero(totalStock)}</strong></td>
            `;
            tbody.appendChild(filaTotal);
            
            container.innerHTML = '';
            container.appendChild(tabla);
        })
        .catch(error => {
            console.error("Error al cargar resumen:", error);
            container.innerHTML = '<p class="error-message">Error al cargar el resumen</p>';
        });
}

// ==================== EXPORTAR A EXCEL ====================

async function exportarExcel() {
    console.log("Exportando a Excel completo...");
    
    try {
        const btnExportar = document.getElementById("btnExportarExcel");
        const textoOriginal = btnExportar.textContent;
        btnExportar.textContent = "⏳ Generando Excel...";
        btnExportar.disabled = true;
        
        const wb = XLSX.utils.book_new();
        
        // Hoja RESUMEN
        const datosResumen = [];
        datosResumen.push(["STOCK DE ENVASES VACIOS CERES PERÚ"]);
        datosResumen.push([]);
        datosResumen.push(["Fecha de exportación:", new Date().toLocaleString('es-PE')]);
        datosResumen.push([]);
        datosResumen.push(["ITEM", "DESCRIPCIÓN DEL ARTICULO", "STOCK ACTUALIZADO"]);
        
        let totalStock = 0;
        const productosKeys = Object.keys(productosItem);
        
        for (let i = 0; i < productosKeys.length; i++) {
            const descripcion = productosKeys[i];
            const itemProducto = i + 1;
            
            const snapshot = await database.ref("inventario/" + itemProducto).once("value");
            const movimientos = snapshot.val() || [];
            
            let stockActual = 0;
            if (movimientos.length > 0) {
                stockActual = movimientos[movimientos.length - 1].stock;
            }
            
            totalStock += stockActual;
            datosResumen.push([itemProducto, descripcion, stockActual]);
        }
        
        datosResumen.push([]);
        datosResumen.push(["TOTAL GENERAL", "", totalStock]);
        
        const wsResumen = XLSX.utils.aoa_to_sheet(datosResumen);
        wsResumen['!cols'] = [{wch: 8}, {wch: 60}, {wch: 18}];
        XLSX.utils.book_append_sheet(wb, wsResumen, "RESUMEN");
        
        // Hojas por producto
        for (let i = 0; i < productosKeys.length; i++) {
            const descripcion = productosKeys[i];
            const itemProducto = i + 1;
            
            const snapshot = await database.ref("inventario/" + itemProducto).once("value");
            const movimientos = snapshot.val() || [];
            
            const datosProducto = [];
            datosProducto.push([`INVENTARIO: ${descripcion}`]);
            datosProducto.push([]);
            
            if (movimientos.length > 0) {
                datosProducto.push(["ITEM", "FECHA", "OPERACIÓN", "INGRESO", "SALIDA", "STOCK", "OBSERVACIONES", "USUARIO"]);
                
                // Ordenar ascendente para el Excel (histórico)
                const movimientosOrdenados = [...movimientos].sort((a, b) => {
                    return new Date(a.fecha) - new Date(b.fecha);
                });
                
                movimientosOrdenados.forEach(mov => {
                    datosProducto.push([
                        mov.item,
                        formatearFecha(mov.fecha),
                        mov.operacion,
                        mov.ingreso,
                        mov.salida,
                        mov.stock,
                        mov.observaciones || '-',
                        mov.usuario || 'N/A'
                    ]);
                });
                
                datosProducto.push([]);
                const ultimoStock = movimientos[movimientos.length - 1].stock;
                datosProducto.push(["STOCK FINAL:", "", "", "", "", ultimoStock, "", ""]);
            } else {
                datosProducto.push(["NO HAY REGISTROS PARA ESTE PRODUCTO"]);
            }
            
            const wsProducto = XLSX.utils.aoa_to_sheet(datosProducto);
            wsProducto['!cols'] = [{wch: 8}, {wch: 12}, {wch: 25}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 30}, {wch: 25}];
            XLSX.utils.book_append_sheet(wb, wsProducto, `ITEM ${itemProducto}`);
        }
        
        // Hoja ÍNDICE
        const datosIndice = [];
        datosIndice.push(["REPORTE COMPLETO DE INVENTARIO - CERES PERÚ SAC"]);
        datosIndice.push([]);
        datosIndice.push(["Fecha de generación:", new Date().toLocaleString('es-PE')]);
        datosIndice.push([]);
        datosIndice.push(["HOJA", "CONTENIDO", "CANTIDAD DE REGISTROS"]);
        datosIndice.push(["RESUMEN", "Resumen general de stock", productosKeys.length]);
        
        for (let i = 0; i < productosKeys.length; i++) {
            const descripcion = productosKeys[i];
            const itemProducto = i + 1;
            const snapshot = await database.ref("inventario/" + itemProducto).once("value");
            const movimientos = snapshot.val() || [];
            datosIndice.push([`ITEM ${itemProducto}`, descripcion, movimientos.length]);
        }
        
        const wsIndice = XLSX.utils.aoa_to_sheet(datosIndice);
        wsIndice['!cols'] = [{wch: 10}, {wch: 60}, {wch: 20}];
        XLSX.utils.book_append_sheet(wb, wsIndice, "ÍNDICE");
        
        const fecha = new Date();
        const fechaStr = fecha.toISOString().slice(0,10).replace(/-/g, '');
        const horaStr = fecha.getHours().toString().padStart(2, '0') + fecha.getMinutes().toString().padStart(2, '0');
        const nombreArchivo = `Inventario_Completo_Ceres_${fechaStr}_${horaStr}.xlsx`;
        
        XLSX.writeFile(wb, nombreArchivo);
        
        btnExportar.textContent = textoOriginal;
        btnExportar.disabled = false;
        
        alert(`✅ Archivo "${nombreArchivo}" exportado exitosamente!`);
        
    } catch (error) {
        console.error("Error al exportar Excel:", error);
        alert("❌ Error al exportar a Excel: " + error.message);
        
        const btnExportar = document.getElementById("btnExportarExcel");
        if (btnExportar) {
            btnExportar.textContent = "📊 Exportar a Excel";
            btnExportar.disabled = false;
        }
    }
}

// ==================== EVENTOS DEL DOM ====================

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM completamente cargado");
    
    document.getElementById("btnModoVista").addEventListener("click", function() {
        modoActual = 'vista';
        usuarioAutenticado = null;
        mostrarApp('vista');
    });
    
    document.getElementById("btnModoAdmin").addEventListener("click", function() {
        mostrarLogin();
    });
    
    document.getElementById("btnVolverInicio").addEventListener("click", function() {
        mostrarInicio();
    });
    
    document.getElementById("loginForm").addEventListener("submit", function(e) {
        e.preventDefault();
        
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                document.getElementById("loginError").style.display = 'none';
                modoActual = 'admin';
                mostrarApp('admin');
            })
            .catch((error) => {
                document.getElementById("loginError").textContent = error.message;
                document.getElementById("loginError").style.display = 'block';
            });
    });
    
    document.getElementById("btnCambiarModo").addEventListener("click", function() {
        if (modoActual === 'admin') {
            auth.signOut();
            modoActual = 'vista';
            usuarioAutenticado = null;
            mostrarApp('vista');
        } else {
            mostrarLogin();
        }
    });
    
    document.getElementById("btnLogout").addEventListener("click", function() {
        if (confirm("¿Cerrar sesión de administrador?")) {
            auth.signOut();
            modoActual = 'vista';
            mostrarApp('vista');
        }
    });
    
    // Formulario de Inventario
    document.getElementById("formInventario").addEventListener("submit", function(e) {
        e.preventDefault();
        
        if (modoActual !== 'admin' || !usuarioAutenticado) {
            alert("Debe estar en modo Administrador para agregar registros");
            return;
        }
        
        const descripcion = document.getElementById("descripcion").value;
        const fecha = document.getElementById("fecha").value;
        const operacion = document.getElementById("operacion").value;
        const ingreso = Number(document.getElementById("ingreso").value);
        const salida = Number(document.getElementById("salida").value);
        const observaciones = document.getElementById("observaciones").value;
        const itemProducto = productosItem[descripcion];

        if (!itemProducto) {
            alert("Por favor seleccione una descripción válida");
            return;
        }

        database.ref("inventario/" + itemProducto).once("value", snapshot => {
            let movimientos = snapshot.val() || [];
            
            const nuevoRegistro = {
                item: itemProducto,
                descripcion,
                fecha,
                operacion,
                ingreso,
                salida,
                stock: 0,
                observaciones: observaciones || '',
                usuario: usuarioAutenticado.email,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            
            movimientos.push(nuevoRegistro);
            
            // Orden ascendente para cálculo correcto
            movimientos.sort((a, b) => {
                const fechaA = new Date(a.fecha);
                const fechaB = new Date(b.fecha);
                return fechaA - fechaB;
            });
            
            let stockAcumulado = 0;
            movimientos = movimientos.map(mov => {
                stockAcumulado = stockAcumulado + mov.ingreso - mov.salida;
                return { ...mov, stock: stockAcumulado };
            });
            
            database.ref("inventario/" + itemProducto).set(movimientos, () => {
                alert("✅ Registro agregado correctamente!");
                document.getElementById("formInventario").reset();
                cargarResumenStock();
                mostrarTabla();
            });
        });
    });
    
    document.getElementById("btnMostrar").addEventListener("click", mostrarTabla);
    document.getElementById("btnExportarExcel").addEventListener("click", exportarExcel);
    
    // Botón Recalcular Stock
    const btnRecalcular = document.getElementById("btnRecalcular");
    if (btnRecalcular) {
        btnRecalcular.addEventListener("click", async function() {
            if (!itemProductoActual) return;
            
            const tbody = document.querySelector("#contenedorTablas table tbody");
            if (!tbody) return;
            
            const filas = tbody.querySelectorAll("tr");
            const nuevoOrden = [];
            
            // Obtener el orden actual de las filas (después de arrastrar)
            for (let i = 0; i < filas.length; i++) {
                const fila = filas[i];
                const datosOriginales = fila.getAttribute('data-original-item');
                if (datosOriginales) {
                    nuevoOrden.push(JSON.parse(datosOriginales));
                }
            }
            
            if (nuevoOrden.length > 0) {
                await recalcularStock(itemProductoActual, nuevoOrden);
            }
        });
    }
    
    // Eventos modal edición
    document.getElementById("btnCerrarModal").addEventListener("click", cerrarModalEditar);
    document.getElementById("btnCancelarEditar").addEventListener("click", cerrarModalEditar);
    document.getElementById("formEditar").addEventListener("submit", guardarEdicion);
    
    document.getElementById("modalEditar").addEventListener("click", function(e) {
        if (e.target.id === "modalEditar") {
            cerrarModalEditar();
        }
    });
});

// ==================== AUTENTICACIÓN ====================

auth.onAuthStateChanged((user) => {
    usuarioAutenticado = user;
    
    if (user && modoActual === 'admin') {
        mostrarApp('admin');
    }
});



