document.addEventListener("DOMContentLoaded", () => {
  const empleadosInput = document.getElementById("empleados");
  const registrosInput = document.getElementById("registros");

  if (empleadosInput) {
    empleadosInput.addEventListener("change", handleFileUpload);
  }

  if (registrosInput) {
    registrosInput.addEventListener("change", handleAttendanceFile);
  }
});

const columnasObligatorias = [
  "ID",
  "Nombre",
  "Puesto",
  "Departamento",
  "Salario base",
  "Tipo de contrato",
  "Fecha de ingreso",
];

let empleadosValidos = [];
let empleadosInvalidos = [];
let registrosValidos = [];
let registrosInvalidos = [];

/**
 * Maneja la carga del archivo y lo procesa.
 * @param {Event} event Evento de cambio en el input de archivos.
 */
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("No se ha seleccionado ningún archivo.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Suponiendo que los datos están en la primera hoja del archivo
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convertimos los datos a formato JSON
      const empleados = XLSX.utils.sheet_to_json(sheet);
      console.log("📂 Datos de empleados:", empleados);
      if (!validarColumnas(sheet)) return;

      empleadosValidos = [];
      empleadosInvalidos = [];

      empleados.forEach((empleado, index) => {
        const faltantes = columnasObligatorias.filter(
          (col) => !Object.prototype.hasOwnProperty.call(empleado, col)
        );

        if (faltantes.length === 0) {
          empleadosValidos.push(empleado);
        } else {
          empleadosInvalidos.push({
            fila: index + 2, // considerar encabezado en fila 1
            errores: `Faltan columnas: ${faltantes.join(", ")}`,
            datos: empleado,
          });
        }
      });

      mostrarTablaResultados();
      verificarEstadoBotonProcesar();
    } catch (error) {
      alert(
        "Ocurrió un error al procesar el archivo. Verifica que sea un Excel válido."
      );
      verificarEstadoBotonProcesar();
      console.error(error);
    }
  };

  reader.readAsArrayBuffer(file);
}

// Función para procesar el archivo de registros de entrada/salida
async function handleAttendanceFile(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("No se ha seleccionado ningún archivo.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      // Validar columnas obligatorias
      const requiredColumns = [
        "ID",
        "Nombre",
        "Fecha",
        "Día de la semana",
        "Hora Entrada",
        "Hora Salida",
      ];
      const missingColumns = requiredColumns.filter(
        (col) => !Object.keys(jsonData[0] || {}).includes(col)
      );

      if (missingColumns.length > 0) {
        alert(
          "Faltan las siguientes columnas obligatorias en el archivo: " +
            missingColumns.join(", ")
        );
        return;
      }

      registrosValidos = [];
      registrosInvalidos = [];

      jsonData.forEach((row, index) => {
        const isValid = requiredColumns.every((col) => row[col] !== "");
        if (isValid) {
          registrosValidos.push({ ...row, fila: index + 2 }); // +2 por encabezado
        } else {
          registrosInvalidos.push({ ...row, fila: index + 2 });
        }
      });

      mostrarRegistrosResultados();
      verificarEstadoBotonProcesar();
    } catch (error) {
      alert(
        "Ocurrió un error al procesar el archivo. Verifica que sea un Excel válido."
      );
      verificarEstadoBotonProcesar();
      console.error(error);
    }
  };
  reader.onerror = (err) => reject(err);
  reader.readAsArrayBuffer(file);
}

function validarColumnas(sheet) {
  const cabecera = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
  const faltantes = columnasObligatorias.filter(
    (col) => !cabecera.includes(col)
  );

  if (faltantes.length > 0) {
    alert(
      `El archivo no tiene todas las columnas requeridas. Faltan: ${faltantes.join(
        ", "
      )}`
    );
    return false;
  }
  return true;
}

function mostrarTablaResultados() {
  const contenedor = document.getElementById("resultadoEmpleados");
  contenedor.innerHTML = "";

  const crearTabla = (titulo, datos) => {
    const tabla = document.createElement("table");
    tabla.classList.add("tabla-empleados");

    const thead = document.createElement("thead");
    const encabezados = Object.keys(datos[0]?.datos || datos[0] || {}).concat(
      "Errores"
    );
    thead.innerHTML = `<tr>${encabezados
      .map((col) => `<th>${col}</th>`)
      .join("")}</tr>`;
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");
    datos.forEach((reg) => {
      const fila = document.createElement("tr");
      const datosFila = reg.datos || reg;
      encabezados.forEach((col) => {
        const celda = document.createElement("td");
        celda.textContent =
          col === "Errores" ? reg.errores || "" : datosFila[col] || "";
        fila.appendChild(celda);
      });
      tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    const tituloTabla = document.createElement("h3");
    tituloTabla.textContent = titulo;
    contenedor.appendChild(tituloTabla);
    contenedor.appendChild(tabla);
  };

  if (empleadosValidos.length > 0) {
    crearTabla("✔ Empleados Válidos", empleadosValidos);
  }

  if (empleadosInvalidos.length > 0) {
    crearTabla("❌ Empleados Inválidos", empleadosInvalidos);
  }
}

function mostrarRegistrosResultados() {
  const contenedor = document.getElementById("resultadoRegistros");
  contenedor.innerHTML = "";

  const crearTabla = (titulo, datos) => {
    const tabla = document.createElement("table");
    tabla.classList.add("tabla-empleados");

    const thead = document.createElement("thead");
    const encabezados = Object.keys(datos[0]?.datos || datos[0] || {}).concat(
      "Errores"
    );
    thead.innerHTML = `<tr>${encabezados
      .map((col) => `<th>${col}</th>`)
      .join("")}</tr>`;
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");
    datos.forEach((reg) => {
      const fila = document.createElement("tr");
      const datosFila = reg.datos || reg;
      encabezados.forEach((col) => {
        const celda = document.createElement("td");
        celda.textContent =
          col === "Errores" ? reg.errores || "" : datosFila[col] || "";
        fila.appendChild(celda);
      });
      tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    const tituloTabla = document.createElement("h3");
    tituloTabla.textContent = titulo;
    contenedor.appendChild(tituloTabla);
    contenedor.appendChild(tabla);
  };

  if (registrosValidos.length > 0) {
    crearTabla("✔ Registros Válidos", registrosValidos);
  }

  if (registrosInvalidos.length > 0) {
    crearTabla("❌ Registros Inválidos", registrosInvalidos);
  }
}

function verificarEstadoBotonProcesar() {
  const boton = document.getElementById("btnProcesarNomina");
  if (empleadosValidos.length && registrosValidos.length) {
    boton.disabled = false;
  } else {
    boton.disabled = true;
  }
}

function procesarNomina() {
  const diasLaborales = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const finDeSemana = ["Sábado", "Domingo"];

  const jornada = {
    entreSemana: { entrada: "08:00", salida: "18:00" },
    finSemana: { entrada: "08:00", salida: "14:00" },
  };

  const nomina = empleadosValidos.map((emp) => {
    const registrosEmpleado = registrosValidos.filter((r) => r.ID === emp.ID);

    let totalHorasExtra = 0;
    let totalRetardosMin = 0;
    let domingosTrabajados = 0;

    registrosEmpleado.forEach((reg) => {
      const dia = reg["Día de la semana"];
      const horaEntrada = parseTime(reg["Hora Entrada"]);
      const horaSalida = parseTime(reg["Hora Salida"]);

      const esFinDeSemana = finDeSemana.includes(dia);
      const jornadaDia = esFinDeSemana
        ? jornada.finSemana
        : jornada.entreSemana;
      const toleranciaMin = 10;

      const horaEntradaEsperada = parseTime(jornadaDia.entrada);
      const horaSalidaEsperada = parseTime(jornadaDia.salida);

      // Calcular retardo
      const retardoMin = Math.max(
        0,
        diffMin(horaEntradaEsperada, horaEntrada) - toleranciaMin
      );
      totalRetardosMin += retardoMin;

      // Calcular horas extra
      const extraMin = Math.max(0, diffMin(horaSalidaEsperada, horaSalida));
      totalHorasExtra += extraMin;

      // Verificar si trabajó domingo
      if (dia === "Domingo") {
        const tiempoTrabajado = diffMin(horaEntrada, horaSalida);
        if (tiempoTrabajado >= 360) domingosTrabajados++;
      }
    });

    const sueldoBase = parseFloat(emp["Salario base"]);
    const horasNormales = 48; // de lunes a viernes 10h x 5d + 4h sábado

    const pagoPorHora = sueldoBase / horasNormales;

    // Bonificaciones
    const esEspecial =
      emp.Departamento?.toLowerCase().includes("hojalatería") ||
      emp.Departamento?.toLowerCase().includes("pintura");

    const bloquesHE = esEspecial
      ? Math.floor(totalHorasExtra / 30) * 0.5
      : Math.floor(totalHorasExtra / 60);
    const pagoHE = bloquesHE * pagoPorHora * 2;

    const pagoDomingo = domingosTrabajados * (pagoPorHora * 6 * 2);

    // Deducciones
    const bloquesRetardo = esEspecial
      ? Math.floor(totalRetardosMin / 30) * 0.5
      : Math.floor(totalRetardosMin / 60);
    const descuentoRetardo = bloquesRetardo * pagoPorHora * 2;

    const totalBonificaciones = pagoHE + pagoDomingo;
    const totalDeducciones = descuentoRetardo;

    const pagoTotal = sueldoBase + totalBonificaciones - totalDeducciones;

    return {
      ID: emp.ID,
      Nombre: emp.Nombre,
      Departamento: emp.Departamento,
      "Sueldo base semanal": sueldoBase,
      "Horas extra": bloquesHE,
      Retardos: bloquesRetardo,
      "Domingos trabajados": domingosTrabajados,
      "Pago por HE": pagoHE.toFixed(2),
      "Descuento por retardo": descuentoRetardo.toFixed(2),
      "Descuento por faltas": "0.00",
      "Pago por domingos": pagoDomingo.toFixed(2),
      "Total bonificaciones": totalBonificaciones.toFixed(2),
      "Total deducciones": totalDeducciones.toFixed(2),
      "Pago total semanal": pagoTotal.toFixed(2),
    };
  });
  console.log("Nómina: ", nomina);

  mostrarTabla(nomina);
  //exportarExcel(resultado);
}

function parseTime(str) {
  const [h, m] = str.split(":").map(Number);
  return new Date(0, 0, 0, h, m);
}

function diffMin(start, end) {
  return (end - start) / (1000 * 60);
}

function mostrarTabla(data) {
  const contenedor = document.getElementById("resultadoNomina");
  contenedor.innerHTML = "";

  const crearTabla = (titulo, datos) => {
    const tabla = document.createElement("table");
    tabla.classList.add("tabla-empleados");

    const thead = document.createElement("thead");
    const encabezados = Object.keys(datos[0]?.datos || datos[0] || {});
    thead.innerHTML = `<tr>${encabezados
      .map((col) => `<th>${col}</th>`)
      .join("")}</tr>`;
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");
    datos.forEach((reg) => {
      const fila = document.createElement("tr");
      const datosFila = reg.datos || reg;
      encabezados.forEach((col) => {
        const celda = document.createElement("td");
        celda.textContent = datosFila[col] || "";
        fila.appendChild(celda);
      });
      tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    const tituloTabla = document.createElement("h3");
    tituloTabla.textContent = titulo;
    contenedor.appendChild(tituloTabla);
    contenedor.appendChild(tabla);
  };

  crearTabla("Nómina - Resultados", data);
  localStorage.setItem("resultadosNomina", JSON.stringify(data));
  window.location.href = "results.html";
}
