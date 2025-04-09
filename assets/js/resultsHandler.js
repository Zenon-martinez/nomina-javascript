// Simulación de datos, en producción los recuperarías de localStorage
const resultados = JSON.parse(localStorage.getItem("resultadosNomina")) || [];

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
  const ws = XLSX.utils.json_to_sheet(resultados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nómina Semanal");
  XLSX.writeFile(wb, "nomina_semanal.xlsx");
}
