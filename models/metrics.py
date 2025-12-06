import pandas as pd


def compute_expected_return(data):
    """
    Compute expected return for each token.
    Uses APY as a proxy if available.

    data: DataFrame with columns ['symbol', 'apy']
    Returns DataFrame with 'symbol' and 'expected_return'
    """
    data["expected_return"] = data["apy"] / 100  # convert percent to fraction
    return data[["symbol", "expected_return"]]


def compute_volatility(historical_prices):
    """
    Compute volatility from historical prices.

    historical_prices: DataFrame with columns ['timestamp', 'symbol', 'price_usd']
    Returns DataFrame with 'symbol' and 'volatility'
    """
    # Pivot to have symbols as columns
    prices_matrix = historical_prices.pivot(index="timestamp", columns="symbol", values="price_usd")

    # Compute daily returns
    daily_returns = prices_matrix.pct_change().dropna()

    # Standard deviation per symbol
    volatility = daily_returns.std()

    # Convert to DataFrame
    vol_df = pd.DataFrame({
        "symbol": volatility.index,
        "volatility": volatility.values
    })

    return vol_df
