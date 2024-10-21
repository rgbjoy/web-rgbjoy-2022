import { useState, useEffect } from 'react'

function useLocalStorage(key: string, initialValue: number) {
  const [storedValue, setStoredValue] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(key)
      return item ? parseInt(item, 10) : initialValue
    }
    return initialValue
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, storedValue.toString())
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue] as const
}

export default useLocalStorage
