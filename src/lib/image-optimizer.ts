
"use client";

interface ImageOptimizerOptions {
  maxWidth: number;
  quality: number;
}

const defaultOptions: ImageOptimizerOptions = {
  maxWidth: 1280, // Largura máxima de 1280px
  quality: 0.7,   // 70% de qualidade JPEG
};

/**
 * Redimensiona e comprime um arquivo de imagem no lado do cliente.
 * @param file O arquivo de imagem original.
 * @param options Opções de otimização (maxWidth, quality).
 * @returns Uma Promise que resolve para o novo arquivo de imagem otimizado.
 */
export function optimizeImage(file: File, options: Partial<ImageOptimizerOptions> = {}): Promise<File> {
  const settings = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Não foi possível obter o contexto do canvas.'));
        }

        let { width, height } = img;

        if (width > settings.maxWidth) {
          height = (settings.maxWidth / width) * height;
          width = settings.maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Falha ao criar o blob da imagem.'));
            }
            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const optimizedFile = new File([blob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          },
          'image/jpeg',
          settings.quality
        );
      };
    };
  });
}

/**
 * Otimiza uma assinatura em formato data URL (PNG) para JPEG.
 * @param dataUrl A assinatura em formato data URL.
 * @param options Opções de otimização.
 * @returns Uma Promise que resolve para a nova assinatura em formato data URL (JPEG).
 */
export function optimizeSignature(dataUrl: string, options: Partial<ImageOptimizerOptions> = {}): Promise<string> {
    const settings = { ...defaultOptions, quality: 0.8, ...options }; // Higher quality for signature
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = dataUrl;
        img.onerror = reject;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Não foi possível obter o contexto do canvas.'));
            }
            // Fill background with white because original is transparent
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', settings.quality);
            resolve(optimizedDataUrl);
        }
    });
}
