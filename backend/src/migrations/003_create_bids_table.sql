CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    
    auction_id INT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    amount DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bids_auction_id ON bids(auction_id);
CREATE INDEX idx_bids_user_id ON bids(user_id);
CREATE INDEX idx_bids_auction_created ON bids(auction_id, created_at DESC);

CREATE UNIQUE INDEX idx_bids_auction_user ON bids(auction_id, user_id) WHERE amount = (
    SELECT MAX(amount) FROM bids b2 WHERE b2.auction_id = bids.auction_id
);
