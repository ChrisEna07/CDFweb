import { supabase } from './src/lib/supabase.js'

async function checkSchema() {
  const { data, error } = await supabase.from('clientes').select('*').limit(1)
  if (error) console.error(error)
  else console.log(Object.keys(data[0] || {}))
}

checkSchema()
