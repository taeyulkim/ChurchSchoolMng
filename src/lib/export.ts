import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

/**
 * 데이터를 엑셀 파일로 다운로드합니다.
 * @param data 엑셀로 변환할 JSON 배열
 * @param filename 다운로드될 파일명 (확장자 제외)
 */
export function downloadExcel(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('출력할 데이터가 없습니다.');
    return;
  }

  // 1. 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2. 워크북 생성 및 워크시트 추가
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // 3. 엑셀 파일 버퍼(ArrayBuffer) 생성
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // 4. Blob 생성 후 file-saver로 다운로드 트리거
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  const today = format(new Date(), 'yyyyMMdd');
  saveAs(blob, `${filename}_${today}.xlsx`);
}
