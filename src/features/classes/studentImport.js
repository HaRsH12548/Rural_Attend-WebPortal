import { MAX_STUDENT_IMPORT_ROWS } from '@/lib/constants';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const REQUIRED_COLUMNS = ['name', 'class', 'section'];

/**
 * Parses student records from a CSV or Excel workbook's first worksheet.
 * Expected columns are Name, Class, and Section.
 * @param {{ name: string, size: number, arrayBuffer: () => Promise<ArrayBuffer> }} file Uploaded file.
 * @returns {Promise<Array<{ name: string, grade: string, section: string, rowNumber: number }>>} Parsed records.
 */
export async function parseStudentImportFile(file) {
  if (!file) {
    throw new Error('Choose a CSV, XLS, or XLSX file to import.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('The file is too large. Maximum upload size is 5 MB.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!['csv', 'xls', 'xlsx'].includes(extension)) {
    throw new Error('Choose a CSV, XLS, or XLSX file.');
  }

  const XLSX = await import('@e965/xlsx');
  let workbook;
  try {
    workbook = XLSX.read(await file.arrayBuffer(), {
      type: 'array',
      sheetRows: MAX_STUDENT_IMPORT_ROWS + 2,
    });
  } catch {
    throw new Error('This file could not be read. Check that it is a valid CSV or Excel file.');
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName && workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error('The uploaded file does not contain a worksheet.');
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: true,
    raw: false,
  });
  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i += 1) {
    const firstCell = String(rows[i]?.[0] ?? '').trim();
    if (firstCell.startsWith('#') || rows[i].every((cell) => !String(cell).trim())) {
      continue;
    }
    headerRowIndex = i;
    break;
  }

  if (headerRowIndex === -1) {
    throw new Error('The first row must contain Name, Class, and Section columns.');
  }

  const headerRow = rows[headerRowIndex]?.map((value) => String(value).trim().toLowerCase()) ?? [];
  const columnIndexes = REQUIRED_COLUMNS.map((column) => headerRow.indexOf(column));
  if (columnIndexes.some((index) => index < 0)) {
    throw new Error('The first row must contain Name, Class, and Section columns.');
  }

  const parentPhoneIndex = headerRow.findIndex((col) =>
    ['parent phone', 'parent phone number', 'parent contact', 'parent number', 'parents number', 'parent', 'phone'].includes(col),
  );

  const dataRows = rows.slice(headerRowIndex + 1);
  if (dataRows.length > MAX_STUDENT_IMPORT_ROWS) {
    throw new Error(`The file exceeds the maximum of ${MAX_STUDENT_IMPORT_ROWS} students per import.`);
  }

  const records = dataRows.flatMap((row, index) => {
    const firstCell = String(row[0] ?? '').trim();
    if (firstCell.startsWith('#')) {
      return [];
    }
    const record = {
      name: String(row[columnIndexes[0]] ?? '').trim(),
      grade: String(row[columnIndexes[1]] ?? '').trim(),
      section: String(row[columnIndexes[2]] ?? '').trim().toUpperCase(),
      rowNumber: headerRowIndex + index + 2,
    };
    if (parentPhoneIndex >= 0) {
      record.parentPhone = String(row[parentPhoneIndex] ?? '').trim();
    }
    return record.name || record.grade || record.section ? [record] : [];
  });
  if (records.length === 0) {
    throw new Error('The file contains no student rows.');
  }

  return records;
}
