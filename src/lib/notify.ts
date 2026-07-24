import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface NotifyParams {
  user_id  : string
  type     : string
  title    : string
  message  : string
  metadata?: Record<string, string>
}

export async function notify({ user_id, type, title, message, metadata }: NotifyParams) {
  const { error } = await supabase.from('notifications').insert({
    user_id,
    type,
    title,
    message,
    is_read : false,
    metadata: metadata ?? null,
  } as any)
  if (error) {
    console.error('Notification insert failed:', error.message)
    toast.error(`Notification insert failed: ${error.message}`);
  }
}

export async function notifyAdmins(params: Omit<NotifyParams, 'user_id'>) {
  const { data: admins, error } = await supabase.from('profiles').select('id').eq('role', 'admin')
  const castAdmins = admins as any[]
  
  if (error) {
    console.error('Failed to fetch admins:', error.message)
    toast.error(`Admin fetch failed: ${error.message}`);
  }

  for (const admin of castAdmins ?? []) {
    await notify({ ...params, user_id: admin.id })
  }
}

