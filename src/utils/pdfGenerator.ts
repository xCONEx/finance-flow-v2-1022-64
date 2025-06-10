
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Job, WorkItem, MonthlyCost } from '../types';

// Declaração corrigida para autoTable
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
  primary: [79, 70, 229],
  secondary: [99, 102, 241],
  accent: [147, 51, 234],
  text: [31, 41, 55],
  textLight: [107, 114, 128],
  success: [34, 197, 94],
  background: [248, 250, 252],
  gray: [156, 163, 175]
};

export const generateJobPDF = async (job: Job, userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let currentY = 25;

  // Header com gradiente simulado
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Título principal com descrição
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  const headerText = `ORÇAMENTO - ${job.description || 'Serviço'}`;
  doc.text(headerText, margin, 22);

  // Logo premium no header se disponível
  if (userData?.logobase64) {
    try {
      const logoSize = 25;
      const logoX = pageWidth - logoSize - margin;
      const logoY = 5;
      doc.addImage(userData.logobase64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.log('Erro ao adicionar logo:', error);
    }
  }

  currentY = 50;

  // Detalhes do Projeto
  doc.setFillColor(...COLORS.background);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 45, 'F');
  
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('DETALHES DO PROJETO', margin + 5, currentY + 8);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Descrição: ${job.description || 'Não informado'}`, margin + 5, currentY + 18);
  doc.text(`Cliente: ${job.client || 'Não informado'}`, margin + 5, currentY + 25);
  doc.text(`Data do Evento: ${new Date(job.eventDate).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 32);
  doc.text(`Categoria: ${job.category || 'Não informado'}`, margin + 5, currentY + 39);

  currentY += 55;

  // Calcular valores
  const logistics = typeof job.logistics === 'number' ? job.logistics : 0;
  const equipment = typeof job.equipment === 'number' ? job.equipment : 0;
  const assistance = typeof job.assistance === 'number' ? job.assistance : 0;
  const custoTotal = logistics + equipment + assistance;
  const desconto = (job.serviceValue * (job.discountValue || 0)) / 100;
  const valorComDesconto = job.serviceValue - desconto;

  // Seção de Resumo Financeiro com header cinza
  doc.setFillColor(...COLORS.gray);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('RESUMO FINANCEIRO', margin + 5, currentY + 10);

  currentY += 20;

  // Preparar dados da tabela
  const tableData = [
    ['Horas estimadas', `${job.estimatedHours || 0}h`],
    ['Logística', logistics.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Equipamentos', equipment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Assistência', assistance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Custo total', custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Valor do serviço', job.serviceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]
  ];

  // Adicionar desconto se existir
  if (job.discountValue && job.discountValue > 0) {
    tableData.push(['Desconto (%)', `${job.discountValue}%`]);
    tableData.push(['Valor com desconto', valorComDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
  }

  // Criar tabela estilizada
  try {
    (doc as any).autoTable({
      startY: currentY,
      head: [['ITEM', 'VALOR']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontSize: 12,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 11,
        textColor: COLORS.text
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: {
        lineColor: COLORS.textLight,
        lineWidth: 0.5
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 'auto' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  } catch (error) {
    console.error('Erro ao gerar tabela:', error);
    // Fallback manual se autoTable falhar
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.text);
    
    currentY += 10;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    
    tableData.forEach((row, index) => {
      doc.text(row[0], margin, currentY + (index * 8));
      doc.text(row[1], pageWidth - margin - 50, currentY + (index * 8));
    });
    
    currentY += (tableData.length * 8) + 15;
  }

  // Rodapé elegante
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, currentY, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Este orçamento é uma estimativa baseada nas informações fornecidas.', margin, currentY + 10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY + 18);

  // Salvar o PDF
  doc.save(`Orcamento_${job.client?.replace(/\s+/g, '_') || 'Cliente'}_${job.description?.replace(/\s+/g, '_') || 'Job'}.pdf`);
};

export const generateWorkItemsPDF = async (workItems: WorkItem[], userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let currentY = 25;

  // Header com estilo
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('RELATÓRIO DE ITENS DE TRABALHO', margin, 22);

  // Logo premium se disponível
  if (userData?.logobase64) {
    try {
      const logoSize = 25;
      const logoX = pageWidth - logoSize - margin;
      const logoY = 5;
      doc.addImage(userData.logobase64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.log('Erro ao adicionar logo:', error);
    }
  }

  currentY = 55;

  // Informações gerais
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY);
  doc.text(`Total de itens: ${workItems.length}`, margin, currentY + 8);

  currentY += 25;

  // Agrupar por categoria
  const itemsByCategory = workItems.reduce((acc, item) => {
    const category = item.category || 'Sem Categoria';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, WorkItem[]>);

  // Criar tabela por categoria
  Object.entries(itemsByCategory).forEach(([category, items]) => {
    // Cabeçalho da categoria
    doc.setFillColor(...COLORS.secondary);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(category.toUpperCase(), margin + 5, currentY + 6);

    currentY += 15;

    const categoryData = items.map(item => [
      item.description,
      item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ]);

    const categoryTotal = items.reduce((sum, item) => sum + item.value, 0);

    try {
      (doc as any).autoTable({
        startY: currentY,
        head: [['Descrição', 'Valor']],
        body: [
          ...categoryData,
          ['SUBTOTAL', categoryTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]
        ],
        theme: 'striped',
        headStyles: {
          fillColor: COLORS.accent,
          textColor: [255, 255, 255],
          fontSize: 11
        },
        bodyStyles: {
          fontSize: 10,
          textColor: COLORS.text
        },
        styles: {
          lineColor: COLORS.textLight,
          lineWidth: 0.3
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    } catch (error) {
      console.error('Erro ao gerar tabela da categoria:', error);
      // Fallback manual
      categoryData.forEach((row, index) => {
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(10);
        doc.text(row[0], margin, currentY + (index * 6));
        doc.text(row[1], pageWidth - margin - 40, currentY + (index * 6));
      });
      currentY += (categoryData.length * 6) + 15;
    }
  });

  // Total geral
  const totalValue = workItems.reduce((sum, item) => sum + item.value, 0);
  
  doc.setFillColor(...COLORS.success);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL GERAL:', margin + 5, currentY + 8);
  doc.text(totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), pageWidth - margin - 50, currentY + 8);

  doc.save(`itens_trabalho_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '_')}.pdf`);
};

export const generateExpensesPDF = async (expenses: MonthlyCost[], userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let currentY = 25;

  // Header estilizado
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('RELATÓRIO DE DESPESAS MENSAIS', margin, 22);

  // Logo premium se disponível
  if (userData?.logobase64) {
    try {
      const logoSize = 25;
      const logoX = pageWidth - logoSize - margin;
      const logoY = 5;
      doc.addImage(userData.logobase64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.log('Erro ao adicionar logo:', error);
    }
  }

  currentY = 55;

  // Informações gerais
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY);
  doc.text(`Total de despesas: ${expenses.length}`, margin, currentY + 8);

  currentY += 25;

  // Agrupar por categoria
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Sem Categoria';
    if (!acc[category]) acc[category] = [];
    acc[category].push(expense);
    return acc;
  }, {} as Record<string, MonthlyCost[]>);

  // Criar tabela por categoria
  Object.entries(expensesByCategory).forEach(([category, items]) => {
    // Cabeçalho da categoria
    doc.setFillColor(...COLORS.secondary);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(category.toUpperCase(), margin + 5, currentY + 6);

    currentY += 15;

    const categoryData = items.map(expense => [
      expense.description || 'Sem descrição',
      expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      new Date(expense.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    ]);

    const categoryTotal = items.reduce((sum, expense) => sum + expense.value, 0);

    try {
      (doc as any).autoTable({
        startY: currentY,
        head: [['Descrição', 'Valor', 'Mês']],
        body: [
          ...categoryData,
          ['SUBTOTAL', categoryTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), '']
        ],
        theme: 'striped',
        headStyles: {
          fillColor: COLORS.accent,
          textColor: [255, 255, 255],
          fontSize: 11
        },
        bodyStyles: {
          fontSize: 10,
          textColor: COLORS.text
        },
        styles: {
          lineColor: COLORS.textLight,
          lineWidth: 0.3
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    } catch (error) {
      console.error('Erro ao gerar tabela da categoria:', error);
      // Fallback manual
      categoryData.forEach((row, index) => {
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(10);
        doc.text(row[0].substring(0, 30), margin, currentY + (index * 6));
        doc.text(row[1], margin + 80, currentY + (index * 6));
        doc.text(row[2].substring(0, 15), margin + 130, currentY + (index * 6));
      });
      currentY += (categoryData.length * 6) + 15;
    }
  });

  // Total geral
  const totalValue = expenses.reduce((sum, expense) => sum + expense.value, 0);
  
  doc.setFillColor(...COLORS.success);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL GERAL:', margin + 5, currentY + 8);
  doc.text(totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), pageWidth - margin - 50, currentY + 8);

  doc.save(`despesas_mensais_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '_')}.pdf`);
};
