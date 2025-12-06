import csv
import os
import time
import requests
from datetime import datetime
from web3 import Web3

# ---------- CONFIG ----------



# directory of this script: portfolio_manager/scripts/
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# go up one folder → portfolio_manager/
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

# point to portfolio_manager/data/
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

# create data folder if missing
os.makedirs(DATA_DIR, exist_ok=True)

RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/Em2PdT2zA2hmplSUtpENx"
web3 = Web3(Web3.HTTPProvider(RPC_URL))

TARGET_SYMBOLS = ["OUSG", "USTB", "OMMF", "PAXG", "XAUt", "USDY", "BENJI", "CMT"]

TOKENS = [
    {"symbol": "OUSG", "contract": "0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92"},
    {"symbol": "PAXG", "contract": "0x45804880De22913dAFE09f4980848ECE6EcbAf78"},
    {"symbol": "XAUt", "contract": "0x68749665FF8D2d112Fa859AA293F07A622782F38"},
    {"symbol": "USTB", "contract": "0x43415eB6ff9DB7E26A15b704e7A3eDCe97d31C4e"},
    {"symbol": "OMMF", "contract": "0xe00e79c24B9Bd388fbf1c4599694C2cf18166102"},
]

ERC20_ABI = [
    {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "totalSupply", "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
]

TOTAL_SUPPLY_FILE = os.path.join(DATA_DIR, "total_supply.csv")
APY_FILE = os.path.join(DATA_DIR, "apy.csv")
SECONDS_IN_YEAR = 365 * 24 * 3600
DEFAULT_APY = 2
SIMULATED_INCREMENT = 0.0005

# ---------- FUNCTIONS ----------
def fetch_apy_from_llama():
    """Fetch APY data from Llama API for TARGET_SYMBOLS."""
    url = "https://yields.llama.fi/pools"
    data = requests.get(url).json()["data"]
    apy_dict = {}
    for pool in data:
        sym = pool.get("symbol", "").upper()
        if sym in TARGET_SYMBOLS:
            apy_dict[sym] = {
                "apy": pool.get("apy"),
                "apy_base": pool.get("apyBase"),
                "project": pool.get("project"),
                "chain": pool.get("chain")
            }
    return apy_dict

def fetch_total_supply(symbol):
    token = next((t for t in TOKENS if t["symbol"] == symbol), None)
    if not token:
        return 0
    contract = web3.eth.contract(address=web3.to_checksum_address(token["contract"]), abi=ERC20_ABI)
    decimals = contract.functions.decimals().call()
    return contract.functions.totalSupply().call() / (10 ** decimals)

def load_previous_supply():
    if not os.path.exists(TOTAL_SUPPLY_FILE):
        return {}
    prev = {}
    with open(TOTAL_SUPPLY_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            prev[row["symbol"]] = {
                "total_supply": float(row["total_supply"]),
                "timestamp": datetime.fromisoformat(row["timestamp"])
            }
    return prev

def load_previous_apy():
    if not os.path.exists(APY_FILE):
        return {}
    prev = {}
    with open(APY_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            prev[row["symbol"]] = float(row.get("apy") or DEFAULT_APY)
    return prev

def calculate_dynamic_apy(prev_supply, current_supply, prev_time, prev_run_apy):
    """Calculate APY from supply change or increment previous if no growth."""
    if prev_supply <= 0 or current_supply <= 0:
        return prev_run_apy + SIMULATED_INCREMENT

    elapsed_seconds = (datetime.utcnow() - prev_time).total_seconds()
    if elapsed_seconds <= 0:
        return prev_run_apy + SIMULATED_INCREMENT

    growth_factor = current_supply / prev_supply
    if growth_factor <= 1:
        return prev_run_apy + SIMULATED_INCREMENT

    apy = (growth_factor ** (SECONDS_IN_YEAR / elapsed_seconds) - 1) * 100
    if apy <= 0:
        return prev_run_apy + SIMULATED_INCREMENT

    return round(apy, 5)

def save_total_supply(data):
    with open(TOTAL_SUPPLY_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["symbol", "total_supply", "timestamp"])
        writer.writeheader()
        writer.writerows(data)

def save_apy(data):
    with open(APY_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["symbol", "project", "chain", "apy", "apy_base", "timestamp"])
        writer.writeheader()
        writer.writerows(data)

# ---------- MAIN SCRIPT ----------
llama_data = fetch_apy_from_llama()
previous_supply = load_previous_supply()
previous_apy = load_previous_apy()

apy_output = []
new_supply_data = []

for sym in TARGET_SYMBOLS:
    llama = llama_data.get(sym, {})
    api_apy = llama.get("apy")
    api_apy_base = llama.get("apy_base")

    current_supply = fetch_total_supply(sym)
    prev_info = previous_supply.get(sym)
    prev_run_apy = previous_apy.get(sym, DEFAULT_APY)

    if api_apy is not None and api_apy > 0:
        # API provides valid APY → use it
        apy = api_apy
        apy_base = api_apy_base or api_apy
    else:
        # Dynamic calculation from supply or increment previous
        if prev_info:
            apy = calculate_dynamic_apy(prev_info["total_supply"], current_supply, prev_info["timestamp"], prev_run_apy)
        else:
            apy = prev_run_apy + SIMULATED_INCREMENT
        apy_base = apy

    apy_output.append({
        "symbol": sym,
        "project": llama.get("project"),
        "chain": llama.get("chain"),
        "apy": round(apy, 5),
        "apy_base": round(apy_base, 5),
        "timestamp": datetime.utcnow().isoformat()
    })

    new_supply_data.append({
        "symbol": sym,
        "total_supply": current_supply,
        "timestamp": datetime.utcnow().isoformat()
    })

    time.sleep(1)

save_total_supply(new_supply_data)
save_apy(apy_output)

print(f"✅ APY fetched and calculated → {APY_FILE}")
print(f"✅ Total supply updated → {TOTAL_SUPPLY_FILE}")
