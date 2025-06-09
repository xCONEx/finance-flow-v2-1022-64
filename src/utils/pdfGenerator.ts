
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Job, WorkItem, MonthlyCost } from '../types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Cores do FinanceFlow
const COLORS = {
  primary: [99, 102, 241], // Indigo
  secondary: [139, 69, 19], // Brown
  accent: [16, 185, 129], // Emerald
  text: [31, 41, 55], // Gray-800
  lightText: [107, 114, 128], // Gray-500
  background: [249, 250, 251], // Gray-50
  white: [255, 255, 255]
};

const addHeader = (doc: jsPDF, title: string, userData: any) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Fundo do header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Logo da empresa (se premium e tiver logo)
  const isPremium = true; // Ajustar conforme lógica de premium
  if (isPremium && userData?.logobase64) {
    try {
      const logoSize = 35;
      const logoX = pageWidth - logoSize - margin;
      const logoY = 7.5;
      doc.addImage(userData.logobase64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
    }
  }
  
  // Título
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 30);
  
  // Linha decorativa
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(2);
  doc.line(margin, 45, pageWidth - margin, 45);
  
  return 60; // Retorna Y position após o header
};

const addFooter = (doc: jsPDF) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Linha decorativa
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1);
  doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
  
  // Texto do footer
  doc.setTextColor(...COLORS.lightText);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório gerado pelo FinanceFlow', margin, pageHeight - 15);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 60, pageHeight - 15);
};

export const generateJobPDF = async (job: Job, userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  let currentY = addHeader(doc, `Orçamento - ${job.client || 'Cliente'}`, userData);
  
  // Informações do job
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const jobInfo = [
    `Descrição: ${job.description || 'Não informado'}`,
    `Data do Evento: ${new Date(job.eventDate).toLocaleDateString('pt-BR')}`,
    `Categoria: ${job.category || 'Não informado'}`,
    `Horas Estimadas: ${job.estimatedHours || 0}h`
  ];
  
  jobInfo.forEach((info, index) => {
    doc.text(info, margin, currentY + (index * 8));
  });
  
  currentY += jobInfo.length * 8 + 20;
  
  // Calcular valores
  const logistics = typeof job.logistics === 'number' ? job.logistics : 0;
  const equipment = typeof job.equipment === 'number' ? job.equipment : 0;
  const assistance = typeof job.assistance === 'number' ? job.assistance : 0;
  const custoTotal = logistics + equipment + assistance;
  const desconto = (job.serviceValue * (job.discountValue || 0)) / 100;
  const valorComDesconto = job.serviceValue - desconto;

  // Tabela de valores
  const tableData = [
    ['Logística', logistics.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Equipamentos', equipment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Assistência', assistance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Custo Total', custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Valor do Serviço', job.serviceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]
  ];

  if (job.discountValue && job.discountValue > 0) {
    tableData.push(['Desconto (%)', `${job.discountValue}%`]);
    tableData.push(['Valor Final', valorComDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
  }

  try {
    (doc as any).autoTable({
      startY: currentY,
      head: [['Item', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: 12,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 11,
        textColor: COLORS.text
      },
      alternateRowStyles: {
        fillColor: COLORS.background
      },
      margin: { left: margin, right: margin }
    });
  } catch (error) {
    console.error('Erro ao gerar tabela:', error);
  }

  addFooter(doc);
  doc.save(`Orcamento_${job.client?.replace(/\s+/g, '_') || 'Cliente'}_${job.description?.replace(/\s+/g, '_') || 'Job'}.pdf`);
};

export const generateWorkItemsPDF = async (workItems: WorkItem[], userData: any) => {
  const doc = new jsPDF();
  const margin = 20;
  
  let currentY = addHeader(doc, 'Relatório de Itens de Trabalho', userData);
  
  // Informações gerais
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.text(`Total de itens: ${workItems.length}`, margin, currentY);
  
  const totalValue = workItems.reduce((sum, item) => sum + item.value, 0);
  doc.text(`Valor total: ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, margin, currentY + 10);
  
  currentY += 30;

  // Agrupar por categoria
  const groupedItems = workItems.reduce((acc, item) => {
    const category = item.category || 'Sem categoria';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, WorkItem[]>);

  // Renderizar cada categoria
  Object.entries(groupedItems).forEach(([category, items]) => {
    // Título da categoria
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${category}`, margin, currentY);
    currentY += 15;

    // Tabela dos itens da categoria
    const tableData = items.map(item => [
      item.description,
      item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      `${item.depreciationYears || 5} anos`
    ]);

    const categoryTotal = items.reduce((sum, item) => sum + item.value, 0);
    tableData.push([
      'SUBTOTAL',
      categoryTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      ''
    ]);

    try {
      (doc as any).autoTable({
        startY: currentY,
        head: [['Descrição', 'Valor', 'Depreciação']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.accent,
          textColor: COLORS.white,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: COLORS.text
        },
        alternateRowStyles: {
          fillColor: COLORS.background
        },
        margin: { left: margin, right: margin }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
    } catch (error) {
      console.error('Erro ao gerar tabela:', error);
      currentY += 100;
    }
  });

  addFooter(doc);
  doc.save(`itens_trabalho_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '_')}.pdf`);
};

export const generateExpensesPDF = async (expenses: MonthlyCost[], userData: any) => {
  console.log('🔄 Iniciando geração de PDF de despesas...');
  
  try {
    const doc = new jsPDF();
    const margin = 20;
    
    let currentY = addHeader(doc, 'Relatório de Despesas Mensais', userData);
    
    // Informações gerais
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(12);
    doc.text(`Total de despesas: ${expenses.length}`, margin, currentY);
    
    const totalValue = expenses.reduce((sum, expense) => sum + (expense.value || 0), 0);
    doc.text(`Valor total: ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, margin, currentY + 10);
    
    currentY += 30;

    // Agrupar por categoria
    const groupedExpenses = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Sem categoria';
      if (!acc[category]) acc[category] = [];
      acc[category].push(expense);
      return acc;
    }, {} as Record<string, MonthlyCost[]>);

    // Renderizar cada categoria
    Object.entries(groupedExpenses).forEach(([category, items]) => {
      // Título da categoria
      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${category}`, margin, currentY);
      currentY += 15;

      // Tabela dos itens da categoria
      const tableData = items.map(expense => [
        expense.description || 'Sem descrição',
        expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        new Date(expense.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      ]);

      const categoryTotal = items.reduce((sum, expense) => sum + (expense.value || 0), 0);
      tableData.push([
        'SUBTOTAL',
        categoryTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        ''
      ]);

      try {
        (doc as any).autoTable({
          startY: currentY,
          head: [['Descrição', 'Valor', 'Mês']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: COLORS.accent,
            textColor: COLORS.white,
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 9,
            textColor: COLORS.text
          },
          alternateRowStyles: {
            fillColor: COLORS.background
          },
          margin: { left: margin, right: margin }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 20;
      } catch (error) {
        console.error('Erro ao gerar tabela da categoria:', error);
        currentY += 100;
      }
    });

    addFooter(doc);
    doc.save(`despesas_mensais_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '_')}.pdf`);
    console.log('✅ PDF de despesas gerado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral ao gerar PDF de despesas:', error);
    throw new Error('Falha ao gerar PDF de despesas: ' + error.message);
  }
};
