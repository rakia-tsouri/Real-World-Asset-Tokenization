# scripts/load_data.py
import os
import pandas as pd

# folder of this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# go up one folder → portfolio_management/
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

# path to data folder
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

def load_data():
    # --- Load main data ---
    prices = pd.read_csv(os.path.join(DATA_DIR, "prices.csv"), parse_dates=["timestamp"])
    apy = pd.read_csv(os.path.join(DATA_DIR, "apy.csv"), parse_dates=["timestamp"])
    supply = pd.read_csv(os.path.join(DATA_DIR, "total_supply.csv"), parse_dates=["timestamp"])

    # Merge data on symbol
    data = pd.merge(prices, apy, on="symbol", how="left")
    data = pd.merge(data, supply, on="symbol", how="left")

    # --- Load historical prices for volatility ---
    historical_prices = pd.read_csv(os.path.join(DATA_DIR, "historical_rwa_prices.csv"), parse_dates=["Date"])
    historical_prices.rename(columns={"Date": "timestamp", "Symbol": "symbol", "Price_USD": "price_usd"}, inplace=True)

    # Pivot to wide format (symbols as columns) for volatility calculation
    prices_matrix = historical_prices.pivot(index="timestamp", columns="symbol", values="price_usd")

    # --- Load synthetic transaction history ---
    tx_df = pd.read_csv(os.path.join(DATA_DIR, "synthetic_transfers.csv"), parse_dates=["timestamp"])

    # Compute transaction features
    tx_features = tx_df.groupby("symbol").agg(
        total_volume=("value", "sum"),
        tx_count=("txhash", "count")
    ).reset_index()

    # Merge transaction features with main data
    data = data.merge(tx_features, on="symbol", how="left").fillna(0)

    return data, prices_matrix, tx_df
