import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import api from '@/services/api'

interface Features {
  [key: string]: boolean
}

const FeatureContext = createContext<Features>({})

export function FeatureProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<Features>({})

  useEffect(() => {
    api.get<Features>('/features')
      .then((res) => setFeatures(res.data))
      .catch(() => {})
  }, [])

  return (
    <FeatureContext.Provider value={features}>
      {children}
    </FeatureContext.Provider>
  )
}

export function useFeatures() {
  return useContext(FeatureContext)
}
