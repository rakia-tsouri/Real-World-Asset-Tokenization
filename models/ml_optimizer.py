import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from scipy.optimize import minimize

class MLOptimizer:
    def __init__(self, data, prices_matrix, tx_df=None, min_allocation=0.05):
        """
        data: DataFrame avec les colonnes ['symbol', 'expected_return', 'volatility', 'total_supply', ...]
        prices_matrix: DataFrame pivoté historique pour features ML
        tx_df: transactions synthetic_transfers.csv (optionnel)
        min_allocation: fraction minimale par actif pour éviter 0
        """
        self.data = data.copy()
        self.prices_matrix = prices_matrix
        self.tx_df = tx_df
        self.model_return = None
        self.model_liquidity = None
        self.model_risk = None
        self.cov_matrix = None
        self.scaler = None
        self.min_allocation = min_allocation

    def prepare_features(self):
        # Rendements journaliers
        daily_returns = self.prices_matrix.pct_change().dropna()
        self.data["hist_volatility"] = self.data["symbol"].map(daily_returns.std())
        self.data["hist_return"] = self.data["symbol"].map(daily_returns.mean())

        # Transaction features
        if self.tx_df is not None and not self.tx_df.empty:
            tx_features = self.tx_df.groupby("symbol").agg(
                total_volume=("value", "sum"),
                tx_count=("txhash", "count")
            ).reset_index()
            self.data = self.data.merge(tx_features, on="symbol", how="left")

        # Toujours créer les colonnes si elles n'existent pas
        if "total_volume" not in self.data.columns:
            self.data["total_volume"] = 0
        if "tx_count" not in self.data.columns:
            self.data["tx_count"] = 0

        # fallback si expected_return n'existe pas
        if "expected_return" not in self.data.columns:
            self.data["expected_return"] = self.data["hist_return"].fillna(0)

    def train_models(self):
        """Entraîner les modèles ML pour rendement, liquidité et risque."""
        self.prepare_features()
        feature_cols = ["hist_return", "hist_volatility", "total_supply", "total_volume", "tx_count"]
        X = self.data[feature_cols].fillna(0)

        # Normalisation
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Modèle rendement
        y_return = self.data["expected_return"].fillna(0)
        model_return = RandomForestRegressor(n_estimators=100, random_state=42)
        model_return.fit(X_scaled, y_return)
        self.model_return = model_return
        self.data["pred_return"] = model_return.predict(X_scaled)

        # Modèle liquidité
        y_liquidity = self.data["total_volume"].fillna(0)
        model_liquidity = RandomForestRegressor(n_estimators=100, random_state=42)
        model_liquidity.fit(X_scaled, y_liquidity)
        self.model_liquidity = model_liquidity
        self.data["pred_liquidity"] = model_liquidity.predict(X_scaled)

        # Modèle risque
        y_risk = self.data["hist_volatility"].fillna(0)
        model_risk = RandomForestRegressor(n_estimators=100, random_state=42)
        model_risk.fit(X_scaled, y_risk)
        self.model_risk = model_risk
        self.data["pred_risk"] = model_risk.predict(X_scaled)

        # Covariance pour optimisation
        self.cov_matrix = np.diag(self.data["hist_volatility"].fillna(0).values ** 2)

    def optimize_portfolio(self, amount_invest=1000, risk_tolerance=0.5, allowed_symbols=None, liquidity_weight=0.3):
        """Optimisation Mean-Variance avec allocations réalistes."""
        if self.model_return is None:
            self.train_models()

        df = self.data.copy()
        if allowed_symbols:
            df = df[df["symbol"].isin(allowed_symbols)]

        symbols = df["symbol"].tolist()
        mu = df["pred_return"].values
        sigma = df["pred_risk"].values
        liquidity = df["pred_liquidity"].values
        cov_matrix = np.diag(sigma ** 2)
        n = len(symbols)

        # Objective: maximize return + liquidity - risk*volatility
        def objective(weights):
            port_return = weights @ mu
            port_vol = np.sqrt(weights @ cov_matrix @ weights.T)
            port_liquidity = weights @ liquidity
            return - (port_return + liquidity_weight * port_liquidity - risk_tolerance * port_vol)

        # Contraintes: somme = 1
        constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1})

        # bornes: min_allocation ≤ poids ≤ 1
        bounds = tuple((self.min_allocation, 1) for _ in range(n))

        # init uniforme
        init_guess = np.array([1 / n] * n)

        result = minimize(objective, init_guess, bounds=bounds, constraints=constraints)
        if not result.success:
            raise Exception("Optimization failed: " + result.message)

        allocation = dict(zip(symbols, result.x * amount_invest))
        allocation_percent = {k: v * 100 / amount_invest for k, v in allocation.items()}
        return allocation_percent
        return allocation
