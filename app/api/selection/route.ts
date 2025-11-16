import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const { type, value } = await req.json()
  const cookieStore = cookies()
  if (type === 'robot') cookieStore.set('robot_key', value)
  if (type === 'student') cookieStore.set('student_id', value)
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
