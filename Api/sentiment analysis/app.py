# ==============================
# HOUSING SENTIMENT INDEX API
# FastAPI Application
# ==============================

from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
import json
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field, validator
import uvicorn
import os
from pathlib import Path
import logging
from enum import Enum
import tempfile
import os

# ==============================
# LOGGING SETUP
# ==============================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==============================
# MODELS
# ==============================

class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class TimePeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class HSIDataPoint(BaseModel):
    """Model for HSI data point"""
    date: str
    hsi_mean: float = Field(..., description="Mean sentiment score")
    hsi_std: Optional[float] = Field(None, description="Standard deviation")
    article_count: Optional[int] = Field(None, description="Number of articles")
    hsi_rolling: Optional[float] = Field(None, description="Rolling average")
    housing_articles: Optional[int] = Field(None, description="Housing-related articles")
    housing_ratio: Optional[float] = Field(None, description="Ratio of housing articles")

class Article(BaseModel):
    """Model for article data"""
    date: str
    sentiment: SentimentType
    sentiment_score: float
    contains_housing: bool
    text: str
    housing_keywords: List[str]

class HSIResponse(BaseModel):
    """Response model for HSI data"""
    success: bool = True
    period: TimePeriod
    data: List[HSIDataPoint]
    count: int
    description: str
    metadata: Dict[str, Any] = {}

class SummaryResponse(BaseModel):
    """Response model for summary"""
    success: bool = True
    data: Dict[str, Any]
    description: str = "Summary statistics"

class ArticlesResponse(BaseModel):
    """Response model for articles"""
    success: bool = True
    data: List[Article]
    count: int
    description: str

class KeywordsResponse(BaseModel):
    """Response model for keywords"""
    success: bool = True
    data: Dict[str, int]
    count: int
    description: str

class FilterParams(BaseModel):
    """Parameters for filtering data"""
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    min_hsi: Optional[float] = Field(None, ge=-1, le=1, description="Minimum HSI score")
    max_hsi: Optional[float] = Field(None, ge=-1, le=1, description="Maximum HSI score")
    min_articles: Optional[int] = Field(None, ge=1, description="Minimum article count")
    sentiment: Optional[SentimentType] = Field(None, description="Filter by sentiment")
    housing_only: Optional[bool] = Field(False, description="Only housing articles")
    limit: Optional[int] = Field(100, ge=1, le=1000, description="Limit results")

# ==============================
# DATA MANAGER
# ==============================

class DataManager:
    """Manages loading and accessing HSI data"""
    
    def __init__(self, data_file: str = "hsi_processed_data.json"):
        self.data_file = data_file
        self.data = {}
        self.load_data()
    
    def load_data(self):
        """Load processed data from JSON file"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            logger.info(f"✅ Data loaded from {self.data_file}")
            logger.info(f"   Articles: {self.data['summary']['total_articles']}")
            logger.info(f"   Date range: {self.data['summary']['date_range']['start']} to {self.data['summary']['date_range']['end']}")
        except FileNotFoundError:
            logger.error(f"❌ Data file {self.data_file} not found")
            self.data = {"error": "Data file not found. Run the Jupyter notebook first."}
        except Exception as e:
            logger.error(f"❌ Error loading data: {str(e)}")
            self.data = {"error": f"Error loading data: {str(e)}"}
    
    def get_weekly_hsi(self, filters: FilterParams = None) -> List[Dict]:
        """Get weekly HSI data with optional filters"""
        if "error" in self.data:
            return []
        
        data = self.data.get('weekly', [])
        return self._filter_data(data, filters)
    
    def get_monthly_hsi(self, filters: FilterParams = None) -> List[Dict]:
        """Get monthly HSI data with optional filters"""
        if "error" in self.data:
            return []
        
        data = self.data.get('monthly', [])
        return self._filter_data(data, filters)
    
    def get_daily_hsi(self, filters: FilterParams = None) -> List[Dict]:
        """Get daily HSI data with optional filters"""
        if "error" in self.data:
            return []
        
        data = self.data.get('daily', [])
        return self._filter_data(data, filters)
    
    def get_articles(self, filters: FilterParams = None) -> List[Dict]:
        """Get articles with optional filters"""
        if "error" in self.data:
            return []
        
        data = self.data.get('articles', [])
        
        # Apply filters
        filtered_data = []
        for article in data:
            # Apply housing filter
            if filters and filters.housing_only and not article['contains_housing']:
                continue
            
            # Apply sentiment filter
            if filters and filters.sentiment and article['sentiment'] != filters.sentiment.value:
                continue
            
            # Apply date filters
            if filters and filters.start_date:
                article_date = article['date'].split('T')[0] if 'T' in article['date'] else article['date']
                if article_date < filters.start_date:
                    continue
            
            if filters and filters.end_date:
                article_date = article['date'].split('T')[0] if 'T' in article['date'] else article['date']
                if article_date > filters.end_date:
                    continue
            
            filtered_data.append(article)
        
        # Apply limit
        if filters and filters.limit:
            filtered_data = filtered_data[:filters.limit]
        
        return filtered_data
    
    def get_summary(self) -> Dict:
        """Get summary statistics"""
        return self.data.get('summary', {})
    
    def get_keywords(self) -> Dict:
        """Get keyword statistics"""
        return self.data.get('keywords', {})
    
    def _filter_data(self, data: List[Dict], filters: FilterParams = None) -> List[Dict]:
        """Apply filters to HSI data"""
        if not filters:
            return data
        
        filtered_data = []
        
        for item in data:
            # Apply HSI filters
            if filters.min_hsi is not None and item.get('hsi_mean', 0) < filters.min_hsi:
                continue
            if filters.max_hsi is not None and item.get('hsi_mean', 0) > filters.max_hsi:
                continue
            
            # Apply article count filter
            if filters.min_articles is not None and item.get('article_count', 0) < filters.min_articles:
                continue
            
            # Apply date filters
            item_date = item.get('date', '')
            if 'T' in item_date:
                item_date = item_date.split('T')[0]
            
            if filters.start_date and item_date < filters.start_date:
                continue
            if filters.end_date and item_date > filters.end_date:
                continue
            
            filtered_data.append(item)
        
        # Apply limit
        if filters.limit:
            filtered_data = filtered_data[:filters.limit]
        
        return filtered_data
    
    def get_latest_hsi(self) -> Dict:
        """Get latest HSI data point"""
        weekly_data = self.get_weekly_hsi()
        if weekly_data:
            return weekly_data[-1]
        return {}

# ==============================
# APP INITIALIZATION
# ==============================

app = FastAPI(
    title="🏠 Housing Sentiment Index API",
    description="Real-time API for Housing Sentiment Index (HSI) data and analysis",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "HSI Analytics Team",
        "url": "http://localhost:8000",
        "email": "hsi@example.com"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
)

# Initialize data manager
data_manager = DataManager()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ==============================
# DEPENDENCIES
# ==============================

def get_data_manager():
    """Dependency to get data manager instance"""
    return data_manager

# ==============================
# HTML PAGES
# ==============================

@app.get("/", response_class=HTMLResponse)
async def root():
    """API landing page"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>🏠 Housing Sentiment Index API</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: white;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.95);
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                color: #333;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
            }
            .header h1 {
                color: #2196F3;
                font-size: 3rem;
                margin-bottom: 10px;
            }
            .header p {
                color: #666;
                font-size: 1.2rem;
            }
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                text-align: center;
                border-top: 4px solid #2196F3;
            }
            .stat-value {
                font-size: 2.5rem;
                font-weight: bold;
                color: #2196F3;
            }
            .stat-label {
                color: #666;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .endpoints {
                margin: 40px 0;
            }
            .endpoint-card {
                background: #f8f9fa;
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border-left: 4px solid #4CAF50;
                font-family: monospace;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .method {
                background: #4CAF50;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-weight: bold;
            }
            .path {
                flex-grow: 1;
                margin: 0 15px;
            }
            .try-btn {
                background: #2196F3;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                text-decoration: none;
                font-size: 0.9rem;
            }
            .try-btn:hover {
                background: #1976D2;
            }
            .docs-link {
                text-align: center;
                margin-top: 30px;
            }
            .docs-link a {
                display: inline-block;
                background: #FFC107;
                color: #333;
                padding: 15px 30px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
                font-size: 1.1rem;
            }
            .docs-link a:hover {
                background: #FFB300;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Housing Sentiment Index API</h1>
                <p>Real-time access to housing market sentiment analysis</p>
            </div>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value" id="total-articles">Loading...</div>
                    <div class="stat-label">Articles Analyzed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="overall-sentiment">Loading...</div>
                    <div class="stat-label">Overall Sentiment</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="housing-articles">Loading...</div>
                    <div class="stat-label">Housing Articles</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="hsi-points">Loading...</div>
                    <div class="stat-label">HSI Data Points</div>
                </div>
            </div>
            
            <h2>API Endpoints</h2>
            <div class="endpoints">
                <div class="endpoint-card">
                    <span class="method">GET</span>
                    <span class="path">/api/hsi/weekly</span>
                    <a href="/api/hsi/weekly" class="try-btn">Try it</a>
                </div>
                <div class="endpoint-card">
                    <span class="method">GET</span>
                    <span class="path">/api/hsi/monthly</span>
                    <a href="/api/hsi/monthly" class="try-btn">Try it</a>
                </div>
                <div class="endpoint-card">
                    <span class="method">GET</span>
                    <span class="path">/api/hsi/summary</span>
                    <a href="/api/hsi/summary" class="try-btn">Try it</a>
                </div>
                <div class="endpoint-card">
                    <span class="method">GET</span>
                    <span class="path">/api/hsi/articles</span>
                    <a href="/api/hsi/articles" class="try-btn">Try it</a>
                </div>
                <div class="endpoint-card">
                    <span class="method">GET</span>
                    <span class="path">/api/hsi/keywords</span>
                    <a href="/api/hsi/keywords" class="try-btn">Try it</a>
                </div>
            </div>
            
            <div class="docs-link">
                <a href="/docs">📚 View Complete API Documentation</a>
            </div>
        </div>
        
        <script>
            // Fetch summary data and update stats
            async function loadStats() {
                try {
                    const response = await fetch('/api/hsi/summary');
                    const data = await response.json();
                    
                    if (data.success) {
                        document.getElementById('total-articles').textContent = 
                            data.data.total_articles.toLocaleString();
                        document.getElementById('overall-sentiment').textContent = 
                            data.data.overall_sentiment.toFixed(3);
                        document.getElementById('housing-articles').textContent = 
                            data.data.housing_related_count.toLocaleString();
                        document.getElementById('hsi-points').textContent = 
                            data.data.hsi_statistics.weekly_points.toLocaleString();
                    }
                } catch (error) {
                    console.error('Error loading stats:', error);
                }
            }
            
            loadStats();
        </script>
    </body>
    </html>
    """

# ==============================
# API ENDPOINTS
# ==============================

@app.get("/api/hsi/weekly", response_model=HSIResponse)
async def get_weekly_hsi(
    filters: FilterParams = Depends(),
    dm: DataManager = Depends(get_data_manager)
):
    """
    Get weekly Housing Sentiment Index (HSI) data.
    
    - **start_date**: Filter data from this date (YYYY-MM-DD)
    - **end_date**: Filter data until this date (YYYY-MM-DD)
    - **min_hsi**: Minimum HSI score (-1 to 1)
    - **max_hsi**: Maximum HSI score (-1 to 1)
    - **min_articles**: Minimum article count
    - **limit**: Maximum number of results (1-1000)
    """
    data = dm.get_weekly_hsi(filters)
    
    if not data and "error" in dm.data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=dm.data["error"]
        )
    
    return HSIResponse(
        success=True,
        period=TimePeriod.WEEKLY,
        data=data,
        count=len(data),
        description="Weekly Housing Sentiment Index (HSI) data",
        metadata={
            "filters_applied": filters.dict(exclude_none=True),
            "timestamp": datetime.now().isoformat()
        }
    )

@app.get("/api/hsi/monthly", response_model=HSIResponse)
async def get_monthly_hsi(
    filters: FilterParams = Depends(),
    dm: DataManager = Depends(get_data_manager)
):
    """
    Get monthly Housing Sentiment Index (HSI) data.
    """
    data = dm.get_monthly_hsi(filters)
    
    if not data and "error" in dm.data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=dm.data["error"]
        )
    
    return HSIResponse(
        success=True,
        period=TimePeriod.MONTHLY,
        data=data,
        count=len(data),
        description="Monthly Housing Sentiment Index (HSI) data",
        metadata={
            "filters_applied": filters.dict(exclude_none=True),
            "timestamp": datetime.now().isoformat()
        }
    )

@app.get("/api/hsi/daily", response_model=HSIResponse)
async def get_daily_hsi(
    filters: FilterParams = Depends(),
    dm: DataManager = Depends(get_data_manager)
):
    """
    Get daily Housing Sentiment Index (HSI) data.
    """
    data = dm.get_daily_hsi(filters)
    
    if not data and "error" in dm.data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=dm.data["error"]
        )
    
    return HSIResponse(
        success=True,
        period=TimePeriod.DAILY,
        data=data,
        count=len(data),
        description="Daily Housing Sentiment Index (HSI) data",
        metadata={
            "filters_applied": filters.dict(exclude_none=True),
            "timestamp": datetime.now().isoformat()
        }
    )

@app.get("/api/hsi/summary", response_model=SummaryResponse)
async def get_summary(dm: DataManager = Depends(get_data_manager)):
    """
    Get summary statistics of the housing sentiment analysis.
    """
    summary = dm.get_summary()
    
    if "error" in summary:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=summary["error"]
        )
    
    return SummaryResponse(
        success=True,
        data=summary,
        description="Summary statistics of housing sentiment analysis"
    )

@app.get("/api/hsi/articles", response_model=ArticlesResponse)
async def get_articles(
    filters: FilterParams = Depends(),
    dm: DataManager = Depends(get_data_manager)
):
    """
    Get articles with sentiment analysis.
    
    - **sentiment**: Filter by sentiment type
    - **housing_only**: Return only housing-related articles
    - **start_date**: Filter by start date
    - **end_date**: Filter by end date
    - **limit**: Maximum number of articles
    """
    data = dm.get_articles(filters)
    
    if not data and "error" in dm.data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=dm.data["error"]
        )
    
    return ArticlesResponse(
        success=True,
        data=data,
        count=len(data),
        description="Articles with sentiment analysis",
    )

@app.get("/api/hsi/keywords", response_model=KeywordsResponse)
async def get_keywords(dm: DataManager = Depends(get_data_manager)):
    """
    Get housing-related keyword statistics.
    """
    keywords = dm.get_keywords()
    
    if "error" in keywords:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=keywords["error"]
        )
    
    return KeywordsResponse(
        success=True,
        data=keywords,
        count=len(keywords),
        description="Housing-related keyword statistics"
    )

@app.get("/api/hsi/latest", response_model=HSIDataPoint)
async def get_latest_hsi(dm: DataManager = Depends(get_data_manager)):
    """
    Get the latest Housing Sentiment Index (HSI) data point.
    """
    latest = dm.get_latest_hsi()
    
    if not latest and "error" in dm.data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=dm.data["error"]
        )
    
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No HSI data available"
        )
    
    return latest

@app.get("/api/hsi/timeseries")
async def get_timeseries_data(
    period: TimePeriod = Query(TimePeriod.WEEKLY, description="Time period for aggregation"),
    metric: str = Query("hsi_mean", description="Metric to return (hsi_mean, article_count, housing_ratio)"),
    dm: DataManager = Depends(get_data_manager)
):
    """
    Get timeseries data for charting.
    
    - **period**: Time period (daily, weekly, monthly)
    - **metric**: Metric to return
    """
    if period == TimePeriod.WEEKLY:
        data = dm.get_weekly_hsi()
    elif period == TimePeriod.MONTHLY:
        data = dm.get_monthly_hsi()
    else:
        data = dm.get_daily_hsi()
    
    if not data and "error" in dm.data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=dm.data["error"]
        )
    
    # Prepare timeseries data for charts
    timeseries = []
    for item in data[-100:]:  # Last 100 points for performance
        timeseries.append({
            "date": item["date"],
            "value": item.get(metric, 0)
        })
    
    return {
        "success": True,
        "period": period,
        "metric": metric,
        "data": timeseries,
        "count": len(timeseries),
        "description": f"Timeseries data for {metric}"
    }

# ==============================
# HEALTH CHECK & SYSTEM ENDPOINTS
# ==============================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "HSI API",
        "version": "2.0.0"
    }

@app.get("/system/info")
async def system_info():
    """Get system information"""
    import sys
    import platform
    
    return {
        "python_version": sys.version,
        "platform": platform.platform(),
        "api_version": "2.0.0",
        "uptime": "N/A",  # Would need to track start time
        "memory_usage": "N/A",
        "data_loaded": "error" not in data_manager.data,
        "timestamp": datetime.now().isoformat()
    }

# ==============================
# FILE DOWNLOAD ENDPOINTS
# ==============================

@app.get("/download/hsi-data")
async def download_hsi_data():
    """
    Download processed HSI data as JSON.
    """
    if "error" in data_manager.data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Data not available for download"
        )
    
    # Create a temporary file for download
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tmp:
        json.dump(data_manager.data, tmp, indent=2, default=str)
        tmp_path = tmp.name
    
    return FileResponse(
        path=tmp_path,
        filename=f"hsi_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        media_type="application/json"
    )

# ==============================
# ERROR HANDLERS
# ==============================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )

# ==============================
# APPLICATION STARTUP
# ==============================

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("🚀 Starting HSI API Server...")
    logger.info(f"📊 Data file: {data_manager.data_file}")
    logger.info("✅ API Documentation available at /docs")
    logger.info("✅ Interactive UI available at /")

# ==============================
# MAIN ENTRY POINT
# ==============================

if __name__ == "__main__":
    # Check if data file exists
    if not os.path.exists("hsi_processed_data.json"):
        print("⚠️  Warning: hsi_processed_data.json not found!")
        print("   Please run the Jupyter notebook first to process the data.")
        print("   The API will start but won't have data.")
    
    # Run the application
    print("🏠 Housing Sentiment Index API")
    print("=" * 50)
    print("Starting server...")
    print("")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🏠 Web Interface: http://localhost:8000")
    print("")
    print("Endpoints available:")
    print("  GET /api/hsi/weekly    - Weekly HSI data")
    print("  GET /api/hsi/monthly   - Monthly HSI data")
    print("  GET /api/hsi/summary   - Summary statistics")
    print("  GET /api/hsi/articles  - Article data")
    print("  GET /api/hsi/keywords  - Keyword analysis")
    print("  GET /health           - Health check")
    print("")
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )