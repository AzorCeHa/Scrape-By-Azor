/**
 * AI Enhancer Image Editor Scraper
 * Creator: Azor Ceha
 * Date: 2026
 */

const axios = require('axios')
const CryptoJS = require('crypto-js')
const fs = require('fs')

const aeskey = 'ai-enhancer-web__aes-key'
const aesiv = 'aienhancer-aesiv'

function encrypt(obj) {
  return CryptoJS.AES.encrypt(
    JSON.stringify(obj),
    CryptoJS.enc.Utf8.parse(aeskey),
    {
      iv: CryptoJS.enc.Utf8.parse(aesiv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  ).toString()
}

const headers = {
  'Content-Type': 'application/json',
  Origin: 'https://aienhancer.ai',
  Referer: 'https://aienhancer.ai/ai-image-editor'
}

async function nsfwcheck(image) {
  const create = await axios.post('https://aienhancer.ai/api/v1/r/nsfw-detection',
    { image },
    { headers })

  const id = create.data.data.id

  for (;;) {
    await new Promise(r => setTimeout(r, 2000))

    const res = await axios.post('https://aienhancer.ai/api/v1/r/nsfw-detection/result',
      { task_id: id },
      { headers }
    )

    if (res.data.data.status === 'succeeded') {
      return res.data.data.output
    }
  }
}

async function imageditor(image, prompt) {
  const settings = encrypt({
    prompt,
    size: '2K',
    aspect_ratio: 'match_input_image',
    output_format: 'jpeg',
    max_images: 1
  })

  const create = await axios.post('https://aienhancer.ai/api/v1/k/image-enhance/create',
    {
      model: 2,
      image,
      function: 'ai-image-editor',
      settings
    },
    { headers }
  )

  const id = create.data.data.id

  for (;;) {
    await new Promise(r => setTimeout(r, 2500))

    const res = await axios.post('https://aienhancer.ai/api/v1/k/image-enhance/result',
      { task_id: id },
      { headers }
    )

    const data = res.data.data

    if (data.status === 'success') {
      return {
        id,
        output: data.output,
        input: data.input
      }
    }
  }
}

async function nanobanana(img, prompt) {
  const base64 = fs.readFileSync(img, 'base64')
  const image = `data:image/jpeg;base64,${base64}`

  const nsfw = await nsfwcheck(image)
  if (nsfw !== 'normal') {
    throw new Error('NSFW image blocked')
  }

  return await imageditor(image, prompt)
}

// Contoh penggunaan
// nanobanana('./input.jpg', 'ubah agar dia tersenyum')
// .then(console.log)
// .catch(console.error)
/*
{
  id: 'wWokCDRyuh812XYPNk5+yQRITqByISdTdCWXIRmpGROefuwOmW28x5qjlT/PXnfd',
  output: 'https://cdn.aienhancer.ai/se/aienhancer/image-enhance/wWokCDRyuh812XYPNk5-yQRITqByISdTdCWXIRmpGROefuwOmW28x5qjlT_PXnfd/output.jpeg',
  input: 'https://cdn.aienhancer.ai/se/aienhancer/image-enhancer/wWokCDRyuh812XYPNk5-yQRITqByISdTdCWXIRmpGROefuwOmW28x5qjlT_PXnfd/origin.jpeg'
}
*/

module.exports = {
  nsfwcheck,
  imageditor,
  nanobanana
}