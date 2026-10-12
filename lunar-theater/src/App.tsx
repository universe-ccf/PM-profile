import { TheaterProvider } from './theater/TheaterContext'
import { Shell } from './ui/Shell'

export default function App() {
  return (
    <TheaterProvider>
      <Shell />
    </TheaterProvider>
  )
}
