import { NextResponse } from 'next/server'

// Cache this endpoint for 5 minutes (300 seconds)
export const revalidate = 300

// Static catalog of available local models for the desktop app
const MODEL_CATALOG = [
  {
    id: 'phi-3-mini-4k-instruct-q4',
    sha256: 'a718d7285c5b52c0f6f43e5c54c3dc2ed32e9d2ab8111e0c2bf05ce51cf94e9f',
    size: 2390000000,
    url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
  },
  {
    id: 'llama-3-8b-instruct-q4_k_m',
    sha256: 'placeholder-hash-for-llama-3',
    size: 4920000000,
    url: 'https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct.Q4_K_M.gguf',
  },
]

export async function GET() {
  try {
    return NextResponse.json(MODEL_CATALOG)
  } catch (error) {
    console.error('Error serving model catalog:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
