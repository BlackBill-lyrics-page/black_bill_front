import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { supabase } from './lib/supabaseClient'

function App() {
  const [count, setCount] = useState(0)

  const insertTest = async () => {
    const { data, error } = await supabase.from('test_table').insert([
      { name: '테스트 유저' }
    ])
    if (error) console.error('❌ Insert 실패:', error)
    else console.log('✅ Insert 성공:', data)
  }

  const selectTest = async () => {
    const { data, error } = await supabase.from('test_table').select('*')
    if (error) console.error('❌ Select 실패:', error)
    else console.log('✅ Select 성공:', data)
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>


        <button onClick={insertTest} style={{ marginRight: '10px' }}>
          Insert to Supabase
        </button>
        <button onClick={selectTest}>
          Select from Supabase
        </button>


      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
