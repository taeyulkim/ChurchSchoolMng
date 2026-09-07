/**
 * 이미지 파일을 지정된 최대 크기로 리사이즈하고 JPEG로 압축합니다.
 * 스토리지 용량과 로딩 속도를 위해 업로드 전 클라이언트에서 처리합니다.
 */
export async function resizeImageFile(file: File, maxDimension = 400, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이미지를 처리할 수 없습니다.');
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했습니다.'))),
      'image/jpeg',
      quality
    );
  });

  return new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
}
