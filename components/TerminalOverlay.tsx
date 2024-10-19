// components/TerminalOverlay.tsx
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import style from './terminalOverlay.module.scss'

const TerminalOverlay = ({ data }) => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [currentDirectory, setCurrentDirectory] = useState('') // New state to track current directory
  const inputRef = useRef<HTMLInputElement | null>(null)

  const router = useRouter()

  const handleInputChange = (e) => {
    setInput(e.target.value)
  }

  const posts = data.posts

  const handleInputSubmit = (e) => {
    e.preventDefault()
    const newOutput = [...output, `${prompt} ${input}`]

    if (input.trim() === '?') {
      setOutput([
        ...newOutput,
        `Welcome to the terminal.
------------------------------
?\t\t\tfor help.
ls\t\t\tlist directories.
cd <directory>\tchange directory.
clear\t\t\tclear the terminal.
exit\t\t\tclose the terminal.
------------------------------
`,
      ])
    } else if (input.trim() === 'ls') {
      if (currentDirectory.startsWith('Posts/')) {
        setOutput([...newOutput, '']) // No output for subdirectories of Posts
      } else if (currentDirectory === 'Posts') {
        setOutput([
          ...newOutput,
          `${posts.map((post) => post.slug).join('\t')}`,
        ])
      } else {
        setOutput([...newOutput, `Info\tDev\tArt\tPosts`])
      }
    } else if (input.trim() === 'cd') {
      setOutput([...newOutput, `Returning to home directory`])
      setCurrentDirectory('')
      router.push('/')
    } else if (input.trim() === 'cd Info') {
      setOutput([...newOutput, `Changing directory to Info`])
      setCurrentDirectory('Info')
      router.push('/info')
    } else if (input.trim() === 'cd Dev') {
      setOutput([...newOutput, `Changing directory to Dev`])
      setCurrentDirectory('Dev')
      router.push('/dev')
    } else if (input.trim() === 'cd Art') {
      setOutput([...newOutput, `Changing directory to Art`])
      setCurrentDirectory('Art')
      router.push('/art')
    } else if (input.trim() === 'cd Posts') {
      setOutput([...newOutput, `Changing directory to Posts`])
      setCurrentDirectory('Posts')
      router.push('/posts')
    } else if (
      currentDirectory === 'Posts' &&
      input.trim().startsWith('cd ')
    ) {
      const postSlug = input.trim().split(' ')[1]
      if (posts.some((post) => post.slug === postSlug)) {
        setOutput([...newOutput, `Changing directory to Posts/${postSlug}`])
        setCurrentDirectory(`Posts/${postSlug}`)
        router.push(`/posts/${postSlug}`)
      } else {
        setOutput([...newOutput, `Unknown post: ${postSlug}.`])
      }
    } else if (input.trim() === 'clear') {
      setOutput([])
    } else if (input.trim() === 'exit') {
      setIsOpen(false)
    } else {
      setOutput([...newOutput, `Unknown command: ${input}. Type ? for help.`])
    }
    setInput('')
  }

  const prompt = `user@rgbjoy:${currentDirectory ? `~/${currentDirectory}` : '~'}$`

  const directories = [
    'Info',
    'Dev',
    'Art',
    'Posts',
    ...posts.map((post) => post.slug),
  ]

  const handleInputKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const currentInput = input.trim()
      const match = currentInput.match(/^(.*\s)?(\S*)$/)

      if (match) {
        const prefix = match[1] || ''
        const dirInput = match[2]
        const matchingDirs = directories.filter((dir) =>
          dir.startsWith(dirInput)
        )

        if (matchingDirs.length === 1) {
          setInput(`${prefix}${matchingDirs[0]}`)
        }
      }
    }
  }

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !(inputRef.current as Node).contains(e.target as Node)
      ) {
        e.preventDefault()
        inputRef.current.focus()
      }
    }

    document.addEventListener('click', handleDocumentClick)

    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [])

  if (!isOpen)
    return (
      <div className={style.terminalButton} onClick={() => setIsOpen(true)}>
        π
      </div>
    )

  return (
    <div className={style.terminalOverlay}>
      <div className={style.terminalBody}>
        {output.map((line, index) => (
          <div key={index} className={style.terminalOutput}>
            {line.split('\n').map((part, i) => (
              <div key={i}>{part}</div>
            ))}
          </div>
        ))}
        <form onSubmit={handleInputSubmit} className={style.terminalForm}>
          <span className={style.prompt}>{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={style.terminalInput}
            autoFocus
          />
        </form>
      </div>
    </div>
  )
}

export default TerminalOverlay
