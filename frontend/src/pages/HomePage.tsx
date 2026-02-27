import { useEffect, useState } from 'react'
import './HomePage.css'
import { getAuctions } from '../services/auctionService'
import AuctionCard from '../components/AuctionCard'
import AuctionDetailPage from './AuctionDetailPage'

interface Auction {
  id: number
  title: string
  description: string
  current_price: number
  start_price?: number
  end_time: string
  status: string
}

interface HomePageProps {
  token: string | null
  onLogout: () => void
}

export default function HomePage({ token, onLogout }: HomePageProps) {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedAuction, setSelectedAuction] = useState<number | null>(null)

  useEffect(() => {
    fetchAuctions()
  }, [])

  const fetchAuctions = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAuctions()
      setAuctions(data)
    } catch (err) {
      console.error(err)
      setError('Unable to load auctions')
    } finally {
      setLoading(false)
    }
  }

  if (selectedAuction) {
    return (
      <div className="home-container">
        <nav className="navbar">
          <div className="nav-content">
            <h2 className="logo">BidMaster</h2>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </nav>
        <div className="home-content">
          <AuctionDetailPage auctionId={selectedAuction} token={token} onBack={() => setSelectedAuction(null)} />
        </div>
      </div>
    )
  }

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

        {error && <div style={{ color: '#c33', margin: '12px 0' }}>{error}</div>}

        {loading ? (
          <div style={{ marginTop: 20 }}>Loading auctions...</div>
        ) : auctions.length === 0 ? (
          <div style={{ marginTop: 20, color: '#777' }}>No auctions yet</div>
        ) : (
          <div style={{ marginTop: 20, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {auctions.map(a => (
              <AuctionCard key={a.id} auction={a} onClick={() => setSelectedAuction(a.id)} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
