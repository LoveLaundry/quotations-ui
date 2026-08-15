# Business Dashboard Setup Guide

## ✅ What I've Created

### Backend (bill_service)
- **New API Endpoint**: `GET /dashboard/overview`
- **Location**: `bill_service/src/bill_service/routers/dashboard.py`
- **Documentation**: `bill_service/DASHBOARD_API.md`

### Frontend (quotations-ui)
- **New Page**: `src/features/quotations/pages/business-dashboard-page.tsx`
- **Route**: `/business-dashboard`
- **Navigation**: Added to sidebar under "Overview" section as "Business Intelligence"

---

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
cd quotations-ui
npm install recharts
```

Or if you're using the lock file:

```bash
npm install
```

### 2. Restart Services

#### Backend (bill_service):
```bash
cd bill_service
# If using uv (recommended)
uv run fastapi dev src/bill_service/main.py

# Or with venv
.\.venv\Scripts\activate
python -m uvicorn bill_service.main:app --reload --port 8001
```

#### Frontend (quotations-ui):
```bash
cd quotations-ui
npm run dev
```

### 3. Configure Environment

Make sure your `.env` file in `quotations-ui` has the bill service URL:

```env
VITE_BILL_SERVICE_URL=http://localhost:8001
```

---

## 📊 Features Included

### 1. Financial Metrics
- ✅ Total Revenue
- ✅ Collection Rate (% paid vs billed)
- ✅ Outstanding Amount
- ✅ Average Bill Value
- ✅ Bill Statistics (total/paid/pending)

### 2. Operational Metrics
- ✅ Items Processed (received/delivered)
- ✅ Average Turnaround Time (hours)
- ✅ Delivery Fulfillment Rate (%)
- ✅ Inventory Turnover
- ✅ Gate Passes Processed

### 3. Quality Metrics
- ✅ Mismatch Rate
- ✅ Error Count
- ✅ Items Checked

### 4. Client Metrics
- ✅ Active Clients
- ✅ Client Retention Rate (90-day)
- ✅ Total Clients

### 5. Visual Analytics
- ✅ Revenue Trend Line Chart
- ✅ Top 5 Clients Bar Chart

### 6. Smart Alerts
- ✅ High Outstanding (>30% of revenue)
- ✅ Low Collection Rate (<70%)
- ✅ High Mismatch Rate (>5%)
- ✅ High Inventory (>40% pending)

### 7. Period Selection
- ✅ Day / Week / Month / Quarter / Year

---

## 🎨 UI Features

### Design Elements
- **Metric Cards**: Color-coded with trend indicators (↑ ↓)
- **Alert System**: Severity-based colors (red/yellow/blue)
- **Responsive Charts**: Using Recharts library
- **Animations**: Smooth transitions with Framer Motion
- **Status Colors**:
  - 🟢 Green: Metrics meeting/exceeding benchmarks
  - 🟡 Yellow: Warning thresholds
  - 🔴 Red: Alert thresholds

### Responsive Design
- Mobile-friendly grid layout
- Collapsible sections
- Touch-optimized controls

---

## 🔗 Access Points

1. **Direct URL**: `http://localhost:5173/business-dashboard`
2. **Sidebar**: Click "Business Intelligence" under "Overview"
3. **API**: `http://localhost:8001/dashboard/overview?period=month`

---

## 📝 API Usage Examples

### Get Monthly Dashboard
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8001/dashboard/overview?period=month
```

### Get Weekly Dashboard
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8001/dashboard/overview?period=week
```

### Response Structure
```json
{
  "period": "month",
  "financial": { ... },
  "operations": { ... },
  "quality": { ... },
  "clients": { ... },
  "trends": {
    "revenue_by_date": [...],
    "top_clients": [...]
  },
  "alerts": { ... }
}
```

---

## 🐛 Troubleshooting

### Charts Not Showing
```bash
# Make sure recharts is installed
npm install recharts --save
```

### API Connection Error
1. Check bill_service is running on port 8001
2. Verify VITE_BILL_SERVICE_URL in .env
3. Check authentication token is valid

### No Data Displayed
1. Ensure you have bills/gatepasses/deliveries in the database
2. Check the selected period has data
3. Verify user has `dashboard:read` capability

### Permission Denied
- User needs `dashboard:read` capability
- Check user role and permissions in database

---

## 🎯 Industry Benchmarks

Built-in benchmarks based on research:

| Metric | Target | Excellent | Source |
|--------|--------|-----------|--------|
| Collection Rate | >70% | >85% | Intuit ERP |
| Turnaround Time | <72h | <48h | Spindle Live |
| Fulfillment Rate | >90% | >95% | Industry Standard |
| Mismatch Rate | <5% | <2% | Quality Control |
| Client Retention | >80% | >90% | B2B Services |

---

## 📚 Documentation

- **API Docs**: `bill_service/DASHBOARD_API.md`
- **Frontend Code**: `quotations-ui/src/features/quotations/pages/business-dashboard-page.tsx`
- **Backend Code**: `bill_service/src/bill_service/routers/dashboard.py`

---

## ✨ Next Steps (Optional Enhancements)

1. **Caching**: Add Redis caching (5-15 min TTL) for better performance
2. **Export**: Add PDF/Excel export functionality
3. **Filters**: Add client/date range filters
4. **Drill-down**: Click metrics to see detailed breakdown
5. **Comparisons**: Show period-over-period comparisons
6. **Goals**: Set custom target goals per metric
7. **Notifications**: Email alerts when thresholds are crossed

---

## 📞 Support

If you encounter issues:
1. Check both services are running
2. Verify environment variables
3. Check browser console for errors
4. Review API response in Network tab

---

**Status**: ✅ Ready for use after `npm install recharts`

**Created**: August 2026  
**Version**: 1.0.0
