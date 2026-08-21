const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, PageOrientation, PageBreak,
  Numbering, LevelFormat, convertInchesToTwip, VerticalAlign, Header, Footer, PageNumber
} = require('docx');

const COLOR_PRIMARY = '7A1F2B'; // vino tinto UNAL-ish institutional red
const COLOR_DARK = '1F1F1F';
const COLOR_GREY = '595959';
const COLOR_LIGHT_SHADE = 'F2E4E6';
const COLOR_HEADER_SHADE = '7A1F2B';

function titlePage(title, subtitle, meta) {
  const paras = [
    new Paragraph({ text: '', spacing: { before: 1600 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'UNIVERSIDAD NACIONAL DE COLOMBIA', bold: true, size: 22, color: COLOR_GREY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Facultad de Ciencias Económicas · Unidad de Informática (UIFCE)', size: 20, color: COLOR_GREY })],
      spacing: { after: 600 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: title, bold: true, size: 44, color: COLOR_PRIMARY })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: subtitle, size: 26, color: COLOR_DARK })],
      spacing: { after: 1200 },
    }),
  ];
  meta.forEach(m => {
    paras.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: m, size: 20, color: COLOR_GREY })],
      spacing: { after: 80 },
    }));
  });
  paras.push(new Paragraph({ children: [new PageBreak()] }));
  return paras;
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { color: COLOR_PRIMARY, space: 4, style: BorderStyle.SINGLE, size: 6 } },
    children: [new TextRun({ text, bold: true, color: COLOR_PRIMARY, size: 30 })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, color: COLOR_PRIMARY, size: 25 })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: COLOR_DARK, size: 22 })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}

function pMixed(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    ...opts,
    children: runs.map(r => new TextRun({ size: 21, ...r })),
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 100, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    numbering: { reference: 'bullet-list', level: 0 },
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}

function bulletBold(boldText, restText) {
  return new Paragraph({
    spacing: { after: 100, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    numbering: { reference: 'bullet-list', level: 0 },
    children: [
      new TextRun({ text: boldText, bold: true, size: 21 }),
      new TextRun({ text: restText, size: 21 }),
    ],
  });
}

function cell(text, opts = {}) {
  const { bold = false, shade = null, color = COLOR_DARK, width, align = AlignmentType.LEFT, size = 19 } = opts;
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: shade ? { type: ShadingType.CLEAR, color: 'auto', fill: shade } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: Array.isArray(text)
      ? text.map(t => new Paragraph({ alignment: align, children: [new TextRun({ text: t, bold, color, size })] }))
      : [new Paragraph({ alignment: align, children: [new TextRun({ text, bold, color, size })] })],
  });
}

function headerRow(headers, widths) {
  return new TableRow({
    tableHeader: true,
    children: headers.map((htext, i) => cell(htext, { bold: true, color: 'FFFFFF', shade: COLOR_HEADER_SHADE, width: widths[i], align: AlignmentType.CENTER })),
  });
}

function dataRow(values, widths, opts = {}) {
  const { shadeAlt = false } = opts;
  return new TableRow({
    children: values.map((v, i) => cell(v, { width: widths[i], shade: shadeAlt ? 'F7F0F1' : undefined })),
  });
}

function makeTable(widths, rows) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'D9D9D9' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'D9D9D9' },
    },
  });
}

const numberingConfig = {
  config: [
    {
      reference: 'bullet-list',
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } },
      ],
    },
  ],
};

function baseSections(children) {
  return {
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1350, bottom: 1350, left: 1350, right: 1350 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Área de Estrategias Tecnológicas (ET) · Planeación 2026-2', size: 15, color: COLOR_GREY, italics: true })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'UIFCE · Facultad de Ciencias Económicas · UNAL — Página ', size: 15, color: COLOR_GREY }),
            new TextRun({ children: [PageNumber.CURRENT], size: 15, color: COLOR_GREY }),
            new TextRun({ text: ' de ', size: 15, color: COLOR_GREY }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, color: COLOR_GREY }),
          ],
        })],
      }),
    },
    children,
  };
}

function buildDoc(sectionsChildren) {
  return new Document({
    numbering: numberingConfig,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 21 } },
      },
    },
    sections: [baseSections(sectionsChildren)],
  });
}

module.exports = {
  Packer, titlePage, h1, h2, h3, p, pMixed, bullet, bulletBold, cell, headerRow, dataRow, makeTable, buildDoc,
  COLOR_PRIMARY, COLOR_DARK, COLOR_GREY, COLOR_LIGHT_SHADE,
};
