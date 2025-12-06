# portfolio_management/scripts/test_features.py

from load_data import load_data
from portfolio_features import compute_expected_returns, compute_volatility

# Load data
data, prices_matrix = load_data()

# Compute features
data = compute_expected_returns(data)
data = compute_volatility(data, prices_matrix)

print(data[["symbol", "expected_return", "volatility", "total_supply"]])
