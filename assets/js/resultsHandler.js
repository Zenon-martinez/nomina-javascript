// Simulación de datos, en producción los recuperarías de localStorage
const resultados = JSON.parse(localStorage.getItem("resultadosNomina")) || [];
const horasNormales = 48;

function mostrarResultadosEnTabla(resultados) {
  const container = document.getElementById("tablaResultados");

  if (resultados.length === 0) {
    container.innerHTML = "<p>No hay resultados para mostrar.</p>";
    return;
  }

  const table = document.createElement("table");
  table.classList.add("tabla-empleados");

  const headers = Object.keys(resultados[0]);
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  resultados.forEach((empleado) => {
    const tr = document.createElement("tr");
    headers.forEach((key) => {
      const td = document.createElement("td");
      td.textContent = empleado[key];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

// Ejecutar al cargar
mostrarResultadosEnTabla(resultados);

function exportarExcel() {
  const wb = XLSX.utils.book_new();
  const ws_data = [
    [
      "ID",
      "Nombre del empleado",
      "Departamento / Área",
      "Sueldo base semanal",
      "Horas extra",
      "Retardos",
      "Faltas",
      "Domingos trabajados",
      "Pago por HE",
      "Descuento por retardo",
      "Descuento por faltas",
      "Pago por domingos",
      "Total bonificaciones",
      "Total deducciones",
      "Pago total semanal",
    ],
  ];

  // Llenar los datos + fórmulas
  resultados.forEach((emp, i) => {
    const rowIndex = i + 2; // Excel es 1-based, encabezados están en la fila 1
    ws_data.push([
      emp.ID,
      emp.Nombre,
      emp.Departamento,
      emp["Sueldo base semanal"],
      emp["Horas extra"],
      emp.Retardos,
      emp.Faltas,
      emp["Domingos trabajados"],
      { f: `D${rowIndex}/${horasNormales}*E${rowIndex}*2` }, // Pago por HE
      { f: `D${rowIndex}/${horasNormales}*F${rowIndex}*2` }, // Descuento por retardo
      { f: `D${rowIndex}/${horasNormales}*G${rowIndex}` }, // Descuento por faltas, se puede modificar a futuro
      { f: `H${rowIndex}*(D${rowIndex}/${horasNormales}*6*2)` }, // Pago por domingos
      { f: `I${rowIndex}+L${rowIndex}` }, // Total bonificaciones
      { f: `J${rowIndex}+K${rowIndex}` }, // Total deducciones
      { f: `D${rowIndex}+M${rowIndex}-N${rowIndex}` }, // Pago total semanal
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Opcional: ajustar ancho de columnas
  ws["!cols"] = [
    { wch: 8 },
    { wch: 25 },
    { wch: 25 },
    { wch: 18 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Nómina Semanal");
  XLSX.writeFile(wb, "Nomina_Semanal.xlsx");
}
