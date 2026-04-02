import { act, renderHook } from '@testing-library/react'
import { useDirectorStore } from '@/stores/directorStore'

// Mock localStorage for Zustand persist middleware in jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useDirectorStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    const { result } = renderHook(() => useDirectorStore())
    act(() => {
      result.current.resetProject()
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDirectorStore())

    expect(result.current.characters).toHaveLength(1)
    expect(result.current.characters[0]).toEqual({
      id: '1',
      name: '',
      vibe: '',
      traits: [],
      photo: null,
    })
    expect(result.current.scriptHtml).toBe('')
    expect(result.current.isProcessing).toBe(false)
  })

  it('should add a character', () => {
    const { result } = renderHook(() => useDirectorStore())

    act(() => {
      result.current.addCharacter()
    })

    expect(result.current.characters).toHaveLength(2)
    expect(result.current.characters[1].id).toBeDefined()
  })

  it('should update a character', () => {
    const { result } = renderHook(() => useDirectorStore())

    act(() => {
      result.current.updateCharacter('1', { name: 'John Doe', vibe: 'confident' })
    })

    expect(result.current.characters[0]).toEqual({
      id: '1',
      name: 'John Doe',
      vibe: 'confident',
      traits: [],
      photo: null,
    })
  })

  it('should remove a character', () => {
    const { result } = renderHook(() => useDirectorStore())

    act(() => {
      result.current.addCharacter()
      result.current.removeCharacter('1')
    })

    expect(result.current.characters).toHaveLength(1)
    expect(result.current.characters[0].id).not.toBe('1')
  })

  it('should not remove the last character', () => {
    const { result } = renderHook(() => useDirectorStore())

    act(() => {
      result.current.removeCharacter('1')
    })

    expect(result.current.characters).toHaveLength(1)
  })

  it('should update script HTML', () => {
    const { result } = renderHook(() => useDirectorStore())

    act(() => {
      result.current.setScriptHtml('<p>Test script</p>')
    })

    expect(result.current.scriptHtml).toBe('<p>Test script</p>')
  })

  it('should manage processing state', () => {
    const { result } = renderHook(() => useDirectorStore())

    act(() => {
      result.current.setProcessing(true)
    })

    expect(result.current.isProcessing).toBe(true)

    act(() => {
      result.current.setProcessing(false)
    })

    expect(result.current.isProcessing).toBe(false)
  })

  it('should manage production logs', () => {
    const { result } = renderHook(() => useDirectorStore())

    act(() => {
      result.current.addProductionLog('Test log')
    })

    expect(result.current.productionLogs).toContain('Test log')

    act(() => {
      result.current.clearProductionLogs()
    })

    expect(result.current.productionLogs).toHaveLength(0)
  })
})