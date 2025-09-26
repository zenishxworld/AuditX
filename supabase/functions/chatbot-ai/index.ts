// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Parse request body
    const { message, history, session_id } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Check user's plan limits
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Check if user has reached their message limit
    const { data: messageCount, error: countError } = await supabaseClient
      .from('chat_sessions')
      .select('messages')
      .eq('user_id', user.id)

    if (countError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check message limits' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Calculate total messages
    let totalMessages = 0
    messageCount.forEach(session => {
      if (session.messages && Array.isArray(session.messages)) {
        totalMessages += session.messages.length
      }
    })

    // Check limits based on plan
    const plan = userProfile.plan || 'Free'
    if (plan === 'Free' && totalMessages >= 50) {
      return new Response(
        JSON.stringify({ 
          error: 'Message limit reached. Please upgrade your plan for unlimited messages.',
          limit_reached: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

    // Process the message and generate a response
    // In a real implementation, this would call an AI service like OpenAI
    // For this example, we'll simulate a response
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate a response based on the message
    let response = ""
    
    if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
      response = "Hello! How can I assist you with smart contract security today?"
    } 
    else if (message.toLowerCase().includes("reentrancy")) {
      response = "Reentrancy attacks occur when a function makes an external call to another untrusted contract before it resolves its state. To prevent this:\n\n1. Use the Checks-Effects-Interactions pattern\n2. Implement reentrancy guards\n3. Consider using OpenZeppelin's ReentrancyGuard\n\nWould you like to see a code example of a secure implementation?"
    }
    else if (message.toLowerCase().includes("audit")) {
      response = "AuditX provides comprehensive smart contract audits that check for common vulnerabilities including:\n\n- Reentrancy attacks\n- Integer overflow/underflow\n- Access control issues\n- Gas optimization problems\n- Logic errors\n\nYou can submit your contract for audit through the Audit page. Would you like me to explain any specific vulnerability in more detail?"
    }
    else if (message.toLowerCase().includes("solidity")) {
      response = "Solidity is the primary programming language for Ethereum smart contracts. When writing secure Solidity code, remember to:\n\n- Use the latest stable compiler version\n- Implement proper access controls\n- Be careful with external calls\n- Use SafeMath for arithmetic operations in versions before 0.8.0\n- Follow established patterns and use audited libraries like OpenZeppelin\n\nDo you have a specific Solidity question I can help with?"
    }
    else {
      response = "Thank you for your message. I'm an AI assistant specialized in blockchain security and smart contract development. I can help with:\n\n- Smart contract security best practices\n- Code vulnerability analysis\n- Solidity programming questions\n- Blockchain concepts and standards\n\nPlease feel free to ask specific questions about your smart contract needs!"
    }

    // Log the interaction
    await supabaseClient
      .from('chat_interactions')
      .insert([
        { 
          user_id: user.id,
          session_id,
          user_message: message,
          ai_response: response,
        }
      ])

    // Return the response
    return new Response(
      JSON.stringify({ message: response }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

/* To invoke:
curl -i --location --request POST 'http://localhost:54321/functions/v1/chatbot-ai' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  --header 'Content-Type: application/json' \
  --data '{"message":"Hello"}'
*/