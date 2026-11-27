from fastapi.testclient import TestClient
from app import app
from catalog_service import load_catalog
c=TestClient(app)
def test_engine():
    assert c.get('/health').status_code==200
    questions=c.get('/api/questionnaire').json()['questions']
    a={q['key']:q['options'][0]['value'] for q in questions};a['budget']=int(a['budget']);a['_questionnaire_version']=2
    rows=[dict(p,stock=12) for p in load_catalog()][:100]
    assert c.post('/api/analyze',json={'answers':a}).status_code==200
    assert c.post('/api/recommend',json={'answers':a,'products':rows}).status_code==200
    assert c.post('/api/advisor',json={'answers':a,'products':rows,'occasion':'universidad','budget':200000}).status_code==200
    assert c.post('/api/translator',json={'products':rows,'product_id':rows[0]['id']}).status_code==200
