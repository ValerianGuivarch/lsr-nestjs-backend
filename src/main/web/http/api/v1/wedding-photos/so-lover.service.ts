import { Injectable, InternalServerErrorException } from '@nestjs/common'

@Injectable()
export class SoLoverService {
  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  async hasChair(image: Buffer): Promise<boolean> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is missing')
    }

    // Data URL base64 (accepté par input_image.image_url)
    const b64 = image.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${b64}`

    const payload = {
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Réponds uniquement en JSON strict, sans texte autour. ' +
                'Format exact: {"has_chair": true} ou {"has_chair": false}. ' +
                'Question: dis moi si oui ou non il y a une chaise sur cette photo.'
            },
            {
              type: 'input_image',
              image_url: dataUrl
            }
          ]
        }
      ]
    }

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!r.ok) {
      const errText = await r.text().catch(() => '')
      throw new InternalServerErrorException(`OpenAI error: ${r.status} ${errText}`)
    }

    const data: any = await r.json()

    // Responses: le texte agrégé est souvent dans output_text
    const text: string =
      data.output_text ??
      (Array.isArray(data.output)
        ? data.output
            .flatMap((o: any) => o.content || [])
            .filter((c: any) => c.type === 'output_text')
            .map((c: any) => c.text)
            .join('\n')
        : '')

    // Parse JSON strict
    try {
      const parsed = JSON.parse(text)
      return Boolean(parsed?.has_chair)
    } catch {
      // fallback minimal (au cas où le modèle dévie)
      const t = (text || '').toLowerCase()
      if (t.includes('true')) return true
      if (t.includes('false')) return false
      throw new InternalServerErrorException(`Unexpected model output: ${text}`)
    }
  }
}
