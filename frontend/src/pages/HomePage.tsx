import './HomePage.css'

interface HomePageProps {
  onLogout: () => void
}

export default function HomePage({ onLogout }: HomePageProps) {
  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-content">
          <h2 className="logo">BidMaster</h2>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="home-content">
        <h1>Welcome to BidMaster</h1>
        <p>Your favorite online auction platform</p>
        
        <div className="features">
          <div className="feature-card">
            <h3>🏆 Bid Smart</h3>
            <p>Participate in exciting auctions and bid on unique items</p>
          </div>
          <div className="feature-card">
            <h3>📊 Track Auctions</h3>
            <p>Keep track of your bids and auction progress</p>
          </div>
          <div className="feature-card">
            <h3>⚡ Fast & Secure</h3>
            <p>Safe transactions with real-time updates</p>
          </div>
        </div>

        <div className="placeholder">
          <h2>Coming Soon</h2>
          <p>Auctions section will be available here</p>
          <p style={{ fontSize: '0.9em', marginTop: '10px' }}>Feel free to expand this page! 🚀</p>
        </div>
      </div>
    </div>
  )
}
