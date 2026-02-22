CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    
    auction_id INT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    amount DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_user_id ON bids(user_id);
CREATE INDEX IF NOT EXISTS idx_bids_auction_created ON bids(auction_id, created_at DESC);
