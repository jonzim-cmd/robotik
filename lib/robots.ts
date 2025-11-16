export type Robot = { key: string; name: string }

const robots: Robot[] = [
  { key: 'rvr_plus', name: 'RVR+ Sphero' },
  { key: 'cutebot_pro', name: 'Cutebot Pro (Micro:Bit)' },
  { key: 'picarx', name: 'PiCar-X (SunFounder, Raspberry Pi 5)' },
]

export async function getRobots(): Promise<Robot[]> {
  return robots
}

