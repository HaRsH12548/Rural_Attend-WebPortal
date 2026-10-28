import * as XLSX from '@e965/xlsx';
import { describe, expect, it } from 'vitest';
import { parseStudentImportFile } from '@/features/classes/studentImport';

function makeFile(name, content) {
  const bytes =
    typeof content === 'string'
      ? Uint8Array.from([...content].map((character) => character.charCodeAt(0)))
      : ArrayBuffer.isView(content)
        ? new Uint8Array(content.buffer, content.byteOffset, content.byteLength)
        : new Uint8Array(content);
  return {
    name,
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.slice().buffer,
  };
}

describe('student import file parser', () => {
  it('parses CSV headers and student rows', async () => {
    const file = makeFile(
      'students.csv',
      'Name,Class,Section\n"Asha, Patel",Class 1,a\nRavi Kumar,Class 2,B',
    );

    await expect(parseStudentImportFile(file)).resolves.toEqual([
      { name: 'Asha, Patel', grade: 'Class 1', section: 'A', rowNumber: 2 },
      { name: 'Ravi Kumar', grade: 'Class 2', section: 'B', rowNumber: 3 },
    ]);
  });

  it('parses Excel workbooks', async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Name', 'Class', 'Section'],
      ['Asha Patel', 'Class 1', 'A'],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Students');
    const file = makeFile('students.xlsx', XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }));

    await expect(parseStudentImportFile(file)).resolves.toEqual([
      { name: 'Asha Patel', grade: 'Class 1', section: 'A', rowNumber: 2 },
    ]);
  });

  it('parses legacy XLS workbooks', async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Name', 'Class', 'Section'],
      ['Ravi Kumar', 'Class 2', 'B'],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Students');
    const file = makeFile('students.xls', XLSX.write(workbook, { type: 'array', bookType: 'xls' }));

    await expect(parseStudentImportFile(file)).resolves.toEqual([
      { name: 'Ravi Kumar', grade: 'Class 2', section: 'B', rowNumber: 2 },
    ]);
  });

  it('rejects files with missing required headers', async () => {
    const file = makeFile('students.csv', 'Name,Class\nAsha Patel,Class 1');

    await expect(parseStudentImportFile(file)).rejects.toThrow(
      'The first row must contain Name, Class, and Section columns.',
    );
  });

  it('parses demo CSV with warning comment header and skips comment lines', async () => {
    const demoCsv =
      '# WARNING: Make sure class exists in database before listing here\n' +
      'Name,Class,Section\n' +
      'Asha Patel,Class 1,A\n' +
      '# Note: comment row\n' +
      'Ravi Kumar,Class 2,B';
    const file = makeFile('demo-students.csv', demoCsv);

    await expect(parseStudentImportFile(file)).resolves.toEqual([
      { name: 'Asha Patel', grade: 'Class 1', section: 'A', rowNumber: 3 },
      { name: 'Ravi Kumar', grade: 'Class 2', section: 'B', rowNumber: 5 },
    ]);
  });

  it('parses parent phone when column is present', async () => {
    const csvWithPhone =
      'Name,Class,Section,Parent Phone\n' +
      'Asha Patel,Class 1,A,+91 98765 43210\n' +
      'Ravi Kumar,Class 2,B,';
    const file = makeFile('students-phone.csv', csvWithPhone);

    await expect(parseStudentImportFile(file)).resolves.toEqual([
      { name: 'Asha Patel', grade: 'Class 1', section: 'A', parentPhone: '+91 98765 43210', rowNumber: 2 },
      { name: 'Ravi Kumar', grade: 'Class 2', section: 'B', parentPhone: '', rowNumber: 3 },
    ]);
  });
});
