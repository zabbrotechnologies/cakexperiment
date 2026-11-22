import { jsPDF } from 'jspdf';

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  issueDate?: string;
  certificateId?: string;
}

/**
 * Generate a unique credential verification ID for the certificate
 */
export function generateCertificateId(courseTitle: string): string {
  const prefix = 'CKX';
  const year = new Date().getFullYear();
  const slugPart = courseTitle
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase() || 'MST';
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${year}-${slugPart}-${randomSuffix}`;
}

/**
 * Draws an elegant luxury certificate on an HTML5 canvas element
 */
export function drawCertificateToCanvas(
  canvas: HTMLCanvasElement,
  data: CertificateData
): void {
  const { studentName, courseTitle, issueDate, certificateId } = data;

  // Standard A4 landscape proportions at high DPI
  const width = 2000;
  const height = 1414;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Background Fill (Warm Antique Cream Parchment)
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, width * 0.7);
  bgGrad.addColorStop(0, '#FFFDF9');
  bgGrad.addColorStop(0.7, '#FAF5EE');
  bgGrad.addColorStop(1, '#F3E9DD');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Ornate Border (Deep Royal Berry #5C1A29)
  ctx.strokeStyle = '#5C1A29';
  ctx.lineWidth = 14;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // 3. Inner Gold Accent Border
  ctx.strokeStyle = '#C59B27';
  ctx.lineWidth = 4;
  ctx.strokeRect(58, 58, width - 116, height - 116);

  // 4. Thin Interior Pinstripe Border
  ctx.strokeStyle = '#E2BA55';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(72, 72, width - 144, height - 144);

  // 5. Corner Ornaments (Diamond Flourishes)
  const drawCornerFlourish = (x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#C59B27';
    // Diamond
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(14, 0);
    ctx.lineTo(0, 14);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();

    // Secondary smaller dots
    ctx.beginPath();
    ctx.arc(20, 0, 3, 0, Math.PI * 2);
    ctx.arc(-20, 0, 3, 0, Math.PI * 2);
    ctx.arc(0, 20, 3, 0, Math.PI * 2);
    ctx.arc(0, -20, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCornerFlourish(80, 80);
  drawCornerFlourish(width - 80, 80);
  drawCornerFlourish(80, height - 80);
  drawCornerFlourish(width - 80, height - 80);

  // 6. Subtle Watermark Crest in Center
  ctx.save();
  ctx.translate(width / 2, height / 2 + 10);
  ctx.globalAlpha = 0.045;
  ctx.fillStyle = '#5C1A29';
  ctx.beginPath();
  ctx.arc(0, 0, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5C1A29';
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.restore();

  // 7. Institution Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5C1A29';
  ctx.font = 'bold 36px "Cinzel", "Playfair Display", "Georgia", serif';
  ctx.letterSpacing = '10px';
  ctx.fillText('C A K E X P E R I M E N T   A C A D E M Y', width / 2, 175);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = '#8C6D68';
  ctx.font = '600 17px "Montserrat", "Segoe UI", sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('ATELIER DE HAUTE PÂTISSERIE • DIGITAL CAMPUS', width / 2, 215);
  ctx.letterSpacing = '0px';

  // Decorative Header Divider
  ctx.strokeStyle = '#C59B27';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 280, 245);
  ctx.lineTo(width / 2 - 30, 245);
  ctx.moveTo(width / 2 + 30, 245);
  ctx.lineTo(width / 2 + 280, 245);
  ctx.stroke();

  // Center Diamond in Divider
  ctx.fillStyle = '#C59B27';
  ctx.beginPath();
  ctx.arc(width / 2, 245, 6, 0, Math.PI * 2);
  ctx.fill();

  // 8. Main Certificate Title
  ctx.fillStyle = '#84253B';
  ctx.font = 'bold 64px "Cinzel", "Playfair Display", "Georgia", serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('CERTIFICATE OF COMPLETION', width / 2, 335);
  ctx.letterSpacing = '0px';

  // 9. Conferred Line
  ctx.fillStyle = '#6E5C59';
  ctx.font = '500 20px "Montserrat", "Segoe UI", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('THIS IS PROUDLY CONFERRED UPON', width / 2, 410);
  ctx.letterSpacing = '0px';

  // 10. Student Name (Hero Element)
  const displayName = studentName?.trim() || 'Distinguished Student';
  ctx.fillStyle = '#3D1C24';
  ctx.font = 'bold 74px "Playfair Display", "Georgia", serif';
  ctx.fillText(displayName, width / 2, 510);

  // Elegant Flourish Under Name
  ctx.strokeStyle = '#C59B27';
  ctx.lineWidth = 2.5;
  const nameMetrics = ctx.measureText(displayName);
  const underlineWidth = Math.min(width - 400, Math.max(340, nameMetrics.width + 120));
  ctx.beginPath();
  ctx.moveTo(width / 2 - underlineWidth / 2, 535);
  ctx.lineTo(width / 2 + underlineWidth / 2, 535);
  ctx.stroke();

  // Flourish dots
  ctx.fillStyle = '#84253B';
  ctx.beginPath();
  ctx.arc(width / 2, 535, 4.5, 0, Math.PI * 2);
  ctx.arc(width / 2 - underlineWidth / 2, 535, 3.5, 0, Math.PI * 2);
  ctx.arc(width / 2 + underlineWidth / 2, 535, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 11. Completion Narrative
  ctx.fillStyle = '#5A4E4B';
  ctx.font = '400 23px "Playfair Display", "Georgia", serif';
  ctx.fillText('for successfully completing the rigorous atelier curriculum and mastering the technical coursework for', width / 2, 615);

  // 12. Course Title (Special Highlighting)
  ctx.fillStyle = '#84253B';
  ctx.font = 'bold 44px "Cinzel", "Playfair Display", "Georgia", serif';
  ctx.fillText(courseTitle || 'Artisanal Cake Baking & Pastry Arts Masterclass', width / 2, 690);

  // 13. Professional Competencies Accreditation
  ctx.fillStyle = '#7A6B68';
  ctx.font = 'italic 19px "Georgia", serif';
  ctx.fillText(
    'Demonstrating verified proficiency in professional baking formulations, delicate sponge balance, temperature regulation, and bespoke presentation.',
    width / 2,
    745
  );

  // 14. Golden Official Academy Seal (Center Bottom)
  const sealX = width / 2;
  const sealY = 960;
  const sealRadius = 88;

  // Outer gold scalloped ring effect
  ctx.save();
  ctx.translate(sealX, sealY);
  ctx.fillStyle = '#C59B27';
  for (let i = 0; i < 24; i++) {
    ctx.rotate((Math.PI * 2) / 24);
    ctx.beginPath();
    ctx.arc(0, sealRadius + 4, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Seal Body
  ctx.save();
  ctx.translate(sealX, sealY);
  const sealGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, sealRadius);
  sealGrad.addColorStop(0, '#F5DE88');
  sealGrad.addColorStop(0.6, '#DFB643');
  sealGrad.addColorStop(1, '#B8861E');
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  ctx.arc(0, 0, sealRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, sealRadius - 10, 0, Math.PI * 2);
  ctx.stroke();

  // Seal Ribbon Hanging
  ctx.fillStyle = '#84253B';
  ctx.beginPath();
  ctx.moveTo(-35, sealRadius - 10);
  ctx.lineTo(-45, sealRadius + 60);
  ctx.lineTo(-25, sealRadius + 45);
  ctx.lineTo(-5, sealRadius + 60);
  ctx.lineTo(-15, sealRadius - 10);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(15, sealRadius - 10);
  ctx.lineTo(5, sealRadius + 60);
  ctx.lineTo(25, sealRadius + 45);
  ctx.lineTo(45, sealRadius + 60);
  ctx.lineTo(35, sealRadius - 10);
  ctx.fill();

  // Inner Seal Emblem
  ctx.fillStyle = '#5C1A29';
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px "Montserrat", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('OFFICIAL', 0, -28);
  ctx.font = 'bold 24px "Cinzel", "Playfair Display", serif';
  ctx.fillText('SEAL', 0, 2);
  ctx.font = '600 13px "Montserrat", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('VERIFIED 90%+', 0, 26);
  ctx.fillText('ATELIER', 0, 44);
  ctx.letterSpacing = '0px';
  ctx.restore();

  // 15. Left Column: Date & Credential Verification
  const leftX = 260;
  const bottomY = 1140;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#3D1C24';
  ctx.font = '600 16px "Montserrat", "Segoe UI", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('DATE OF ISSUANCE', leftX, bottomY - 30);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = '#6E5C59';
  ctx.font = '400 19px "Georgia", serif';
  ctx.fillText(issueDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), leftX, bottomY);

  ctx.fillStyle = '#3D1C24';
  ctx.font = '600 16px "Montserrat", "Segoe UI", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('VERIFICATION ID', leftX, bottomY + 45);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = '#84253B';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillText(certificateId || generateCertificateId(courseTitle), leftX, bottomY + 75);

  ctx.fillStyle = '#7A6B68';
  ctx.font = '13px "Montserrat", sans-serif';
  ctx.fillText('Verify online at cakexperiment.com/verify', leftX, bottomY + 102);

  // 16. Right Column: Instructor Signature & Title
  const rightX = width - 260;

  ctx.textAlign = 'right';

  // Simulated artistic signature of Chef Anisha Arthur
  ctx.fillStyle = '#2A1017';
  ctx.font = 'italic bold 44px "Brush Script MT", "Great Vibes", "Georgia", cursive';
  ctx.fillText('Anisha Arthur', rightX, bottomY - 10);

  // Signature rule line
  ctx.strokeStyle = '#5C1A29';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rightX - 300, bottomY + 12);
  ctx.lineTo(rightX, bottomY + 12);
  ctx.stroke();

  ctx.fillStyle = '#3D1C24';
  ctx.font = 'bold 18px "Montserrat", "Segoe UI", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('CHEF ANISHA ARTHUR', rightX, bottomY + 42);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = '#6E5C59';
  ctx.font = '400 15px "Georgia", serif';
  ctx.fillText('Executive Pastry Chef & Creative Director', rightX, bottomY + 68);
  ctx.fillText('Cakexperiment Academy & Studio Atelier', rightX, bottomY + 92);
}

/**
 * Download the generated certificate as a crisp PDF document
 */
export async function downloadCertificatePDF(data: CertificateData): Promise<void> {
  const canvas = document.createElement('canvas');
  drawCertificateToCanvas(canvas, data);

  const imgData = canvas.toDataURL('image/png', 1.0);

  // Create A4 Landscape PDF (297mm x 210mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');

  const cleanStudent = (data.studentName || 'Student').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanCourse = (data.courseTitle || 'Masterclass').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Cakexperiment_Certificate_${cleanStudent}_${cleanCourse}.pdf`;

  pdf.save(filename);
}
