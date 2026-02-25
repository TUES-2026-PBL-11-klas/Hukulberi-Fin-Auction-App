interface Props {
  auction: {
    id: number;
    title: string;
    description: string;
    current_price: number;
    end_time: string;
    status: string;
  };
  onClick?: (id: number) => void;
}

export default function AuctionCard({ auction, onClick }: Props) {
  const expired = new Date(auction.end_time) <= new Date();
  return (
    <div onClick={() => onClick && onClick(auction.id)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, cursor: 'pointer', background: expired ? '#f5f5f5' : '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0 }}>{auction.title}</h4>
        <div style={{ fontSize: 12, fontWeight: 700, color: expired ? '#c33' : '#080' }}>{expired ? 'ENDED' : auction.status}</div>
      </div>
      <p style={{ color: '#666' }}>{auction.description?.substring(0, 80)}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ fontWeight: 700, color: '#007bff' }}>${auction.current_price.toFixed(2)}</div>
        <div style={{ color: '#999' }}>{new Date(auction.end_time).toLocaleString()}</div>
      </div>
    </div>
  );
}
