"""Portfolio router — holdings, summary, performance."""
from datetime import date, timedelta
import random
from fastapi import APIRouter

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

random.seed(42)

HOLDINGS = [
    {"symbol": "AAPL", "name": "Apple Inc.", "shares": 45, "avg_cost": 178.50, "current_price": 226.34, "asset_class": "Stocks"},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "shares": 30, "avg_cost": 390.00, "current_price": 465.78, "asset_class": "Stocks"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "shares": 40, "avg_cost": 175.20, "current_price": 224.90, "asset_class": "Stocks"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "shares": 25, "avg_cost": 140.10, "current_price": 191.40, "asset_class": "Stocks"},
    {"symbol": "NVDA", "name": "NVIDIA Corp.", "shares": 20, "avg_cost": 850.00, "current_price": 1195.63, "asset_class": "Stocks"},
    {"symbol": "META", "name": "Meta Platforms Inc.", "shares": 15, "avg_cost": 480.50, "current_price": 535.78, "asset_class": "Stocks"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "shares": 50, "avg_cost": 245.80, "current_price": 252.63, "asset_class": "Stocks"},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "shares": 35, "avg_cost": 185.40, "current_price": 215.82, "asset_class": "Stocks"},
    {"symbol": "V", "name": "Visa Inc.", "shares": 25, "avg_cost": 270.60, "current_price": 295.12, "asset_class": "Stocks"},
    {"symbol": "BND", "name": "Vanguard Total Bond Market ETF", "shares": 80, "avg_cost": 72.80, "current_price": 73.45, "asset_class": "Bonds"},
    {"symbol": "AGG", "name": "iShares Core US Aggregate Bond", "shares": 60, "avg_cost": 98.50, "current_price": 99.12, "asset_class": "Bonds"},
    {"symbol": "BTC", "name": "Bitcoin", "shares": 0.15, "avg_cost": 62000.00, "current_price": 68500.00, "asset_class": "Crypto"},
    {"symbol": "ETH", "name": "Ethereum", "shares": 2.5, "avg_cost": 3100.00, "current_price": 3450.00, "asset_class": "Crypto"},
]

ASSET_CLASS_COLORS = {
    "Stocks": "#4A9EFF",
    "Bonds": "#34D399",
    "Crypto": "#F59E0B",
    "Cash": "#94A3B8",
}


def _compute_holding(h: dict) -> dict:
    mkt = round(h["shares"] * h["current_price"], 2)
    gl = round(((h["current_price"] - h["avg_cost"]) / h["avg_cost"]) * 100, 2)
    return {**h, "market_value": mkt, "gain_loss_pct": gl}


def _portfolio_data():
    hold = [_compute_holding(h) for h in HOLDINGS]
    market_value = round(sum(h["market_value"] for h in hold), 2)

    cash_amount = round(market_value * 0.08, 2)
    total_with_cash = market_value + cash_amount

    daily_change = round(total_with_cash * random.uniform(-0.02, 0.025), 2)
    yesterday = total_with_cash - daily_change
    daily_change_pct = round((daily_change / yesterday) * 100, 2) if yesterday else 0

    for h in hold:
        h["allocation_pct"] = round((h["market_value"] / total_with_cash) * 100, 2) if total_with_cash else 0

    asset_map: dict[str, float] = {}
    for h in hold:
        ac = h["asset_class"]
        asset_map[ac] = asset_map.get(ac, 0) + h["market_value"]
    asset_classes = [
        {
            "name": k,
            "value": round(v, 2),
            "allocation_pct": round((v / total_with_cash) * 100, 2) if total_with_cash else 0,
            "color": ASSET_CLASS_COLORS.get(k, "#94A3B8"),
        }
        for k, v in sorted(asset_map.items(), key=lambda x: x[1], reverse=True)
    ]
    if "Cash" not in {a["name"] for a in asset_classes}:
        asset_classes.append({
            "name": "Cash",
            "value": cash_amount,
            "allocation_pct": round((cash_amount / total_with_cash) * 100, 2) if total_with_cash else 0,
            "color": ASSET_CLASS_COLORS["Cash"],
        })

    base_date = date.today() - timedelta(days=365)
    performance = []
    val = total_with_cash * 0.85
    for d in range(0, 366):
        dt = base_date + timedelta(days=d)
        change = val * random.uniform(-0.015, 0.018)
        val += change
        performance.append({"date": dt.isoformat(), "value": round(val, 2)})
    total_return_pct = round(((total_with_cash - performance[0]["value"]) / performance[0]["value"]) * 100, 2)

    return {
        "total_value": round(total_with_cash, 2),
        "daily_change": daily_change,
        "daily_change_pct": daily_change_pct,
        "total_return_pct": total_return_pct,
        "holdings": hold,
        "asset_classes": asset_classes,
        "performance": performance,
    }


@router.get("/summary")
def get_summary():
    data = _portfolio_data()
    return {
        "total_value": data["total_value"],
        "daily_change": data["daily_change"],
        "daily_change_pct": data["daily_change_pct"],
        "total_return_pct": data["total_return_pct"],
        "cash": round(data["total_value"] * 0.08, 2),
    }


@router.get("/holdings")
def get_holdings():
    return _portfolio_data()["holdings"]


@router.get("/performance")
def get_performance(period: str = "1Y"):
    days_map = {"1W": 7, "1M": 30, "3M": 90, "1Y": 365, "YTD": (date.today() - date(date.today().year, 1, 1)).days}
    days = days_map.get(period, 365)
    perf = _portfolio_data()["performance"]
    return perf[-days:] if days < len(perf) else perf


@router.get("/asset-classes")
def get_asset_classes():
    return _portfolio_data()["asset_classes"]


@router.get("/full")
def get_full_portfolio():
    return _portfolio_data()