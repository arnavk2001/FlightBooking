# Azure Web App (Linux) Deployment Guide

This guide explains how to deploy the Flight Booking Bot to Azure Web App (Linux).

## Prerequisites

1. Azure account with active subscription
2. Azure CLI installed (`az --version`)
3. Git installed
4. Python 3.8+ (for local testing)

## Architecture

- **Backend**: FastAPI application running on Linux Azure Web App
- **Frontend**: React application (built and served as static files)
- **Database**: Azure MySQL (already configured)
- **SSL**: Managed by Azure App Service

## Deployment Steps

### 1. Create Azure Web App

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP="bookingbot-rg"
APP_NAME="bookingbot-app"
LOCATION="westeurope"  # or your preferred region
PLAN_NAME="bookingbot-plan"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan (Linux)
az appservice plan create \
    --name $PLAN_NAME \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux

# Create Web App
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $PLAN_NAME \
    --name $APP_NAME \
    --runtime "PYTHON:3.11" \
    --startup-file "startup.sh"
```

### 2. Configure Application Settings

```bash
# Set environment variables
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        AMADEUS_API_KEY="your-amadeus-key" \
        AMADEUS_API_SECRET="your-amadeus-secret" \
        PAYPAL_CLIENT_ID="your-paypal-client-id" \
        PAYPAL_CLIENT_SECRET="your-paypal-secret" \
        PAYPAL_APP_NAME="ATW-Test" \
        PAYPAL_BASE_URL="https://api.sandbox.paypal.com" \
        DB_HOST="atw-db-dev.mysql.database.azure.com" \
        DB_NAME="atw_dev" \
        DB_USER="atwdevdbadmin" \
        DB_PASSWORD="your-db-password" \
        DB_PORT="3306" \
        FRONTEND_URL="https://bookingbot.abovethewings.com/bookingbot" \
        ALLOWED_ORIGINS="https://bookingbot.abovethewings.com"
```

### 3. Deploy Backend

#### Option A: Using Azure CLI (ZIP Deploy)

```bash
# Build deployment package
cd backend
zip -r ../deploy.zip . -x "venv/*" "__pycache__/*" "*.pyc" ".env"

# Deploy to Azure
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src ../deploy.zip
```

#### Option B: Using Git Deployment

```bash
# Configure local Git deployment
az webapp deployment source config-local-git \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME

# Get deployment URL
DEPLOYMENT_URL=$(az webapp deployment source show \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --query url -o tsv)

# Add remote and push
cd backend
git remote add azure $DEPLOYMENT_URL
git push azure main
```

#### Option C: Using GitHub Actions (Recommended)

See `.github/workflows/azure-deploy.yml` for CI/CD pipeline.

### 4. Deploy Frontend

The frontend needs to be built and served. Options:

#### Option A: Serve from Azure Storage + CDN
- Build React app: `npm run build`
- Upload to Azure Blob Storage
- Configure CDN

#### Option B: Serve from same Web App (Static Files)
- Build React app: `npm run build`
- Configure Azure Web App to serve static files from `/frontend/dist`
- Update `vite.config.js` base path

#### Option C: Separate Azure Static Web App
- Create Azure Static Web App
- Deploy React build output

### 5. Configure Custom Domain and SSL

```bash
# Add custom domain
az webapp config hostname add \
    --webapp-name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --hostname bookingbot.abovethewings.com

# Enable HTTPS (managed certificate)
az webapp config ssl bind \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --certificate-thumbprint <thumbprint> \
    --ssl-type SNI
```

## File Structure for Azure

```
backend/
├── app.py                 # FastAPI application
├── requirements.txt       # Python dependencies
├── startup.sh            # Azure startup script (executable)
├── .azure/
│   └── deploy.sh         # Deployment helper
└── [other backend files]
```

## Important Notes

1. **Startup Script**: Azure looks for `startup.sh` in the root of your deployment
2. **Port**: Azure sets `PORT` environment variable - use it in startup script
3. **Static Files**: Configure Azure to serve frontend build from appropriate path
4. **Environment Variables**: Set all secrets in Azure App Settings (not in code)
5. **Logging**: Azure App Service logs are available in Azure Portal

## Troubleshooting

### Check Application Logs

```bash
# Stream logs
az webapp log tail \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME

# Download logs
az webapp log download \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --log-file app-logs.zip
```

### Test Locally with Azure Settings

```bash
# Export Azure settings to local .env for testing
az webapp config appsettings list \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --query "[].{name:name, value:value}" \
    -o json > .env.azure
```

## Cost Optimization

- Use **B1** tier for development/testing
- Use **S1** or higher for production
- Consider **Consumption Plan** for serverless scaling
- Enable **Auto-scaling** based on metrics

## Security Best Practices

1. Store all secrets in Azure Key Vault
2. Enable **Managed Identity** for database access
3. Configure **IP Restrictions** if needed
4. Enable **HTTPS Only**
5. Use **Application Insights** for monitoring

## Next Steps

1. Create Azure resources using commands above
2. Deploy backend using one of the deployment options
3. Configure frontend deployment
4. Test the application
5. Set up monitoring and alerts

