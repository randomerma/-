import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useStore } from '../store';

export async function exportToPdf() {
  const state = useStore.getState();
  
  // Calculate stats
  let totalWeight = 0;
  let totalVol = 0;
  let maxZ = 0;
  state.packedItems.forEach(item => {
    const c = state.cargoList.find(c => c.id === item.originalCargoId);
    if (c) {
      totalWeight += c.weight;
      totalVol += (item.w * item.h * item.d) / 1e9;
      maxZ = Math.max(maxZ, item.z + item.d);
    }
  });
  
  const ldm = (maxZ / 1000).toFixed(2);
  const dateStr = new Date().toLocaleString('ru-RU');

  // Build an off-screen HTML block for the styled report
  const reportDiv = document.createElement('div');
  reportDiv.style.position = 'absolute';
  reportDiv.style.left = '-9999px';
  reportDiv.style.top = '0';
  reportDiv.style.width = '1000px';
  reportDiv.style.backgroundColor = '#ffffff';
  reportDiv.style.fontFamily = 'Arial, sans-serif';
  reportDiv.style.color = '#1e293b';
  reportDiv.style.padding = '40px';
  
  // Get 3D Canvas Image
  let sceneImgData = '';
  const sceneEl = document.getElementById('three-scene-container');
  if (sceneEl) {
    try {
      const canvas = await html2canvas(sceneEl, { backgroundColor: '#f8fafc', useCORS: true });
      sceneImgData = canvas.toDataURL('image/jpeg', 0.9);
    } catch (err) {
      console.warn("Screenshot failed", err);
    }
  }

  const numContainers = state.packedItems.length > 0
    ? Math.max(...state.packedItems.map(p => p.containerIndex || 0)) + 1
    : 0;

  // Generate Cargo Table Rows
  let tablesHtml = '';

  for (let c = 0; c < numContainers; c++) {
    const itemsInContainer = state.packedItems.filter(p => (p.containerIndex || 0) === c);
    if (itemsInContainer.length === 0) continue;

    const cargoRows = itemsInContainer.map((item, index) => {
      const cargo = state.cargoList.find(cg => cg.id === item.originalCargoId);
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid;">
          <td style="padding: 10px; font-size: 14px;">${index + 1}</td>
          <td style="padding: 10px; font-weight: bold;">${cargo?.name || 'Неизвестно'}</td>
          <td style="padding: 10px; color: #475569;">${item.w} x ${item.h} x ${item.d}</td>
          <td style="padding: 10px;">${cargo?.weight || 0} кг</td>
          <td style="padding: 10px; font-family: monospace;">X:${Math.round(item.x)} Y:${Math.round(item.y)} Z:${Math.round(item.z)}</td>
        </tr>
      `;
    }).join('');

    tablesHtml += `
      <div style="margin-bottom: 30px; page-break-inside: auto;">
        <h2 style="font-size: 20px; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Упаковочный лист — Авто ${c + 1}</h2>
        <table style="width: 100%; text-align: left; border-collapse: collapse;">
          <thead>
            <tr style="background: #e2e8f0; color: #334155;">
              <th style="padding: 12px 10px; font-weight: 600; width: 40px;">№ п/п</th>
              <th style="padding: 12px 10px; font-weight: 600;">Наименование</th>
              <th style="padding: 12px 10px; font-weight: 600;">Габариты (ДхШхВ)</th>
              <th style="padding: 12px 10px; font-weight: 600;">Вес</th>
              <th style="padding: 12px 10px; font-weight: 600;">Координаты (X,Y,Z)</th>
            </tr>
          </thead>
          <tbody>
            ${cargoRows}
          </tbody>
        </table>
      </div>
    `;
  }

  reportDiv.innerHTML = `
    <div style="border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 32px; color: #0f172a;">План загрузки транспорта</h1>
      <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">Сгенерировано: ${dateStr}</p>
    </div>

    <div style="display: flex; gap: 24px; margin-bottom: 32px;">
      <div style="flex: 1; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; background: #f8fafc;">
        <h3 style="margin: 0 0 16px 0; color: #334155; font-size: 18px;">Транспорт: ${state.transport.name}</h3>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.6; font-size: 15px; color: #475569;">
          <li><b>Длина:</b> ${state.transport.length} мм</li>
          <li><b>Ширина:</b> ${state.transport.width} мм</li>
          <li><b>Высота:</b> ${state.transport.height} мм</li>
          <li><b>Грузоподъемность:</b> ${state.transport.maxWeight.toLocaleString()} кг</li>
        </ul>
      </div>
      <div style="flex: 1; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; background: #f8fafc;">
        <h3 style="margin: 0 0 16px 0; color: #334155; font-size: 18px;">Сводка по грузу</h3>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.6; font-size: 15px; color: #475569;">
          <li><b>Задействовано авто:</b> ${numContainers} шт.</li>
          <li><b>Общий вес:</b> ${totalWeight.toLocaleString()} кг</li>
          <li><b>Объем:</b> ${totalVol.toFixed(2)} м³</li>
          <li><b>Всего мест:</b> ${state.packedItems.length}</li>
        </ul>
      </div>
    </div>

    ${sceneImgData ? `
      <div style="margin-bottom: 32px; page-break-inside: avoid;">
        <h2 style="font-size: 20px; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Схема погрузки</h2>
        <img src="${sceneImgData}" style="width: 100%; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />
      </div>
    ` : ''}

    ${tablesHtml}
  `;

  document.body.appendChild(reportDiv);

  try {
    const canvas = await html2canvas(reportDiv, { scale: 2, useCORS: true });
    document.body.removeChild(reportDiv);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgData = canvas.toDataURL('image/png');
    // Scale canvas to fit width
    const ratio = pdfWidth / canvas.width;
    const scaledHeight = canvas.height * ratio;

    let heightLeft = scaledHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    pdf.save('packing-report.pdf');
  } catch (e) {
    console.error("PDF generation error", e);
    document.body.removeChild(reportDiv);
    alert('Не удалось сформировать PDF.');
  }
}
