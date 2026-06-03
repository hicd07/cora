import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS para peticiones preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Validación manual de autenticación (verify_jwt está desactivado por defecto)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error("[admin-manual-bid] No se proporcionó encabezado de autorización");
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      console.error("[admin-manual-bid] Fallo de autenticación", { authError });
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificación de rol: Solo administradores pueden ejecutar esta función
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !roleData) {
      console.error("[admin-manual-bid] Acceso denegado: El usuario no es administrador", { userId: user.id });
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { requestId, storeName, deliveryTime, items } = body

    console.log("[admin-manual-bid] Registrando cotización manual", { requestId, storeName, deliveryTime });

    // 1. Crear el registro en hardware_bids
    const { data: bid, error: bidError } = await supabaseClient
      .from('hardware_bids')
      .insert({
        request_id: requestId,
        store_name: storeName,
        delivery_time: deliveryTime,
        bidder_user_id: null, // Nulo para cotizaciones manuales externas
        is_test: false
      })
      .select()
      .single()

    if (bidError) {
      console.error("[admin-manual-bid] Error de base de datos al crear bid", { bidError });
      return new Response(JSON.stringify({ error: 'Error creating bid record', details: bidError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Crear las ofertas individuales para cada material
    const offersToInsert = items.map((item: any) => ({
      bid_id: bid.id,
      item_name: item.item_name,
      unit_price: item.unit_price,
      is_available: item.is_available ?? true
    }))

    const { error: offersError } = await supabaseClient
      .from('bid_offers')
      .insert(offersToInsert)

    if (offersError) {
      console.error("[admin-manual-bid] Error de base de datos al crear ofertas", { offersError });
      return new Response(JSON.stringify({ error: 'Error creating bid offers', details: offersError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log("[admin-manual-bid] Cotización registrada exitosamente", { bidId: bid.id });

    return new Response(JSON.stringify({ success: true, bidId: bid.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[admin-manual-bid] Error crítico de la función", { error: error.message });
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})