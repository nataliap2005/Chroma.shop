import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from questionnaire import QUESTIONS, QUESTIONNAIRE_VERSION, validate_questionnaire
from colorimetry import analyze
from recommender import shape_product
from hybrid import OCCASIONS, translate_shades, recommend_look
app=FastAPI(title='Chroma Shop Engine')
app.add_middleware(CORSMiddleware,allow_origins=os.getenv('SHOP_CORS','http://localhost:8101,http://localhost:5173,https://localhost,capacitor://localhost').split(','),allow_methods=['GET','POST'],allow_headers=['Content-Type','Authorization'])
class Input(BaseModel):
    answers: dict
class CatalogInput(Input):
    products: list[dict] = Field(max_length=2000)
class LookInput(CatalogInput):
    occasion: str
    budget: int = Field(ge=0,le=50000000)
class TranslateInput(BaseModel):
    products: list[dict] = Field(max_length=2000)
    product_id: str

def profile(raw):
    a=validate_questionnaire(raw); result=analyze(a)
    return dict(answers=a,analysis=result,season=result['season'],undertone=result['undertone'])
def scored(rows,p):
    out=[]
    for r in rows:
        try: out.append(shape_product(r,p))
        except (ValueError,KeyError,TypeError): continue
    return sorted(out,key=lambda r:r['compatibilidad']['score'] or 0,reverse=True)
@app.get('/health')
def health(): return {'status':'ok'}
@app.get('/api/questionnaire')
def questions(): return {'version':QUESTIONNAIRE_VERSION,'questions':QUESTIONS}
@app.post('/api/analyze')
def analysis(body:Input):
    try: return profile(body.answers)
    except (ValueError,KeyError,TypeError) as e: raise HTTPException(422,str(e))
@app.post('/api/recommend')
def recommend(body:CatalogInput):
    return {'products':scored(body.products,analysis(body))}
@app.post('/api/translator')
def translator(body:TranslateInput):
    try: return translate_shades(body.products,body.product_id)
    except (ValueError,KeyError,TypeError) as e: raise HTTPException(422,str(e))
@app.post('/api/advisor')
def advisor(body:LookInput):
    if body.occasion not in OCCASIONS: raise HTTPException(422,'Ocasión inválida')
    p=analysis(body); return recommend_look(scored([r for r in body.products if r.get('stock',0)>0],p),[],p,body.occasion,body.budget)

from push import router as push_router
app.include_router(push_router)
