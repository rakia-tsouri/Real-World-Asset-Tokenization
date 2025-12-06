from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd

from scripts.load_data import load_data
from models.ml_optimizer import MLOptimizer

app = FastAPI()

# ---- Request schema ----
class PortfolioRequest(BaseModel):
    symbols: list[str]
    amount_to_invest: float
    risk_tolerance: float
    liquidity_weight: float = 0.2


@app.post("/optimize")
def optimize_portfolio(req: PortfolioRequest):

    # Load data
    data, prices_matrix, tx_df = load_data()

    # Vérifier que les symbols existent dans data
    allowed_symbols = [s for s in req.symbols if s in data["symbol"].values]
    if not allowed_symbols:
        return {"error": "None of the requested symbols exist in the data."}

    # ML optimizer
    optimizer = MLOptimizer(
        data=data,
        prices_matrix=prices_matrix,
        tx_df=tx_df,
        min_allocation=0.05
    )
    optimizer.train_models()

    # Optimize portfolio
    allocation = optimizer.optimize_portfolio(
        amount_invest=req.amount_to_invest,
        risk_tolerance=req.risk_tolerance,
        allowed_symbols=allowed_symbols,
        liquidity_weight=req.liquidity_weight
    )

    # Convertir np.float → float
    allocation_clean = {k: float(v) for k, v in allocation.items()}

    return {
        "requested_symbols": req.symbols,
        "allowed_symbols": allowed_symbols,
        "portfolio": allocation_clean
    }
