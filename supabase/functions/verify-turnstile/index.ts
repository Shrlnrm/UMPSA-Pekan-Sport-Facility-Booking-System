import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Read Secret Key securely from Supabase Environment Variables
    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!secretKey) {
      console.error('Missing TURNSTILE_SECRET_KEY in environment')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Verify with Cloudflare
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)

    // Using real IP if available for extra security
    const clientIp = req.headers.get('x-forwarded-for')
    if (clientIp) {
      formData.append('remoteip', clientIp)
    }

    const verificationResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const verificationData = await verificationResponse.json()

    if (verificationData.success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      console.error('Turnstile verification failed:', verificationData)
      return new Response(JSON.stringify({ success: false, errors: verificationData['error-codes'] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

  } catch (error) {
    console.error('Error verifying token:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
