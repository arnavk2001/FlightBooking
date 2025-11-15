# Azure Web App (Linux) Deployment Guide

## ✅ Compatibility Confirmation

**Yes, this application is fully compatible with Linux Azure Web App!**

### Why it works:
- ✅ **Backend**: FastAPI + uvicorn (cross-platform Python)
- ✅ **Database**: Azure MySQL (already configured)
- ✅ **Dependencies**: All Python packages are cross-platform
- ✅ **Scripts**: Linux shell scripts already exist (`start-production.sh`, `setup.sh`)
- ✅ **No Windows-specific code**: Application uses standard Python libraries

## Quick Deployment Steps

### 1. Create Azure Web App (Linux)

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

# Create Web App with Python 3.11
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $PLAN_NAME \
    --name $APP_NAME \
    --runtime "PYTHON:3.11" \
    --startup-file "startup.sh"
```

### 2. Configure Application Settings

```bash
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        AMADEUS_API_KEY="your-amadeus-key" \
        AMADEUS_API_SECRET="your-amadeus-secret" \
        PAYPAL_CLIENT_ID="ASkRPT_YMf4uWMpfwOUOB1BIhdeZZOUNQNuhWoTN4FDwBOpZeDSjq3vBkxkU-ZsQWxJEhuHmLkS_rzwo" \
        PAYPAL_CLIENT_SECRET="EIs_KY59iOybbr6uT9Tx4qNHPPDwzOf7U1hXq7WCaSnufK6OWmjVn7HdOxuB3QDTHwoMxjZokihPz-s-" \
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

#### Option A: ZIP Deploy (Quick)

```bash
cd backend
zip -r ../deploy.zip . -x "venv/*" "__pycache__/*" "*.pyc" ".env" "*.bat"

az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src ../deploy.zip
```

#### Option B: Git Deployment

```bash
az webapp deployment source config-local-git \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME

# Get deployment URL and push
DEPLOYMENT_URL=$(az webapp deployment source show \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --query url -o tsv)

cd backend
git remote add azure $DEPLOYMENT_URL
git push azure main
```

### 4. Deploy Frontend

The frontend needs to be built and served. Choose one:

#### Option A: Serve from Azure Web App (Static Files)

1. Build React app:
```bash
cd frontend
npm install
npm run build
```

2. Configure Azure to serve static files from `/home/site/wwwroot/frontend/dist`

3. Update `vite.config.js` base path to match your deployment

#### Option B: Azure Static Web App (Recommended)

```bash
# Create Static Web App
az staticwebapp create \
    --name bookingbot-frontend \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Free

# Deploy from GitHub or local build
```

#### Option C: Azure Blob Storage + CDN

- Build React app
- Upload to Azure Blob Storage
- Configure CDN

## File Structure for Azure

```
backend/
├── app.py                 # FastAPI application
├── requirements.txt       # Python dependencies
├── startup.sh            # Azure startup script (executable)
└── [other backend files]

frontend/
├── dist/                 # Built React app (after npm run build)
└── [source files]
```

## Important Azure Configuration

### Startup Script (`startup.sh`)

Azure Web App looks for `startup.sh` in the root of your deployment. The file is already created and configured to:
- Use the `PORT` environment variable (Azure sets this automatically)
- Run uvicorn with 2 workers
- Listen on `0.0.0.0` (required for Azure)

### Port Configuration

Azure sets the `PORT` environment variable automatically. The `startup.sh` script uses it:
```bash
--port ${PORT:-8000}  # Uses Azure PORT or defaults to 8000
```

### SSL/HTTPS

Azure App Service provides:
- ✅ Free managed SSL certificates
- ✅ Automatic HTTPS redirection
- ✅ TLS 1.2+ support

No additional SSL configuration needed!

## Monitoring & Logging

### View Logs

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

### Application Insights

Enable Application Insights for monitoring:
```bash
az monitor app-insights component create \
    --app bookingbot-insights \
    --location $LOCATION \
    --resource-group $RESOURCE_GROUP

# Link to Web App
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        APPINSIGHTS_INSTRUMENTATIONKEY="<key>"
```

## Cost Optimization

- **Development**: Use **B1** tier (~$13/month)
- **Production**: Use **S1** or higher (~$70/month)
- **Auto-scaling**: Configure based on CPU/Memory metrics
- **Consumption Plan**: For serverless scaling (pay per use)

## Security Best Practices

1. **Store secrets in Azure Key Vault**:
```bash
# Create Key Vault
az keyvault create \
    --name bookingbot-vault \
    --resource-group $RESOURCE_GROUP

# Store secrets
az keyvault secret set \
    --vault-name bookingbot-vault \
    --name PayPalClientSecret \
    --value "your-secret"
```

2. **Enable Managed Identity** for database access
3. **Configure IP Restrictions** if needed
4. **Enable HTTPS Only**
5. **Set up Application Insights** for monitoring

## Differences from Windows IIS

| Feature | Windows IIS | Linux Azure Web App |
|---------|-------------|---------------------|
| **SSL** | Manual certificate binding | Free managed certificates |
| **Startup** | Batch scripts (.bat) | Shell scripts (.sh) |
| **Port** | Fixed (8000) | Dynamic (PORT env var) |
| **Scaling** | Manual | Auto-scaling available |
| **Cost** | Higher | Lower (especially B1 tier) |
| **Deployment** | Manual file copy | Git/ZIP/CI-CD |

## Troubleshooting

### Application Not Starting

1. Check logs:
```bash
az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME
```

2. Verify `startup.sh` is executable:
```bash
# In Azure, startup.sh should have execute permissions
chmod +x startup.sh
```

3. Check Python version:
```bash
az webapp config show \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --query linuxFxVersion
```

### Database Connection Issues

- Verify Azure MySQL firewall allows Azure services
- Check SSL connection settings in `database.py`
- Verify credentials in App Settings

### PayPal API Issues

- Verify credentials are set correctly
- Check SSL certificate validation (should work automatically)
- Review logs for specific error messages

## Next Steps

1. ✅ Create Azure resources using commands above
2. ✅ Deploy backend using ZIP or Git
3. ✅ Configure frontend deployment
4. ✅ Test the application
5. ✅ Set up monitoring and alerts
6. ✅ Configure custom domain and SSL

## Support

For Azure-specific issues:
- Azure Portal: https://portal.azure.com
- Azure CLI Docs: https://docs.microsoft.com/cli/azure/
- App Service Docs: https://docs.microsoft.com/azure/app-service/

