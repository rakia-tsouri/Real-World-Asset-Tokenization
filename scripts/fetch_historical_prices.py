from pycoingecko import CoinGeckoAPI
import datetime
import pandas as pd
import time
from pathlib import Path

# --- 1. CONFIGURATION CORRIGÉE ---
TOKENS = [
    # IDs vérifiés qui fonctionnent pour la récupération d'historique (moins de 365 jours)
    {"symbol": "PAXG", "id": "pax-gold", "contract": "0x45804880De22913dAFE09f4980848ECE6EcbAf78"},
    {"symbol": "XAUt", "id": "tether-gold", "contract": "0x68749665FF8D2d112Fa859AA293F07A622782F38"},

    # Les autres tokens (OUSG, USTB, OMMF) sont exclus car les IDs sont incorrects
    # ou le token est trop récent/n'est pas listé sur l'API publique CoinGecko.
]

# Correction de la Période : Maximum 365 jours pour l'API publique gratuite
DAYS = 365

# Définition du chemin d'enregistrement (dans le répertoire 'data' au niveau du root)
# Path(your_script_path).parent.parent correspond au répertoire 'portfolio_management'
DATA_DIR = Path(__file__).resolve().parent.parent / 'data'
OUTPUT_FILENAME = "historical_rwa_prices.csv"
OUTPUT_PATH = DATA_DIR / OUTPUT_FILENAME


# --- 2. FONCTION DE TÉLÉCHARGEMENT ET FILTRAGE ---

def fetch_and_filter_prices(token_list):
    """Récupère l'historique CoinGecko et filtre les données pour un point mensuel."""
    cg = CoinGeckoAPI()
    all_prices = []
    last_month_record = {}

    print(f"Démarrage de la récupération de l'historique sur {DAYS} jours (Max API)...")

    for token in token_list:
        symbol = token['symbol']
        cg_id = token['id']

        print(f"\n-> Récupération de {symbol} ({cg_id})...")

        try:
            # Récupération des données jusqu'à 365 jours
            data = cg.get_coin_market_chart_by_id(
                id=cg_id,
                vs_currency='usd',
                days=DAYS
            )

            prices = data['prices']
            last_month_record[symbol] = None

            # Filtrer pour obtenir un seul point par mois
            for timestamp, price in prices:
                date = datetime.datetime.fromtimestamp(timestamp / 1000)

                if last_month_record[symbol] is None or date.month != last_month_record[symbol].month:
                    all_prices.append({
                        'Date': date.strftime('%Y-%m-%d'),
                        'Symbol': symbol,
                        'Price_USD': round(price, 4)
                    })
                    last_month_record[symbol] = date

            print(
                f"   {len(prices)} points récupérés. {len([p for p in all_prices if p['Symbol'] == symbol])} points mensuels enregistrés.")

        except Exception as e:
            print(f"   Erreur lors de la récupération de {symbol} : {e}. Le token est ignoré.")

        time.sleep(1.5)

    return pd.DataFrame(all_prices)


# --- 3. EXÉCUTION ET SAUVEGARDE ---

if __name__ == "__main__":

    # Assurez-vous que le répertoire 'data' existe
    DATA_DIR.mkdir(exist_ok=True)

    df = fetch_and_filter_prices(TOKENS)

    if not df.empty:
        # Trier le DataFrame par Date et Symbole
        df = df.sort_values(by=['Date', 'Symbol'])

        # Sauvegarder en CSV dans le chemin spécifié
        df.to_csv(OUTPUT_PATH, index=False)

        print(f"\n🎉 Succès ! Le fichier historique a été sauvegardé sous : {OUTPUT_PATH}")
        print("Aperçu des 10 dernières données enregistrées:")
        print(df.tail(10))
    else:
        print("\n🚫 Échec de la récupération des données. Le fichier CSV n'a pas été créé.")