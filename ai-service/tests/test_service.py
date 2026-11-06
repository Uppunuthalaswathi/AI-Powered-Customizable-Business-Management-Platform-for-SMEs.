from fastapi.testclient import TestClient
from app.main import app
from app.services.tabular import clean_csv
from app.services.sales import summarize_sales
from app.services.inventory import analyze_inventory

client = TestClient(app)


def test_health():
    assert client.get('/health').json()['status'] == 'ok'


def test_csv_reports_missing_numeric_date_duplicates_and_columns():
    csv = b"date,product_id,quantity_sold,unit_price,extra\nnot-a-date,P1,nope,2,x\nnot-a-date,P1,nope,2,x\n"
    result = clean_csv(csv, 'sales')
    assert result['errors']
    assert result['invalid_numeric_fields']['quantity_sold'] == 2
    assert result['invalid_dates'] == 2
    assert result['duplicate_rows'] == 1
    assert 'extra' in result['errors'][0]


def test_missing_values_reported():
    result = clean_csv(b"product_id,name,category,quantity,unit_price,reorder_level\nP1,,Tools,1,2,3\n", 'products')
    assert result['missing_values']['name'] == 1
    assert not result['valid']


def test_inventory_uses_quantity_and_threshold():
    response = client.post('/api/v1/inventory/analyze', json={'products': [
        {'product_id':'P1','name':'Low','category':'A','quantity':2,'unit_price':1,'reorder_level':3},
        {'product_id':'P2','name':'Empty','category':'A','quantity':0,'unit_price':1,'reorder_level':3},
        {'product_id':'P3','name':'Ok','category':'A','quantity':4,'unit_price':1,'reorder_level':3}]})
    data = response.json()['data']
    assert [p['product_id'] for p in data['low_stock']] == ['P1']
    assert [p['product_id'] for p in data['out_of_stock']] == ['P2']


def test_insufficient_forecast_history():
    response = client.post('/api/v1/forecast', json={'dates':['2026-01-01'], 'quantities':[2]})
    assert response.json()['data']['available'] is False
    assert 'Insufficient' in response.json()['data']['message']


def test_csv_bom_aliases_and_invalid_numeric():
    result = clean_csv('\ufeffSKU,Product Name,Category,Stock,Price\nA,Widget,Tools,-1,2\n'.encode(), 'products')
    assert result['columns'] == ['product_id', 'name', 'category', 'quantity', 'unit_price']
    assert result['invalid_numeric_fields']['quantity'] == 1
    assert result['valid'] is False


def test_csv_rejects_duplicate_inventory_sku_and_accepts_optional_threshold():
    duplicate = clean_csv(b' SKU ,name,category,quantity,price\nA,One,Tools,2,4\na,Two,Tools,3,4\n', 'products')
    assert not duplicate['valid']
    assert any('Duplicate product identifiers' in item for item in duplicate['errors'])
    valid = clean_csv(b'sku,name,category,quantity,price\nA,One,Tools,2,4\n', 'products')
    assert valid['valid'] and valid['rows'][0]['product_id'] == 'A'


def test_empty_csv_and_missing_required_columns():
    assert not clean_csv(b'', 'sales')['valid']
    result = clean_csv(b'date,sku\n2026-01-01,A\n', 'sales')
    assert any('Required columns missing' in item for item in result['errors'])


def test_inventory_summary_and_sales_totals():
    summary = analyze_inventory([{'product_id':'A','name':'A','category':'Tools','quantity':2,'unit_price':3,'reorder_level':2}])
    assert len(summary['low_stock']) == 1 and summary['inventory_value'] == 6
    sales = summarize_sales([{'date':'2026-01-01','product_id':'A','quantity_sold':2,'unit_price':3}])
    assert sales['revenue'] == 6 and sales['units_sold'] == 2
    assert len(sales['trends']['daily']) == 1


def test_preview_route_reports_invalid_rows():
    response = client.post('/api/v1/ingestion/csv/products/preview', files={'file': ('products.csv', b'sku,name,category,quantity,price\nA,X,Tools,-2,4', 'text/csv')})
    assert response.status_code == 200
    assert response.json()['success'] is False
