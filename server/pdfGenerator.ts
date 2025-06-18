import jsPDF from 'jspdf';

export async function generatePayrollSlipPDF(payroll: any, employee: any): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(16);
  doc.setTextColor(47, 79, 47); // Forest green
  doc.text('SLIP GAJI KARYAWAN', 105, 20, { align: 'center' });
  doc.text('TalentWhiz.ai UMKM Essentials', 105, 30, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(47, 79, 47);
  doc.line(20, 35, 190, 35);
  
  // Employee Information
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('INFORMASI KARYAWAN', 20, 45);
  
  doc.setFontSize(10);
  doc.text(`Nama Karyawan    : ${employee.firstName} ${employee.lastName}`, 20, 55);
  doc.text(`ID Karyawan      : ${employee.employeeId}`, 20, 62);
  doc.text(`Posisi           : ${employee.position}`, 20, 69);
  doc.text(`Departemen       : ${employee.department}`, 20, 76);
  doc.text(`Periode Gaji     : ${payroll.period}`, 20, 83);
  doc.text(`Tanggal Cetak    : ${new Date().toLocaleDateString('id-ID')}`, 20, 90);
  
  // Line separator
  doc.line(20, 95, 190, 95);
  
  // Salary Details
  doc.setFontSize(12);
  doc.text('RINCIAN GAJI', 20, 105);
  
  doc.setFontSize(10);
  const basicSalary = Number(payroll.basicSalary || 0);
  const overtimePay = Number(payroll.overtimePay || 0);
  const allowances = JSON.stringify(payroll.allowances) !== '{}' ? 500000 : 0;
  const grossSalary = Number(payroll.grossSalary || 0);
  
  doc.text(`Gaji Pokok       : Rp ${basicSalary.toLocaleString('id-ID')}`, 20, 115);
  doc.text(`Lembur           : Rp ${overtimePay.toLocaleString('id-ID')}`, 20, 122);
  doc.text(`Tunjangan        : Rp ${allowances.toLocaleString('id-ID')}`, 20, 129);
  doc.text(`GAJI KOTOR       : Rp ${grossSalary.toLocaleString('id-ID')}`, 20, 136);
  
  // Line separator
  doc.line(20, 141, 190, 141);
  
  // Deductions
  doc.setFontSize(12);
  doc.text('POTONGAN', 20, 151);
  
  doc.setFontSize(10);
  const bpjsHealth = Number(payroll.bpjsHealth || 0);
  const bpjsEmployment = Number(payroll.bpjsEmployment || 0);
  const pph21 = Number(payroll.pph21 || 0);
  const totalDeductions = bpjsHealth + bpjsEmployment + pph21;
  
  doc.text(`BPJS Kesehatan   : Rp ${bpjsHealth.toLocaleString('id-ID')}`, 20, 161);
  doc.text(`BPJS Ketenagakerjaan : Rp ${bpjsEmployment.toLocaleString('id-ID')}`, 20, 168);
  doc.text(`PPh 21           : Rp ${pph21.toLocaleString('id-ID')}`, 20, 175);
  doc.text(`TOTAL POTONGAN   : Rp ${totalDeductions.toLocaleString('id-ID')}`, 20, 182);
  
  // Line separator
  doc.setLineWidth(1);
  doc.line(20, 187, 190, 187);
  
  // Net Salary
  doc.setFontSize(14);
  doc.setTextColor(47, 79, 47);
  const netSalary = Number(payroll.netSalary || 0);
  doc.text(`GAJI BERSIH      : Rp ${netSalary.toLocaleString('id-ID')}`, 20, 197);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Slip ini dicetak secara otomatis oleh sistem TalentWhiz.ai', 105, 220, { align: 'center' });
  doc.text('Untuk pertanyaan, hubungi HR Department', 105, 227, { align: 'center' });
  
  // Convert to buffer
  const pdfArrayBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfArrayBuffer);
}