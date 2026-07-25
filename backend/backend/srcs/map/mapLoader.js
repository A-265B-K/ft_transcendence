import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const content = fs.readFileSync(path.join(__dirname, 'mapConf.json'), 'utf-8')
const MAP_TEMPLATE = JSON.parse(content)

export { MAP_TEMPLATE }