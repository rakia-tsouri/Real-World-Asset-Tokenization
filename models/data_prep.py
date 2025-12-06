import pandas as pd

def prepare_portfolio_data(prices_df, apy_df, supply_df, categories_df=None):
    """
    Merge all data needed for portfolio optimization.

    Parameters:
        prices_df: historical prices, columns ["timestamp", "symbol", "price_usd"]
        apy_df: APY data, columns ["timestamp", "symbol", "apy"]
        supply_df: total supply, columns ["timestamp", "symbol", "total_supply"]
        categories_df: optional, columns ["symbol", "category"]

    Returns:
        DataFrame with columns:
        ["symbol", "expected_return", "volatility", "total_supply", "category" (optional)]
    """

    # Compute expected return from latest APY
    latest_apy = apy_df.sort_values("timestamp").groupby("symbol").last().reset_index()
    latest_apy["expected_return"] = latest_apy["apy"] / 100

    # Compute volatility from historical prices
    prices_matrix = prices_df.pivot(index="timestamp", columns="symbol", values="price_usd")
    daily_returns = prices_matrix.pct_change().dropna()
    volatility = daily_returns.std().reset_index()
    volatility.columns = ["symbol", "volatility"]

    # Latest total supply
    latest_supply = supply_df.sort_values("timestamp").groupby("symbol").last().reset_index()

    # Merge all
    data = pd.merge(latest_apy[["symbol", "expected_return"]], volatility, on="symbol", how="left")
    data = pd.merge(data, latest_supply[["symbol", "total_supply"]], on="symbol", how="left")

    # Optional categories
    if categories_df is not None:
        data = pd.merge(data, categories_df, on="symbol", how="left")

    return data
