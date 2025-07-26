// Home Page
import './App.css'
function App() {
  return (
    <>
      <div className="home">
        {/* The left side */}
          <div className='left'>
              <h1>Market</h1>
              <p>Buy and sell products</p>
              <button>Get started</button>
          </div>
        {/* The right side */}
          <div className='right'>
              <img src="/hero.jpg" alt="Hero" />
          </div>
      </div>
    </>
  )
}

export default App
