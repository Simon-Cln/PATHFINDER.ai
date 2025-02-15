import { NextResponse } from 'next/server'

const BACKEND_URL = 'http://127.0.0.1:5000'

export async function POST(request: Request) {
  try {
    const { cvText, preferences } = await request.json()

    if (!cvText) {
      return NextResponse.json({ error: "Le CV est requis" }, { status: 400 })
    }

    try {
      const response = await fetch(`${BACKEND_URL}/analyze_cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_text: cvText, preferences })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Error calling Python backend:', error)
      return NextResponse.json(
        { error: "Le serveur d'analyse n'est pas disponible. Assurez-vous que le backend Python est en cours d'exécution sur http://127.0.0.1:5000" },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: "Erreur lors du traitement de la requête" },
      { status: 400 }
    )
  }
}
