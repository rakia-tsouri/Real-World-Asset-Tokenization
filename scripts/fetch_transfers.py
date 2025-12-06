import csv
import os
import random
from datetime import datetime
from hashlib import sha1

# -------- CONFIG --------
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
os.makedirs(DATA_DIR, exist_ok=True)

TOTAL_SUPPLY_FILE = os.path.join(DATA_DIR, "total_supply.csv")
OUTPUT_FILE = os.path.join(DATA_DIR, "synthetic_transfers.csv")

NUM_WALLETS = 5  # number of fake wallets for simulation


# -------- HELPERS --------
def random_wallet():
    return "0x" + "".join(random.choices("0123456789abcdef", k=40))


def fake_txhash(symbol, ts, i):
    s = f"{symbol}{ts}{i}".encode()
    return "0x" + sha1(s).hexdigest()


# -------- MAIN --------
# Load total supply data
supply_data = []
with open(TOTAL_SUPPLY_FILE, "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        supply_data.append({
            "symbol": row["symbol"],
            "total_supply": float(row["total_supply"] or 0),
            "timestamp": row["timestamp"]
        })

# Generate synthetic transfers
transfers = []
prev_supply = {}
for row in supply_data:
    symbol = row["symbol"]
    current_supply = row["total_supply"]
    ts = row["timestamp"]

    prev = prev_supply.get(symbol, 0)
    diff = current_supply - prev

    if diff == 0:
        continue  # no change → no transfers

    # split diff into random transfers
    num_transfers = random.randint(1, NUM_WALLETS)
    amounts = [round(diff / num_transfers, 6)] * num_transfers

    for i, amt in enumerate(amounts):
        if diff > 0:
            transfers.append({
                "symbol": symbol,
                "from": "0x0000000000000000000000000000000000000000",
                "to": random_wallet(),
                "value": amt,
                "timestamp": ts,
                "txhash": fake_txhash(symbol, ts, i)
            })
        else:
            transfers.append({
                "symbol": symbol,
                "from": random_wallet(),
                "to": "0x0000000000000000000000000000000000000000",
                "value": abs(amt),
                "timestamp": ts,
                "txhash": fake_txhash(symbol, ts, i)
            })

    prev_supply[symbol] = current_supply

# Save CSV
with open(OUTPUT_FILE, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["symbol", "from", "to", "value", "timestamp", "txhash"])
    writer.writeheader()
    writer.writerows(transfers)

print(f"✅ Synthetic transfers saved → {OUTPUT_FILE}")
