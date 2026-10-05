const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 900;
const JPEG_QUALITY = 0.82;

/**
 * Turns a picture chosen by the administrator into a compact JPEG, ready to upload.
 * Scaling down here keeps uploads small and quick, whatever the camera produced.
 */
export function fileToProductImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Tệp được chọn không phải là hình ảnh.'));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      reject(new Error('Ảnh vượt quá 8MB. Vui lòng chọn ảnh nhỏ hơn.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Trình duyệt không hỗ trợ xử lý ảnh.'));
        return;
      }
      // JPEG has no transparency: put transparent pictures on white instead of black
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Không xử lý được ảnh này.'))),
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không đọc được tệp ảnh này.'));
    };

    image.src = objectUrl;
  });
}
