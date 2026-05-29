import imageCompression from 'browser-image-compression'

export async function comprimirImagen(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.7,
  }

  try {
    const comprimido = await imageCompression(file, options)
    return new File([comprimido], file.name.replace(/\.[^.]+$/, '.webp'), {
      type: 'image/webp',
    })
  } catch {
    return file
  }
}

export function validarArchivo(file: File): string | null {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp']
  if (!tiposPermitidos.includes(file.type)) {
    return 'Solo se permiten imágenes JPG, PNG o WEBP'
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'El archivo no puede superar 10MB'
  }
  return null
}
