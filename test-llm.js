import 'dotenv/config'
import { extractJobSkills } from './src/lib/llm.js'

console.log(await extractJobSkills(
  'We need a Node.js and Docker developer. Experience with MongoDB is a plus.'
))