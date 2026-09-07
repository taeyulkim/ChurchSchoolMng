import QRCode from 'qrcode';

// 5.5cm x 8.5cm 카드를 300dpi에 준하는 해상도로 렌더링합니다.
const PX_PER_CM = 650 / 5.5;
const CARD_W = Math.round(5.5 * PX_PER_CM);
const CARD_H = Math.round(8.5 * PX_PER_CM);
const cm = (v: number) => v * PX_PER_CM;

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
    img.src = src;
  });
}

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawAvatarFallback(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#e3e5f5';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#4f46e5';
  ctx.font = `700 ${Math.round(h * 0.4)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.charAt(0), x + w / 2, y + h / 2);
}

export interface StudentIdCardData {
  name: string;
  department: string;
  grade?: string | null;
  qrUrl: string;
  photoUrl?: string | null;
  orgName?: string;
}

export async function renderStudentIdCard(data: StudentIdCardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('캔버스를 생성할 수 없습니다.');

  roundRectPath(ctx, 0, 0, CARD_W, CARD_H, cm(0.28));
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.save();
  roundRectPath(ctx, 0, 0, CARD_W, CARD_H, cm(0.28));
  ctx.clip();

  // 목걸이 구멍
  ctx.fillStyle = 'rgba(20,20,40,0.14)';
  roundRectPath(ctx, CARD_W / 2 - cm(0.25), cm(0.16), cm(0.5), cm(0.14), cm(0.07));
  ctx.fill();

  // 상단 띠 (교회학교 표시)
  const bandCenterY = cm(0.42);
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.arc(cm(0.32) + cm(0.12), bandCenterY, cm(0.12), 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `700 ${Math.round(cm(0.19))}px sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(data.orgName || '교회학교 학생증', cm(0.32) + cm(0.24) + cm(0.1), bandCenterY);

  // 사진 영역
  const photoX = cm(0.32);
  const photoY = cm(0.66);
  const photoW = CARD_W - cm(0.64);
  const photoH = cm(2.9);
  ctx.save();
  roundRectPath(ctx, photoX, photoY, photoW, photoH, cm(0.16));
  ctx.clip();
  if (data.photoUrl) {
    try {
      const img = await loadImage(data.photoUrl);
      drawCoverImage(ctx, img, photoX, photoY, photoW, photoH);
    } catch {
      drawAvatarFallback(ctx, data.name, photoX, photoY, photoW, photoH);
    }
  } else {
    drawAvatarFallback(ctx, data.name, photoX, photoY, photoW, photoH);
  }
  ctx.restore();

  // 부서/학년 뱃지
  const tagText = data.grade ? `${data.department} · ${data.grade}` : data.department;
  ctx.font = `700 ${Math.round(cm(0.15))}px sans-serif`;
  const tagPadX = cm(0.16);
  const dotAreaW = cm(0.14);
  const tagTextWidth = ctx.measureText(tagText).width;
  const tagW = tagTextWidth + tagPadX * 2 + dotAreaW;
  const tagH = cm(0.28);
  const tagY = photoY + photoH + cm(0.16);
  const tagX = CARD_W / 2 - tagW / 2;
  ctx.fillStyle = '#eeecfd';
  roundRectPath(ctx, tagX, tagY, tagW, tagH, tagH / 2);
  ctx.fill();
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.arc(tagX + tagPadX, tagY + tagH / 2, cm(0.03), 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, tagX + tagPadX + dotAreaW / 2, tagY + tagH / 2);

  // 이름
  const nameFontPx = cm(0.38);
  const nameY = tagY + tagH + cm(0.08) + nameFontPx / 2;
  ctx.fillStyle = '#1c2033';
  ctx.font = `900 ${Math.round(nameFontPx)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.name, CARD_W / 2, nameY);

  // QR 코드
  const qrSize = cm(2.3);
  const qrWrapPad = cm(0.1);
  const qrWrapSize = qrSize + qrWrapPad * 2;
  const qrWrapX = CARD_W / 2 - qrWrapSize / 2;
  const qrWrapY = nameY + nameFontPx / 2 + cm(0.08) + cm(0.04);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e7e8f2';
  ctx.lineWidth = 1;
  roundRectPath(ctx, qrWrapX, qrWrapY, qrWrapSize, qrWrapSize, cm(0.12));
  ctx.fill();
  ctx.stroke();

  const qrDataUrl = await QRCode.toDataURL(data.qrUrl, {
    width: 480,
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#1c2033', light: '#ffffff' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrWrapX + qrWrapPad, qrWrapY + qrWrapPad, qrSize, qrSize);

  // 하단 문구
  ctx.fillStyle = '#9498ae';
  ctx.font = `500 ${Math.round(cm(0.11))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('STUDENT ID', CARD_W / 2, CARD_H - cm(0.18));

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('이미지 생성에 실패했습니다.'))), 'image/png');
  });
}
