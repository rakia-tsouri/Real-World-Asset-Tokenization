import csv
import os
import requests
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

COINGECKO_IDS = {
    "PAXG": "pax-gold",
    "XAUt": "tether-gold",
    "OUSG": "ousg",
    "USTB": "ustb",
    "OMMF": "ommf"
}

def get_price(symbol):
    cid = COINGECKO_IDS.get(symbol)
    if not cid:
        return None

    url = (
        f"https://api.coingecko.com/api/v3/simple/price"
        f"?ids={cid}&vs_currencies=usd"
    )
    try:
        response = requests.get(url).json()
        return response[cid]["usd"]
    except:
        return None


def save_prices():
    rows = []
    for sym in COINGECKO_IDS:
        price = get_price(sym)
        rows.append({
            "symbol": sym,
            "price_usd": price,
            "timestamp": datetime.utcnow().isoformat()
        })

    filepath = os.path.join(DATA_DIR, "prices.csv")
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, ["symbol", "price_usd", "timestamp"])
        writer.writeheader()
        writer.writerows(rows)

    print("✅ Prices saved → data/prices.csv")


if __name__ == "__main__":
    save_prices()
