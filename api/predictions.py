# api.py
from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from scripts.load_data import load_data
from models.ml_optimizer import MLOptimizer

app = FastAPI(title="RWA Portfolio Predictions API")

# Load data once
data, prices_matrix, tx_df = load_data()
optimizer = MLOptimizer(data, prices_matrix, tx_df)
optimizer.train_models()


class SymbolsRequest(BaseModel):
    symbols: list[str] = None  # optional, if empty, return all


@app.get("/predictions")
def get_predictions(symbols: str = None):
    """
    Returns ML predictions for return, liquidity, and risk.
    symbols: comma-separated list, e.g. ?symbols=PAXG,XAUt
    """
    df = optimizer.data.copy()

    if symbols:
        symbols_list = [s.strip() for s in symbols.split(",")]
        df = df[df["symbol"].isin(symbols_list)]

    # Build output dictionary
    result = df[["symbol", "pred_return", "pred_liquidity", "pred_risk"]].to_dict(orient="records")
    return {"predictions": result}