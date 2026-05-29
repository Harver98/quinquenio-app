import { createClient } from '@/lib/supabase/client'
import { comprimirImagen } from '@/utils/imagen'
import type { Inscrito, EstadoPago } from '@/types'

export async function getInscritos(): Promise<Inscrito[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inscritos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getInscrito(id: string): Promise<Inscrito | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inscritos')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getInscritoPorCedula(cedula: string): Promise<Inscrito | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('inscritos')
    .select('*')
    .eq('cedula', cedula)
    .single()
  return data
}


export async function crearInscrito(
  datos: Omit<Inscrito, 'id' | 'qr_token' | 'ingreso' | 'fecha_ingreso' | 'comprobante_url' | 'created_at' | 'boton_extra' | 'estado_pago'>,
  archivo?: File
): Promise<Inscrito> {
  const supabase = createClient()
  let comprobante_url: string | undefined

  if (archivo) {
    const comprimido = await comprimirImagen(archivo)
    const nombreArchivo = `${datos.cedula}-${Date.now()}.webp`
    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(nombreArchivo, comprimido, { contentType: 'image/webp', upsert: true })
    if (uploadError) throw uploadError
    comprobante_url = nombreArchivo
  }

  const { data, error } = await supabase
    .from('inscritos')
    .insert({ 
      ...datos, 
      comprobante_url, 
      estado_pago: 'pendiente' 
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function actualizarEstadoPago(
  id: string,
  estado: EstadoPago
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('inscritos')
    .update({ estado_pago: estado })
    .eq('id', id)
  if (error) throw error
}

export async function getComprobanteUrl(path: string): Promise<string> {
  const supabase = createClient()
  const { data } = await supabase.storage
    .from('comprobantes')
    .createSignedUrl(path, 3600)
  return data?.signedUrl || ''
}

export async function eliminarInscrito(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('inscritos').delete().eq('id', id)
  if (error) throw error
}